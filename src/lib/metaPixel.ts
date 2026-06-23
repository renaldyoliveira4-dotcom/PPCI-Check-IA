"use client";

/**
 * Eventos do Meta Pixel (Facebook Ads) — PPCI Check IA.
 *
 * IMPORTANTE: usamos os nomes de evento PADRÃO do Meta (CompleteRegistration,
 * InitiateCheckout, Purchase, etc.) em vez de nomes customizados sempre que
 * existir um equivalente padrão. Isso importa porque o Facebook Ads só
 * consegue otimizar entrega/lances automaticamente para esses eventos
 * padrão — eventos customizados (ex: "cadastro_concluido") não entram nas
 * opções de otimização de campanha, então normalmente são só para análise,
 * não para o algoritmo aprender quem converte.
 *
 * Referência dos eventos padrão do Meta:
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

type EventParams = Record<string, string | number | boolean | undefined>;

const CHECKOUT_CONTEXT_KEY = "ppci_checkout_ctx";

function track(event: string, params?: EventParams) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
}

function trackCustom(event: string, params?: EventParams) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", event, params);
}

/**
 * Grava o contexto da compra (pacote + valor) no sessionStorage no momento
 * do InitiateCheckout. Quando o cliente retorna do Kiwify para /obrigado,
 * essa informação é lida para disparar o Purchase com value/currency
 * corretos — necessário para o algoritmo do Meta otimizar entrega.
 *
 * Limitação: sessionStorage não persiste se o cliente fechar a aba durante
 * o pagamento. Para 100% de confiabilidade, complementar com Conversions
 * API server-side no webhook Kiwify.
 */
function gravarContextoCheckout(pacote: string, valor: number) {
  if (typeof window === "undefined") return;
  try {
    const ctx = { pacote, valor, ts: Date.now() };
    sessionStorage.setItem(CHECKOUT_CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    // sessionStorage pode estar desabilitado (modo privado, etc.) — ignora silenciosamente
  }
}

export function lerContextoCheckout(): { pacote: string; valor: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_CONTEXT_KEY);
    if (!raw) return null;
    const ctx = JSON.parse(raw) as { pacote: string; valor: number; ts: number };
    // Expira em 2 horas — depois disso, ignora (provavelmente é leftover de sessão antiga)
    if (Date.now() - ctx.ts > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
      return null;
    }
    return { pacote: ctx.pacote, valor: ctx.valor };
  } catch {
    return null;
  }
}

export function limparContextoCheckout() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
  } catch {}
}

export const metaPixel = {
  /** Disparado quando o usuário conclui o cadastro (evento padrão do Meta). */
  cadastroConcluido: () => track("CompleteRegistration", { content_name: "Cadastro PPCI Check IA" }),

  /**
   * Disparado quando o usuário clica em comprar/assinar, antes de ir para a Kiwify.
   * Também grava pacote/valor no sessionStorage para a página /obrigado conseguir
   * disparar o Purchase com value/currency corretos quando o cliente retornar.
   */
  iniciouCheckout: (params: { pacote: string; valor: number }) => {
    gravarContextoCheckout(params.pacote, params.valor);
    track("InitiateCheckout", {
      content_name: params.pacote,
      value: params.valor,
      currency: "BRL",
    });
  },

  /**
   * Disparado quando uma compra é confirmada. Idealmente deveria vir do
   * webhook (server-side, mais confiável), mas como passo inicial
   * disparamos client-side ao usuário retornar de um checkout bem-sucedido.
   */
  compraConcluida: (params: { pacote: string; valor: number }) =>
    track("Purchase", {
      content_name: params.pacote,
      value: params.valor,
      currency: "BRL",
    }),

  /** Disparado quando o usuário cria o primeiro projeto — sinal de ativação real. */
  projetoCriado: () => trackCustom("ProjetoCriado"),

  /** Disparado quando uma análise é concluída com sucesso — o "momento de valor" do produto. */
  analiseConcluida: () => trackCustom("AnaliseConcluida"),

  /** Disparado ao visualizar a página de planos/tokens (evento padrão ViewContent). */
  visualizouPlanos: () => track("ViewContent", { content_name: "Planos e Tokens" }),
};
