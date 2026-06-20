import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findPackageByAmountCents,
  findPackageByKiwifyProductId,
  TokenPackage,
} from "@/lib/billing/packages";

/**
 * Webhook da Kiwify — recebe eventos de compra/assinatura e libera/retira
 * tokens dos usuários automaticamente.
 *
 * SEGURANÇA: a Kiwify autentica o webhook por um token que ela mesma anexa
 * como query string na URL configurada no painel (?token=...), NÃO por
 * assinatura HMAC em header. Validamos comparando com KIWIFY_WEBHOOK_TOKEN
 * configurado nas variáveis de ambiente do Vercel.
 *
 * IDEMPOTÊNCIA: a Kiwify pode reenviar o mesmo evento (timeouts, retries).
 * Usamos o `order_id` da venda como chave de deduplicação — se já
 * processamos esse pedido com sucesso antes, não duplicamos tokens.
 *
 * Eventos tratados:
 * - compra_aprovada      → credita tokens (avulso) ou ativa assinatura
 * - compra_reembolsada   → debita os tokens daquela compra (se ainda não usados) e marca o estorno
 * - chargeback           → mesmo tratamento de reembolso, com motivo diferente
 * - subscription_renewed → credita os tokens do novo ciclo da assinatura
 * - subscription_canceled→ marca assinatura como cancelada (não retira tokens já creditados)
 * - subscription_late    → marca assinatura como pagamento atrasado (past_due)
 */

const KIWIFY_WEBHOOK_TOKEN = process.env.KIWIFY_WEBHOOK_TOKEN;

interface KiwifyCustomer {
  email?: string;
  full_name?: string;
}

interface KiwifyProduct {
  product_id?: string;
  product_name?: string;
}

interface KiwifySubscription {
  id?: string;
  start_date?: string;
  next_payment?: string;
  status?: string;
}

interface KiwifyWebhookPayload {
  order_id?: string;
  order_status?: string;
  webhook_event_type?: string;
  payment_method?: string;
  Customer?: KiwifyCustomer;
  Product?: KiwifyProduct;
  Subscription?: KiwifySubscription;
  charge_amount?: number; // valor em centavos cobrado nesta transação
  amount?: number; // alguns payloads trazem aqui em vez de charge_amount
  product_id?: string;
  [key: string]: unknown;
}

function extractAmountCents(payload: KiwifyWebhookPayload): number | null {
  const raw = payload.charge_amount ?? payload.amount;
  if (typeof raw === "number") return Math.round(raw);
  return null;
}

function extractEventType(payload: KiwifyWebhookPayload): string {
  // A Kiwify usa nomes diferentes dependendo da versão/configuração do
  // webhook — tentamos os campos mais comuns nesta ordem.
  return (
    payload.webhook_event_type ||
    payload.order_status ||
    "desconhecido"
  ).toLowerCase();
}

function resolvePackage(payload: KiwifyWebhookPayload): TokenPackage | undefined {
  const productId = payload.Product?.product_id ?? payload.product_id;
  if (productId) {
    const byProduct = findPackageByKiwifyProductId(productId);
    if (byProduct) return byProduct;
  }
  const amountCents = extractAmountCents(payload);
  if (amountCents !== null) {
    return findPackageByAmountCents(amountCents);
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  if (!KIWIFY_WEBHOOK_TOKEN) {
    console.error("KIWIFY_WEBHOOK_TOKEN não configurado nas variáveis de ambiente.");
    return NextResponse.json({ error: "Webhook não configurado no servidor." }, { status: 500 });
  }

  // ── 1. Ler o corpo bruto ANTES de qualquer parse ────────────────────
  // A assinatura HMAC da Kiwify é calculada sobre os bytes exatos do
  // corpo da requisição — se primeiro fizéssemos request.json() e depois
  // tentássemos recalcular a partir do objeto parseado, a formatação
  // (espaços, ordem de chaves) poderia não bater byte a byte com o que a
  // Kiwify assinou, invalidando a verificação mesmo com o segredo certo.
  const rawBody = await request.text();

  // ── 2. Validação via assinatura HMAC-SHA1 ───────────────────────────
  // A Kiwify NÃO envia o token em texto puro — ela envia, na query string,
  // um parâmetro `signature` contendo o HMAC-SHA1 (hex, 40 caracteres) do
  // corpo da requisição, calculado usando o token do webhook como chave
  // secreta. Validamos recalculando o mesmo HMAC e comparando.
  const url = new URL(request.url);
  const signatureRecebida = url.searchParams.get("signature");
  // Mantemos compatibilidade com a possibilidade de a Kiwify (ou um envio
  // manual de teste) mandar o token puro em "?token=", caso esse formato
  // também seja usado em algum cenário.
  const tokenPuroRecebido = url.searchParams.get("token");

  let assinaturaValida = false;

  if (signatureRecebida) {
    const hmacCalculado = crypto
      .createHmac("sha1", KIWIFY_WEBHOOK_TOKEN)
      .update(rawBody)
      .digest("hex");
    // Comparação em tempo constante, só quando os tamanhos já coincidem
    // (timingSafeEqual lança erro se os buffers tiverem tamanhos
    // diferentes, então checamos isso antes).
    assinaturaValida =
      hmacCalculado.length === signatureRecebida.length &&
      crypto.timingSafeEqual(Buffer.from(hmacCalculado), Buffer.from(signatureRecebida));
  } else if (tokenPuroRecebido) {
    assinaturaValida = tokenPuroRecebido === KIWIFY_WEBHOOK_TOKEN;
  }

  if (!assinaturaValida) {
    // DIAGNÓSTICO TEMPORÁRIO: mostra o HMAC que CALCULAMOS ao lado do que
    // FOI RECEBIDO, para confirmar com certeza se a hipótese (HMAC-SHA1
    // do corpo, usando o token como chave) está correta. Não expõe o
    // token em si, só os dois hashes resultantes (que não permitem
    // recuperar o token).
    const hmacParaDebug = crypto.createHmac("sha1", KIWIFY_WEBHOOK_TOKEN).update(rawBody).digest("hex");
    console.warn(
      `Webhook Kiwify recebido com assinatura/token inválido. signature recebida: [${signatureRecebida ?? "ausente"}] | HMAC-SHA1 calculado por nós: [${hmacParaDebug}] | token presente: ${!!tokenPuroRecebido}`
    );
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  // ── 3. Parse do payload (já validado) ───────────────────────────────
  let payload: KiwifyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload inválido (JSON malformado)." }, { status: 400 });
  }

  const eventType = extractEventType(payload);
  const orderId = payload.order_id ?? null;
  const customerEmail = payload.Customer?.email?.toLowerCase().trim() ?? null;

  // ── 3. Log de auditoria (sempre, mesmo se falhar depois) ───────────
  const { data: logEntry, error: logError } = await supabase
    .from("kiwify_webhook_log")
    .insert({
      kiwify_order_id: orderId,
      event_type: eventType,
      payload: payload as Record<string, unknown>,
      processed: false,
    })
    .select("id")
    .single();

  if (logError) {
    console.error("Falha ao registrar log do webhook Kiwify:", logError);
    // Continua o processamento mesmo se o log falhar — não podemos perder
    // a liberação de tokens do cliente por um problema de auditoria.
  }

  const logId = logEntry?.id as string | undefined;

  const markProcessed = async (userId: string | null, error?: string) => {
    if (!logId) return;
    await supabase
      .from("kiwify_webhook_log")
      .update({ processed: !error, processing_error: error ?? null, user_id: userId })
      .eq("id", logId);
  };

  // ── 4. Idempotência: já processamos este order_id com sucesso antes? ──
  if (orderId) {
    const { data: existing } = await supabase
      .from("kiwify_webhook_log")
      .select("id")
      .eq("kiwify_order_id", orderId)
      .eq("processed", true)
      .neq("id", logId ?? "")
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Evento já processado anteriormente (idempotência)." });
    }
  }

  if (!customerEmail) {
    await markProcessed(null, "Payload sem e-mail do cliente — impossível identificar o usuário.");
    return NextResponse.json({ error: "Payload sem e-mail do cliente." }, { status: 400 });
  }

  // ── 5. Encontra o usuário pelo e-mail ───────────────────────────────
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, tokens, subscription_status")
    .eq("email", customerEmail)
    .maybeSingle();

  if (userError || !userRow) {
    await markProcessed(
      null,
      `Usuário não encontrado para o e-mail ${customerEmail}. A compra foi recebida mas não há conta com esse e-mail no PPCI Check IA.`
    );
    // Retorna 200 propositalmente: o erro é de dado de negócio (cliente
    // comprou com e-mail diferente do cadastro), não falha técnica — a
    // Kiwify não deveria reenviar/retry isso indefinidamente.
    return NextResponse.json({
      warning: `Nenhum usuário encontrado para o e-mail ${customerEmail}.`,
    });
  }

  const userId = userRow.id as string;
  const pkg = resolvePackage(payload);

  if (!pkg) {
    await markProcessed(
      userId,
      `Não foi possível identificar o pacote comprado (product_id=${payload.Product?.product_id ?? payload.product_id ?? "?"}, valor=${extractAmountCents(payload) ?? "?"}).`
    );
    return NextResponse.json(
      { error: "Não foi possível identificar o pacote comprado a partir do payload." },
      { status: 422 }
    );
  }

  // ── 6. Trata cada tipo de evento ────────────────────────────────────
  try {
    switch (true) {
      case eventType.includes("aprovad"): {
        await creditarTokens(supabase, userId, pkg, orderId);
        if (pkg.kind === "assinatura") {
          await ativarAssinatura(supabase, userId, pkg, payload);
        }
        break;
      }

      case eventType.includes("reembols"):
      case eventType.includes("chargeback"): {
        await reverterTokens(supabase, userId, pkg, orderId, eventType);
        break;
      }

      case eventType.includes("subscription_renewed") || eventType.includes("renovad"): {
        await creditarTokens(supabase, userId, pkg, orderId);
        await ativarAssinatura(supabase, userId, pkg, payload);
        break;
      }

      case eventType.includes("subscription_canceled") || eventType.includes("cancelad"): {
        await supabase
          .from("users")
          .update({ subscription_status: "canceled" })
          .eq("id", userId);
        break;
      }

      case eventType.includes("subscription_late") || eventType.includes("atrasad"): {
        await supabase
          .from("users")
          .update({ subscription_status: "past_due" })
          .eq("id", userId);
        break;
      }

      default: {
        await markProcessed(userId, `Tipo de evento não tratado: ${eventType}`);
        return NextResponse.json({ message: `Evento '${eventType}' recebido mas não requer ação.` });
      }
    }

    await markProcessed(userId);
    return NextResponse.json({ message: "Webhook processado com sucesso." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao processar webhook.";
    await markProcessed(userId, message);
    console.error("Erro ao processar webhook Kiwify:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function creditarTokens(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  pkg: TokenPackage,
  orderId: string | null
) {
  // Crédito atômico via função do banco — soma direto no banco (tokens =
  // tokens + N), sem ler um valor previamente e escrevê-lo de volta. Isso
  // evita perder créditos se dois webhooks (ex: compra + renovação quase
  // simultâneas) forem processados ao mesmo tempo para o mesmo usuário.
  const { data: novoSaldo, error: updateError } = await supabase.rpc(
    "creditar_tokens",
    { p_user_id: userId, p_quantidade: pkg.tokens }
  );

  if (updateError) throw new Error("Falha ao creditar tokens: " + updateError.message);

  const { error: txError } = await supabase.from("token_transactions").insert({
    user_id: userId,
    amount: pkg.tokens,
    reason: "purchase",
    reference_id: null,
    description: `Compra aprovada via Kiwify — ${pkg.label} (pedido ${orderId ?? "sem ID"})`,
  });

  if (txError) {
    console.error("Falha ao registrar token_transactions (tokens já foram creditados):", txError);
  }
}

async function reverterTokens(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  pkg: TokenPackage,
  orderId: string | null,
  eventType: string
) {
  // Reversão atômica via função do banco — subtrai direto no banco, nunca
  // deixando saldo negativo (GREATEST(tokens - N, 0) dentro da função),
  // sem depender de um valor de saldo lido previamente pela aplicação.
  const { data: novoSaldo, error: updateError } = await supabase.rpc(
    "reverter_tokens",
    { p_user_id: userId, p_quantidade: pkg.tokens }
  );

  if (updateError) throw new Error("Falha ao reverter tokens: " + updateError.message);

  const motivo = eventType.includes("chargeback") ? "Chargeback" : "Reembolso";

  const { error: txError } = await supabase.from("token_transactions").insert({
    user_id: userId,
    amount: -pkg.tokens,
    reason: "refund",
    reference_id: null,
    description: `${motivo} via Kiwify — ${pkg.label} (pedido ${orderId ?? "sem ID"})`,
  });

  if (txError) {
    console.error("Falha ao registrar token_transactions de reembolso:", txError);
  }
}

async function ativarAssinatura(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  pkg: TokenPackage,
  payload: KiwifyWebhookPayload
) {
  const nextPayment = payload.Subscription?.next_payment ?? null;

  await supabase
    .from("users")
    .update({
      subscription_status: "active",
      subscription_plan_id: pkg.id,
      subscription_renews_at: nextPayment,
    })
    .eq("id", userId);
}
