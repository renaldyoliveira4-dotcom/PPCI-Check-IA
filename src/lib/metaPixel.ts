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

function track(event: string, params?: EventParams) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
}

function trackCustom(event: string, params?: EventParams) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", event, params);
}

export const metaPixel = {
  /** Disparado quando o usuário conclui o cadastro (evento padrão do Meta). */
  cadastroConcluido: () => track("CompleteRegistration", { content_name: "Cadastro PPCI Check IA" }),

  /** Disparado quando o usuário clica em comprar/assinar, antes de ir para a Kiwify. */
  iniciouCheckout: (params: { pacote: string; valor: number }) =>
    track("InitiateCheckout", {
      content_name: params.pacote,
      value: params.valor,
      currency: "BRL",
    }),

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
