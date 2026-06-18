/**
 * Classificador de ocupação/divisão da edificação.
 *
 * REGRA MAIS IMPORTANTE: a divisão NUNCA é inventada pela IA. Este módulo
 * classifica exclusivamente a partir da base normativa estruturada em
 * src/data/ba/occupancyDivisions.ts (Tabela 1 do Decreto Estadual nº
 * 16.302/2015). Se a ocupação não se encaixar em nenhuma entrada, retorna
 * "NÃO ENQUADRADO AUTOMATICAMENTE – EXIGE ANÁLISE TÉCNICA".
 *
 * Ordem de classificação (nunca pular etapas):
 *  1. Ocupação/divisão
 *  2. Carga de incêndio
 *  3. Risco
 */

import { OCCUPANCY_DIVISIONS, type OccupancyDivision } from "@/data/ba/occupancyDivisions";
import { classifyFireRisk, type FireRiskLevel } from "./classifyFireRisk";

export const UNCLASSIFIED = "NÃO ENQUADRADO AUTOMATICAMENTE – EXIGE ANÁLISE TÉCNICA";

export interface ClassifyOccupancyInput {
  projectText: string;
  detectedTables?: Array<Record<string, unknown>>;
  cnae?: string;
  declaredUse?: string;
  areaM2?: number;
  heightM?: number;
  floors?: number;
  fireLoadMJm2?: number;
  hasHospitalization?: boolean;
  hasPublicAssembly?: boolean;
  hasBleachers?: boolean;
  hasFuelSupply?: boolean;
  hasVehicleRepair?: boolean;
  hasRestaurant?: boolean;
  hasEntertainment?: boolean;
  hasReligiousUse?: boolean;
  hasStorage?: boolean;
  hasIndustrialProcess?: boolean;
  hasFlammableLiquids?: boolean;
  flammableLiquidsLiters?: number;
  hasGLP?: boolean;
  glpKg?: number;
  hasSubsoil?: boolean;
  subsoilUse?: string;
}

export type ClassificationSource = "declared_table" | "inferred_from_text" | "cnae_assisted" | "manual_review";

export interface DivisionAlternative {
  division: string;
  reason: string;
}

export interface ClassifyOccupancyResult {
  group: string;
  division: string;
  occupancyUse: string;
  description: string;
  examplesMatched: string[];
  fireLoadMJm2: number | null;
  fireRisk: FireRiskLevel;
  confidence: number;
  source: ClassificationSource;
  reasoning: string[];
  warnings: string[];
  alternatives: DivisionAlternative[];
  requiredHumanReview: boolean;
}

/** Normaliza texto para comparação (minúsculas, sem acento, sem pontuação extra) */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Verifica se uma keyword normalizada aparece no texto normalizado respeitando
 * fronteiras de palavra — evita falsos positivos como "aço" (normalizado "aco")
 * casando dentro de "espaço" (normalizado "espaco"). Permite que a keyword no
 * singular ainda capture a forma plural mais comum em português (sufixo "s"
 * ou "es"), por isso a fronteira final aceita um sufixo curto antes do limite
 * real de palavra.
 */
function containsWholeWordOrPhrase(normalizedText: string, normalizedKeyword: string): boolean {
  if (!normalizedKeyword) return false;
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![a-z0-9])${escaped}(e?s)?(?![a-z0-9])`);
  return pattern.test(normalizedText);
}

/** Tenta extrair um código de divisão explícito (ex: "D-1", "F-8") do texto */
function extractExplicitDivisionCode(text: string): string | null {
  const match = text.toUpperCase().match(/\b([A-M])-(\d{1,2})\b/);
  if (!match) return null;
  const code = `${match[1]}-${match[2]}`;
  return OCCUPANCY_DIVISIONS.some((d) => d.division === code) ? code : null;
}

interface ScoredDivision {
  division: OccupancyDivision;
  score: number;
  matchedKeywords: string[];
  matchedNegative: string[];
}

/** Pontua cada divisão da base contra o texto normalizado do projeto */
function scoreDivisions(normalizedText: string): ScoredDivision[] {
  return OCCUPANCY_DIVISIONS.map((division) => {
    let score = 0;
    const matchedKeywords: string[] = [];
    const matchedNegative: string[] = [];

    for (const kw of division.keywords) {
      const kwNorm = normalize(kw);
      if (kwNorm && containsWholeWordOrPhrase(normalizedText, kwNorm)) {
        score += 1;
        matchedKeywords.push(kw);
      }
    }

    for (const negKw of division.negativeKeywords) {
      const negNorm = normalize(negKw);
      if (negNorm && containsWholeWordOrPhrase(normalizedText, negNorm)) {
        score -= 2; // negativeKeyword pesa mais que um match positivo simples
        matchedNegative.push(negKw);
      }
    }

    return { division, score, matchedKeywords, matchedNegative };
  }).filter((s) => s.score > 0 || s.matchedKeywords.length > 0);
}

/**
 * Classifica a ocupação/divisão da edificação a partir do texto do projeto
 * e dos dados estruturados disponíveis. Nunca inventa uma divisão fora da
 * base normativa.
 */
export function classifyOccupancy(input: ClassifyOccupancyInput): ClassifyOccupancyResult {
  const reasoning: string[] = [];
  const warnings: string[] = [];

  const combinedText = [
    input.projectText ?? "",
    input.declaredUse ?? "",
    ...(input.detectedTables ?? []).map((t) => JSON.stringify(t)),
  ].join(" ");
  const normalizedText = normalize(combinedText);

  // ── 1. Verifica se já existe um quadro de classificação no próprio projeto ──
  // Se o quadro já trouxer divisão explícita (ex: "D-1"), aceitar como fonte
  // primária, salvo conflito evidente com o texto descritivo.
  const explicitCode = extractExplicitDivisionCode(combinedText);
  if (explicitCode) {
    const div = OCCUPANCY_DIVISIONS.find((d) => d.division === explicitCode)!;

    // Verifica conflito: o texto contém negativeKeywords fortes da própria divisão informada?
    const conflitos = div.negativeKeywords.filter((nk) => containsWholeWordOrPhrase(normalizedText, normalize(nk)));

    if (conflitos.length === 0) {
      reasoning.push(
        `Divisão "${explicitCode}" foi extraída diretamente de um quadro/código informado no projeto. ` +
        `Conforme regra normativa, classificação de quadro existente é aceita salvo conflito evidente.`
      );

      const fireLoad = resolveFireLoad(input, div, reasoning, warnings);
      const { fireRisk } = classifyFireRisk(fireLoad);

      return {
        group: div.group,
        occupancyUse: div.occupancyUse,
        division: div.division,
        description: div.description,
        examplesMatched: [],
        fireLoadMJm2: fireLoad,
        fireRisk,
        confidence: 0.95,
        source: "declared_table",
        reasoning,
        warnings,
        alternatives: [],
        requiredHumanReview: false,
      };
    }

    warnings.push(
      `O quadro do projeto informa "${explicitCode}", mas o texto também contém termos ` +
      `(${conflitos.join(", ")}) que conflitam com essa divisão. Revisão técnica recomendada.`
    );
  }

  // ── 2. Classificação por palavras-chave (matching) ──────────────────────
  const scored = scoreDivisions(normalizedText)
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score > 0);

  if (scored.length === 0) {
    return {
      group: UNCLASSIFIED,
      occupancyUse: UNCLASSIFIED,
      division: UNCLASSIFIED,
      description: UNCLASSIFIED,
      examplesMatched: [],
      fireLoadMJm2: input.fireLoadMJm2 ?? null,
      fireRisk: classifyFireRisk(input.fireLoadMJm2 ?? null).fireRisk,
      confidence: 0,
      source: "manual_review",
      reasoning: ["Nenhuma palavra-chave da base normativa foi encontrada no texto do projeto."],
      warnings: ["Não foi possível classificar automaticamente — a atividade não corresponde a nenhuma divisão conhecida da Tabela 1 do Decreto 16.302/2015."],
      alternatives: [],
      requiredHumanReview: true,
    };
  }

  const best = scored[0];
  const second = scored[1];

  reasoning.push(
    `Classificação inferida a partir de correspondência de palavras-chave no texto do projeto. ` +
    `Termos identificados: ${best.matchedKeywords.join(", ")}.`
  );
  if (best.matchedNegative.length > 0) {
    warnings.push(
      `Atenção: termos potencialmente conflitantes também encontrados (${best.matchedNegative.join(", ")}).`
    );
  }

  // ── 3. Resolve carga de incêndio e ajusta divisão se ela depender disso ──
  let divisaoFinal = best.division;
  const fireLoad = resolveFireLoad(input, best.division, reasoning, warnings);

  if (best.division.fireLoadRule === "byMaterial") {
    if (fireLoad === null) {
      warnings.push(
        `A divisão "${best.division.division}" depende da carga de incêndio (MJ/m²) para ser confirmada, ` +
        `mas esse valor não foi informado. Classificação preliminar mantida; revisão técnica recomendada.`
      );
    } else {
      // Procura, dentro do mesmo grupo, a divisão cuja faixa de carga de incêndio corresponde ao valor real
      const mesmoGrupo = OCCUPANCY_DIVISIONS.filter(
        (d) => d.group === best.division.group && d.fireLoadRule === "byMaterial"
      );
      const divisaoPorCarga = mesmoGrupo.find((d) => {
        const range = d.fireLoadRangeMJm2;
        if (!range) return false;
        const dentroMin = fireLoad >= range.min;
        const dentroMax = range.max === null || fireLoad <= range.max;
        return dentroMin && dentroMax;
      });
      if (divisaoPorCarga && divisaoPorCarga.division !== best.division.division) {
        reasoning.push(
          `Divisão ajustada de "${best.division.division}" para "${divisaoPorCarga.division}" ` +
          `com base na carga de incêndio real (${fireLoad} MJ/m²).`
        );
        divisaoFinal = divisaoPorCarga;
      }
    }
  }

  const { fireRisk } = classifyFireRisk(fireLoad);

  // ── 4. Monta alternativas quando há ambiguidade ──────────────────────────
  const alternatives: DivisionAlternative[] = [];
  let confidence = Math.min(0.5 + best.score * 0.15, 0.9);
  let requiredHumanReview = false;

  if (second && second.score > 0 && best.score - second.score <= 1) {
    alternatives.push({
      division: second.division.division,
      reason: `Pontuação próxima (${second.score} vs ${best.score}); termos em comum: ${second.matchedKeywords.join(", ") || "nenhum termo exclusivo"}.`,
    });
    warnings.push(
      `Há ambiguidade entre "${divisaoFinal.division}" e "${second.division.division}". ` +
      `Faltam informações mais específicas sobre o uso real da edificação para confirmar com certeza.`
    );
    confidence = Math.min(confidence, 0.6);
    requiredHumanReview = true;
  }

  if (divisaoFinal.fireLoadRule === "byMaterial" && fireLoad === null) {
    requiredHumanReview = true;
    confidence = Math.min(confidence, 0.5);
  }

  return {
    group: divisaoFinal.group,
    occupancyUse: divisaoFinal.occupancyUse,
    division: divisaoFinal.division,
    description: divisaoFinal.description,
    examplesMatched: best.matchedKeywords,
    fireLoadMJm2: fireLoad,
    fireRisk,
    confidence: Math.round(confidence * 100) / 100,
    source: "inferred_from_text",
    reasoning,
    warnings,
    alternatives,
    requiredHumanReview,
  };
}

/**
 * Resolve o valor de carga de incêndio a partir da entrada estruturada
 * (prioritário) ou, na ausência, retorna null — nunca inventa um valor.
 */
function resolveFireLoad(
  input: ClassifyOccupancyInput,
  division: OccupancyDivision,
  reasoning: string[],
  warnings: string[]
): number | null {
  if (typeof input.fireLoadMJm2 === "number" && !Number.isNaN(input.fireLoadMJm2)) {
    reasoning.push(`Carga de incêndio de ${input.fireLoadMJm2} MJ/m² extraída do memorial/projeto.`);
    return input.fireLoadMJm2;
  }

  warnings.push(
    `Carga de incêndio não informada para a divisão "${division.division}". ` +
    `O valor deve constar no cálculo do memorial descritivo (IT-14/CBMBA) — não foi inferido nem estimado.`
  );
  return null;
}
