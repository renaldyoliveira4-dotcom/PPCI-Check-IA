/**
 * Exigência de Hidrantes e Mangotinhos — para TODAS as divisões.
 *
 * REGRA UNIVERSAL (este é o módulo que corrige o bug original do sistema):
 *  1. Consultar SOMENTE requiredSystemsMatrix (via determineRequiredSystems).
 *  2. Se a matriz disser que "Hidrantes e Mangotinhos" é obrigatório,
 *     retornar REQUIRED.
 *  3. Se a matriz disser que não é obrigatório, retornar NOT_REQUIRED.
 *  4. Se a matriz não tiver dados suficientes, retornar PENDING ou
 *     REVIEW_REQUIRED.
 *  5. Somente quando REQUIRED, a IT-22/2016 entra em jogo — e só para
 *     DIMENSIONAR o sistema (ver applySpecificIT.ts), nunca para decidir
 *     se ele é exigido.
 *
 * PROIBIDO (e este módulo nunca faz):
 *  - Usar "Anexo E da IT-22 não isenta" como motivo para exigir hidrante.
 *  - Usar "Tabela 3 da IT-22" para decidir obrigatoriedade inicial.
 *  - Marcar hidrante como crítico quando a Tabela 5 não exige.
 *  - Exigir hidrante em PTS apenas porque a edificação tem 2 pavimentos.
 *  - Exigir hidrante em D-1 até 750 m² sem risco especial.
 */

import {
  determineRequiredSystems,
  type DetermineRequiredSystemsInput,
  type SystemRequirement,
} from "./determineRequiredSystems";

const HIDRANTE_SYSTEM_NAME = "Hidrantes e Mangotinhos";

export type GetHydrantsRequirementInput = DetermineRequiredSystemsInput;

export function getHydrantsRequirement(input: GetHydrantsRequirementInput): SystemRequirement {
  const result = determineRequiredSystems(input);

  const allFlat = [
    ...result.requiredSystems,
    ...result.notRequiredSystems,
    ...result.pendingSystems,
    ...result.nonCompliantSystems,
  ];

  const hidranteReq = allFlat.find((r) => r.system === HIDRANTE_SYSTEM_NAME);

  if (!hidranteReq) {
    // Matriz não cadastrada para esta divisão/situação — nunca inventar exigência.
    return {
      system: HIDRANTE_SYSTEM_NAME,
      required: false,
      status: "REVIEW_REQUIRED",
      severity: "warning",
      reason:
        "Não foi possível determinar automaticamente a exigência de Hidrantes e Mangotinhos para este " +
        "enquadramento normativo. Revisão técnica obrigatória.",
      normativeBasis: result.normativeTablesUsed,
      notes: result.globalWarnings,
    };
  }

  // Quando REQUIRED, anexa o lembrete de que a IT-22 só dimensiona — nunca decide a obrigatoriedade.
  if (hidranteReq.status === "REQUIRED") {
    return {
      ...hidranteReq,
      recommendation:
        "Sistema exigido pela matriz normativa do Decreto 16.302/2015. A partir daqui, aplicar a IT-22/2016 " +
        "exclusivamente para dimensionamento (número/tipo de hidrantes, vazão, reserva técnica de incêndio, etc.) — " +
        "a IT-22 não é usada para decidir se o sistema é obrigatório.",
    };
  }

  if (hidranteReq.status === "NOT_REQUIRED" || hidranteReq.status === "NOT_APPLICABLE") {
    return {
      ...hidranteReq,
      status: "NOT_REQUIRED",
      reason:
        hidranteReq.reason +
        " A IT-22/2016 só se aplica ao dimensionamento quando o sistema é exigido pela matriz — " +
        "ela nunca cria, por si só, a obrigatoriedade de hidrante.",
    };
  }

  return hidranteReq;
}

/**
 * Caso de teste obrigatório (deve sempre retornar status NOT_REQUIRED):
 *
 * getHydrantsRequirement({
 *   group: "D", division: "D-1", areaM2: 318.75, floors: 2, heightM: 6,
 *   processType: "PTS_AVCB", fireRisk: "Baixo", fireLoadMJm2: 300,
 *   hasSpecialRisks: false,
 * })
 *
 * Resultado esperado: required=false, status="NOT_REQUIRED", reason
 * mencionando a Tabela 5 (área<=750m² e altura<=12m) e que a IT-22 só
 * dimensiona quando o sistema é exigido.
 */
