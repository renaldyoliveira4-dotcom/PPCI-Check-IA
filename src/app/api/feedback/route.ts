import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "renaldyoliveira@gmail.com";
const FROM_EMAIL = "naoresponda@ppcicheckia.com.br";

const TIPO_LABELS: Record<string, string> = {
  sugestao: "Sugestão",
  melhoria: "Melhoria",
  bug: "Encontrou um problema",
  outro: "Outro",
};

interface FeedbackRequest {
  tipo: "sugestao" | "melhoria" | "bug" | "outro";
  mensagem: string;
  pagina_origem?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let payload: FeedbackRequest;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { tipo, mensagem, pagina_origem } = payload;

  if (!mensagem?.trim()) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  // ── 1. Salva o feedback no banco (sempre acontece, independente do
  //    e-mail funcionar ou não — não queremos perder o feedback do
  //    usuário por causa de uma falha no envio do alerta) ─────────────
  const { data: feedback, error: insertError } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      tipo,
      mensagem: mensagem.trim(),
      pagina_origem: pagina_origem ?? null,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Não foi possível salvar o feedback." }, { status: 500 });
  }

  // ── 2. Dispara o e-mail de alerta para o admin (best-effort) ────────
  // Se o e-mail falhar por qualquer motivo (chave inválida, domínio com
  // problema, limite de envio, etc.), o feedback já foi salvo com
  // sucesso no passo anterior — não queremos que uma falha de e-mail
  // faça o usuário pensar que o feedback dele se perdeu.
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const tipoLabel = TIPO_LABELS[tipo] ?? tipo;

      await resend.emails.send({
        from: `PPCI Check IA <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `Novo feedback: ${tipoLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Novo feedback recebido</h2>
            <p><strong>Tipo:</strong> ${tipoLabel}</p>
            <p><strong>De:</strong> ${user.email}</p>
            <p><strong>Página de origem:</strong> ${pagina_origem ?? "não informada"}</p>
            <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; white-space: pre-wrap; color: #111827;">${mensagem.trim()}</p>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
              Recebido em ${new Date(feedback.created_at).toLocaleString("pt-BR", { timeZone: "America/Bahia" })}
            </p>
          </div>
        `,
      });
    }
  } catch (emailError) {
    // Não propaga o erro — o feedback já foi salvo. Apenas registra no
    // log do servidor para investigação posterior, se necessário.
    console.error("Falha ao enviar e-mail de alerta de feedback:", emailError);
  }

  return NextResponse.json({ success: true, id: feedback.id });
}
