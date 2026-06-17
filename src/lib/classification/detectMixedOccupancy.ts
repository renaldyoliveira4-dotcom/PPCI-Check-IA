/**
 * Detecção de ocupação mista — quando a edificação tem mais de um uso
 * relevante (ex: térreo comercial + pavimentos residenciais).
 *
 * Regra normativa: para ocupações mistas, cada uso deve ser classificado
 * separadamente, informando a ocupação predominante, mas as exigências
 * mais rigorosas (do uso de maior risco) devem ser aplicadas ao conjunto
 * quando a edificação não for totalmente compartimentada entre os usos.
 */

import { classifyOccupancy, type ClassifyOccupancyInput, type ClassifyOccupancyResult } from "./classifyOccupancy";

export interface MixedUseSegment {
  /** Texto descritivo deste uso específico (ex: "térreo: loja de roupas") */
  segmentText: string;
  /** Área aproximada deste uso, se conhecida */
  areaM2?: number;
}

export interface MixedOccupancyInput {
  segments: MixedUseSegment[];
  /** Dados estruturados comuns a todos os segmentos (altura, GLP, etc) */
  sharedContext?: Omit<ClassifyOccupancyInput, "projectText" | "areaM2">;
}

export interface MixedOccupancyResult {
  isMixed: boolean;
  classifications: ClassifyOccupancyResult[];
  predominant: ClassifyOccupancyResult | null;
  mostRestrictive: ClassifyOccupancyResult | null;
  warnings: string[];
}

const RISK_ORDER: Record<string, number> = {
  "Não informado": 0,
  Baixo: 1,
  Médio: 2,
  Alto: 3,
};

/**
 * Detecta e classifica ocupação mista. Quando há apenas um segmento,
 * delega diretamente para classifyOccupancy (isMixed: false).
 */
export function detectMixedOccupancy(input: MixedOccupancyInput): MixedOccupancyResult {
  const warnings: string[] = [];

  if (!input.segments || input.segments.length === 0) {
    return {
      isMixed: false,
      classifications: [],
      predominant: null,
      mostRestrictive: null,
      warnings: ["Nenhum segmento de uso foi informado para classificação."],
    };
  }

  const classifications = input.segments.map((seg) =>
    classifyOccupancy({
      ...(input.sharedContext ?? {}),
      projectText: seg.segmentText,
      areaM2: seg.areaM2,
    })
  );

  if (input.segments.length === 1) {
    return {
      isMixed: false,
      classifications,
      predominant: classifications[0],
      mostRestrictive: classifications[0],
      warnings: classifications[0].warnings,
    };
  }

  // Ocupação predominante = segmento com maior área informada; se áreas
  // não informadas, usa o primeiro segmento com maior confiança de classificação.
  const temAreas = input.segments.every((s) => typeof s.areaM2 === "number");
  let predominant: ClassifyOccupancyResult;
  if (temAreas) {
    let maiorArea = -1;
    let idx = 0;
    input.segments.forEach((s, i) => {
      if ((s.areaM2 ?? 0) > maiorArea) {
        maiorArea = s.areaM2 ?? 0;
        idx = i;
      }
    });
    predominant = classifications[idx];
  } else {
    warnings.push(
      "Áreas dos segmentos não foram totalmente informadas — a ocupação predominante foi estimada pela maior confiança de classificação, não pela área real. Recomenda-se informar a área de cada uso."
    );
    predominant = [...classifications].sort((a, b) => b.confidence - a.confidence)[0];
  }

  // Uso mais restritivo = maior nível de risco entre os segmentos classificados
  const mostRestrictive = [...classifications].sort(
    (a, b) => (RISK_ORDER[b.fireRisk] ?? 0) - (RISK_ORDER[a.fireRisk] ?? 0)
  )[0];

  warnings.push(
    `Edificação com ocupação mista detectada (${input.segments.length} usos). ` +
    `Ocupação predominante: ${predominant.division}. ` +
    `Uso mais restritivo (maior risco): ${mostRestrictive.division} (risco ${mostRestrictive.fireRisk}). ` +
    `Caso os usos não sejam totalmente compartimentados entre si, aplicar as exigências do uso mais restritivo ao conjunto.`
  );

  classifications.forEach((c) => warnings.push(...c.warnings));

  return {
    isMixed: true,
    classifications,
    predominant,
    mostRestrictive,
    warnings,
  };
}
