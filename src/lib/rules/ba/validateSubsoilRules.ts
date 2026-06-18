/**
 * Validação de exigências adicionais para subsolos ocupados (Tabela 7 do
 * Decreto 16.302/2015).
 *
 * REGRA: a Tabela 7 não é uma árvore binária de obrigatoriedade — ela lista
 * MEDIDAS ALTERNATIVAS ("ou") por faixa de área ocupada no subsolo e tipo de
 * ocupação. Este módulo retorna essas opções como ALERTA QUALITATIVO para
 * revisão técnica, nunca como uma exigência fixa de sistema específico.
 *
 * Não se aplica a subsolos destinados exclusivamente a estacionamento de
 * veículos, vestiários, instalações sanitárias ou áreas técnicas sem
 * aproveitamento para atividades/permanência humana (nota "h" da Tabela 5).
 */

import { TABELA_7_SUBSOLO } from "@/data/ba/requiredSystemsMatrix";

export type SubsoilOccupationType = "deposito" | "divisoesF" | "outras";

export interface ValidateSubsoilRulesInput {
  hasSubsoil: boolean;
  subsoilUse?: string;
  subsoilAreaM2?: number;
  /** Divisão da edificação (usada para decidir a coluna de ocupação da Tabela 7) */
  division?: string;
}

export interface ValidateSubsoilRulesResult {
  applies: boolean;
  reason: string;
  occupationType: SubsoilOccupationType | null;
  bandLabel: string | null;
  alternativeMeasures: string[];
  missingData: string[];
  requiredHumanReview: boolean;
}

const PARKING_KEYWORDS = ["estacionamento", "garagem", "vestiário", "vestiarios", "sanitári", "área técnica", "area tecnica"];

const DIVISOES_F_TABELA7 = ["F-1", "F-2", "F-3", "F-5", "F-6", "F-10"];

function isParkingOrExempt(subsoilUse: string | undefined): boolean {
  if (!subsoilUse) return false;
  const normalized = subsoilUse.toLowerCase();
  return PARKING_KEYWORDS.some((kw) => normalized.includes(kw));
}

function resolveOccupationType(division: string | undefined, subsoilUse: string | undefined): SubsoilOccupationType {
  const div = division?.toUpperCase().trim();
  if (div && DIVISOES_F_TABELA7.includes(div)) return "divisoesF";
  if (subsoilUse && (subsoilUse.toLowerCase().includes("depósito") || subsoilUse.toLowerCase().includes("deposito"))) {
    return "deposito";
  }
  return "outras";
}

export function validateSubsoilRules(input: ValidateSubsoilRulesInput): ValidateSubsoilRulesResult {
  if (!input.hasSubsoil) {
    return {
      applies: false,
      reason: "Edificação não possui subsolo.",
      occupationType: null,
      bandLabel: null,
      alternativeMeasures: [],
      missingData: [],
      requiredHumanReview: false,
    };
  }

  if (isParkingOrExempt(input.subsoilUse)) {
    return {
      applies: false,
      reason:
        `Subsolo destinado a ${input.subsoilUse} está isento das exigências adicionais da Tabela 7 ` +
        `(conforme nota geral "h" da Tabela 5 do Decreto 16.302/2015 — estacionamento, vestiários, ` +
        `instalações sanitárias e áreas técnicas sem aproveitamento para atividades/permanência humana).`,
      occupationType: null,
      bandLabel: null,
      alternativeMeasures: [],
      missingData: [],
      requiredHumanReview: false,
    };
  }

  if (typeof input.subsoilAreaM2 !== "number" || Number.isNaN(input.subsoilAreaM2)) {
    return {
      applies: true,
      reason: "Subsolo ocupado por uso diferente de estacionamento, mas a área ocupada não foi informada.",
      occupationType: null,
      bandLabel: null,
      alternativeMeasures: [],
      missingData: ["Área ocupada no(s) subsolo(s) (m²)"],
      requiredHumanReview: true,
    };
  }

  const band = TABELA_7_SUBSOLO.bands.find(
    (b) => input.subsoilAreaM2! > b.areaM2Range[0] && input.subsoilAreaM2! <= b.areaM2Range[1]
  ) ?? TABELA_7_SUBSOLO.bands[0];

  if (input.subsoilAreaM2 <= 50) {
    return {
      applies: true,
      reason: band.requirement ?? "Até 50 m²: sem exigências adicionais.",
      occupationType: null,
      bandLabel: band.label,
      alternativeMeasures: [],
      missingData: [],
      requiredHumanReview: false,
    };
  }

  const occupationType = resolveOccupationType(input.division, input.subsoilUse);
  const measures = band.byOccupation?.[occupationType] ?? band.byOccupation?.outras ?? [];

  return {
    applies: true,
    reason:
      `Subsolo ocupado por "${input.subsoilUse ?? "uso não especificado"}" com ${input.subsoilAreaM2}m², ` +
      `faixa "${band.label}" da Tabela 7. ${TABELA_7_SUBSOLO.generalNote}`,
    occupationType,
    bandLabel: band.label,
    alternativeMeasures: measures,
    missingData: [],
    requiredHumanReview: true,
  };
}
