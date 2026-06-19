"use client";

import posthog from "posthog-js";

/**
 * Eventos centralizados do PPCI Check IA.
 *
 * Por que centralizar: evita strings soltas e divergentes em cada
 * componente (ex: "novo_projeto" vs "new_project" vs "projeto_criado"
 * coexistindo no PostHog). Cada função aqui é a ÚNICA fonte de verdade
 * para esse evento — se precisar mudar o nome ou adicionar uma
 * propriedade, muda só aqui.
 */

type EventProps = Record<string, string | number | boolean | null | undefined>;

function track(event: string, props?: EventProps) {
  if (typeof window === "undefined") return;
  posthog.capture(event, props);
}

/** Identifica o usuário no PostHog após login/cadastro confirmado. */
export function identifyUser(userId: string, props?: EventProps) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, props);
}

/** Limpa a identidade ao fazer logout. */
export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

export const analytics = {
  // ── Aquisição / autenticação ──
  cadastroIniciado: () => track("cadastro_iniciado"),
  cadastroConcluido: (props: { metodo: "email" | "google" }) =>
    track("cadastro_concluido", props),
  loginRealizado: (props: { metodo: "email" | "google" }) =>
    track("login_realizado", props),

  // ── Ativação: criação e progresso do projeto ──
  novoProjetoIniciado: () => track("novo_projeto_iniciado"),
  novoProjetoCriado: (props: {
    projeto_id: string;
    grupo?: string | null;
    divisao?: string | null;
    area_m2?: number | null;
  }) => track("novo_projeto_criado", props),

  uploadIniciado: (props: { projeto_id: string }) =>
    track("upload_iniciado", props),
  uploadConcluido: (props: { projeto_id: string; tamanho_kb?: number; paginas?: number }) =>
    track("upload_concluido", props),
  uploadFalhou: (props: { projeto_id: string; motivo?: string }) =>
    track("upload_falhou", props),

  analiseIniciada: (props: { projeto_id: string }) =>
    track("analise_iniciada", props),
  analiseConcluida: (props: {
    projeto_id: string;
    nota?: number | null;
    status_aprovacao?: string | null;
    duracao_segundos?: number;
    tokens_restantes?: number;
  }) => track("analise_concluida", props),
  analiseFalhou: (props: { projeto_id: string; motivo?: string }) =>
    track("analise_falhou", props),

  // ── Engajamento ──
  projetoEditado: (props: { projeto_id: string }) =>
    track("projeto_editado", props),
  projetoApagado: (props: { projeto_id: string }) =>
    track("projeto_apagado", props),
  relatorioVisualizado: (props: { projeto_id: string }) =>
    track("relatorio_visualizado", props),
  relatorioBaixado: (props: { projeto_id: string; formato: "pdf" | "html" }) =>
    track("relatorio_baixado", props),

  // ── Monetização ──
  paginaTokensVisualizada: (props?: { tokens_restantes?: number; origem?: string }) =>
    track("pagina_tokens_visualizada", props),
  pacoteTokensSelecionado: (props: { pacote: string; valor: number }) =>
    track("pacote_tokens_selecionado", props),
  compraTokensIniciada: (props: { pacote: string; valor: number }) =>
    track("compra_tokens_iniciada", props),
  compraTokensConcluida: (props: { pacote: string; valor: number; tokens_adicionados: number }) =>
    track("compra_tokens_concluida", props),

  // ── Atrito / erros ──
  tokensEsgotados: (props?: { projeto_id?: string }) =>
    track("tokens_esgotados", props),
  erroGenerico: (props: { contexto: string; mensagem?: string }) =>
    track("erro_generico", props),
};
