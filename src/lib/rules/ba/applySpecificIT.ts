/**
 * Aplicação de Instruções Técnicas específicas para dimensionamento.
 *
 * REGRA: este módulo NUNCA decide se um sistema é obrigatório. Ele só diz
 * QUAL IT usar para dimensionar/conferir conformidade, e SOMENTE quando
 * requiredSystemsMatrix.system.required já é true (via determineRequiredSystems).
 *
 * Se required = false, a IT correspondente NUNCA é aplicada como fonte de
 * não conformidade — o sistema simplesmente não é exigido.
 * Se status = PENDING, este módulo pede o dado faltante, não aplica a IT.
 */

import type { SystemRequirement } from "./determineRequiredSystems";

export const IT_DIMENSIONAMENTO_POR_SISTEMA: Record<string, string> = {
  "Saídas de Emergência": "IT 11",
  "Extintores": "IT 21",
  "Hidrantes e Mangotinhos": "IT 22",
  "Chuveiros Automáticos": "IT específica/NBR aplicável (chuveiros automáticos)",
  "Iluminação de Emergência": "IT 18",
  "Sinalização de Emergência": "IT 20",
  "Alarme de Incêndio": "IT específica (alarme)",
  "Detecção de Incêndio": "IT específica (detecção)",
  "Brigada de Incêndio": "IT específica (brigada de incêndio)",
  "Compartimentação Horizontal": "IT específica (compartimentação)",
  "Compartimentação Vertical": "IT específica (compartimentação)",
  "Controle de Materiais de Acabamento": "IT específica (materiais de acabamento)",
  "Controle de Fumaça": "ITCBMBA-15 (controle de fumaça)",
  "Sistema de Espuma": "ITCBMBA-23/ITCBMBA-25 (sistema de espuma)",
  "SPDA/Instalações Elétricas": "Normas técnicas oficiais de instalações elétricas/SPDA",
  "Riscos Especiais": "IT específica do risco declarado",
  GLP: "ITCBMBA-28",
  "Líquidos Inflamáveis": "ITCBMBA-25",
  Explosivos: "ITCBMBA-30",
  Túneis: "ITCBMBA-35",
};

export interface ApplySpecificITResult {
  system: string;
  itApplicable: string | null;
  action: "dimension_and_verify" | "skip_not_required" | "request_missing_data" | "manual_review";
  message: string;
}

/**
 * Decide a ação correta para um SystemRequirement já calculado pela matriz.
 * Esta função é o "portão" que impede qualquer IT específica de ser usada
 * como fonte de obrigatoriedade — ela só age depois que a matriz já decidiu.
 */
export function applySpecificIT(requirement: SystemRequirement): ApplySpecificITResult {
  const it = IT_DIMENSIONAMENTO_POR_SISTEMA[requirement.system] ?? null;

  if (requirement.status === "PENDING") {
    return {
      system: requirement.system,
      itApplicable: it,
      action: "request_missing_data",
      message:
        `Dado(s) faltante(s) para "${requirement.system}": ${requirement.missingData?.join(", ") ?? "não especificado"}. ` +
        `Não é possível aplicar ${it ?? "a IT correspondente"} sem esses dados.`,
    };
  }

  if (requirement.status === "REVIEW_REQUIRED" || requirement.status === "NOT_APPLICABLE") {
    return {
      system: requirement.system,
      itApplicable: it,
      action: "manual_review",
      message:
        `Exigência de "${requirement.system}" não pôde ser determinada automaticamente pela matriz normativa. ` +
        `Revisão técnica obrigatória antes de aplicar qualquer IT de dimensionamento.`,
    };
  }

  if (requirement.status === "NOT_REQUIRED") {
    return {
      system: requirement.system,
      itApplicable: null,
      action: "skip_not_required",
      message:
        `"${requirement.system}" não é exigido pela matriz normativa para este enquadramento. ` +
        `${it ?? "A IT correspondente"} NÃO é aplicada como fonte de não conformidade — o sistema simplesmente não é obrigatório aqui.`,
    };
  }

  // status === "REQUIRED"
  return {
    system: requirement.system,
    itApplicable: it,
    action: "dimension_and_verify",
    message: it
      ? `"${requirement.system}" é exigido pela matriz normativa. Aplicar ${it} para dimensionar e verificar conformidade do projeto.`
      : `"${requirement.system}" é exigido pela matriz normativa, mas não há IT de dimensionamento mapeada — revisão técnica recomendada.`,
  };
}
