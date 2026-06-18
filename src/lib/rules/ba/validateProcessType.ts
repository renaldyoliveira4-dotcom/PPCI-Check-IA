/**
 * Determina o tipo de processo de regularização (DDRCB, CLCB, PTS_AVCB, PT)
 * a partir dos dados da edificação.
 *
 * REGRA: este módulo NUNCA decide se um sistema de segurança é obrigatório.
 * Ele só determina QUAL é a via de regularização. A obrigatoriedade dos
 * sistemas continua sendo decidida exclusivamente por determineRequiredSystems.ts
 * (que consulta requiredSystemsMatrix.ts).
 *
 * Fonte normativa principal: IT-42/2024 CBMBA, item 5.1 (PTS) e regras gerais
 * de DDRCB/CLCB do CBMBA. Reaproveita a lógica fina já validada em
 * src/lib/classification/validatePTS.ts (que usa NÚMERO DE PAVIMENTOS, não
 * altura em metros, como manda a norma).
 */

import { validatePTS } from "@/lib/classification/validatePTS";

export type ProcessType = "DDRCB" | "CLCB" | "PTS_AVCB" | "PT" | "INDETERMINADO";

export interface ValidateProcessTypeInput {
  group: string;
  division: string;
  areaM2: number;
  heightM?: number;
  floors: number;
  occupantLoad?: number;
  fireRisk: "Baixo" | "Médio" | "Alto";
  hasSubsoil?: boolean;
  subsoilUse?: string;
  /** Maior área ocupada no subsolo por uso diferente de estacionamento (m²) */
  subsoilNonParkingAreaM2?: number;
  subsoilIsPublicAssembly?: boolean;
  hasGLP?: boolean;
  glpKg?: number;
  /** GLP é revenda (comércio) ou central de consumo próprio? */
  glpIsResale?: boolean;
  sellsGLP?: boolean;
  hasFlammableLiquids?: boolean;
  flammableLiquidsLiters?: number;
  hasFlammableLiquidsAboveGroundTanks?: boolean;
  hasFlammableGasTanks?: boolean;
  hasFuelSupply?: boolean;
  hasDangerousProducts?: boolean;
  isHistoricalHeritage?: boolean;
  hasOpeningToAdjacentBuilding?: boolean;
  isInsideLargerBuilding?: boolean;
  largerBuildingHasValidAVCB?: boolean;
}

export interface ValidateProcessTypeResult {
  processType: ProcessType;
  isPTS: boolean;
  isLowPotentialRisk: boolean;
  reasons: string[];
  blockers: string[];
  missingData: string[];
  requiredHumanReview: boolean;
}

/**
 * Limite de área/risco abaixo do qual a edificação pode ser considerada de
 * "baixo potencial de risco" para fins de DDRCB (Declaração de Dispensa de
 * Regularização do Corpo de Bombeiros) — critério conservador: área muito
 * pequena, térrea, risco baixo, sem nenhuma condição agravante.
 */
function evaluateLowPotentialRisk(input: ValidateProcessTypeInput): { isLow: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let isLow = true;

  if (input.areaM2 > 200) {
    isLow = false;
  } else {
    reasons.push(`Área de ${input.areaM2} m² é compatível com baixo potencial de risco (até 200 m²).`);
  }

  if (input.floors > 1) {
    isLow = false;
  } else {
    reasons.push("Edificação térrea (1 pavimento), compatível com baixo potencial de risco.");
  }

  if (input.fireRisk !== "Baixo") {
    isLow = false;
  } else {
    reasons.push("Risco classificado como Baixo.");
  }

  if (input.hasGLP || input.hasFlammableLiquids || input.hasFuelSupply || input.hasDangerousProducts) {
    isLow = false;
  }

  if (input.group.toUpperCase() === "M") {
    isLow = false;
  }

  return { isLow, reasons };
}

export function validateProcessType(input: ValidateProcessTypeInput): ValidateProcessTypeResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  const missingData: string[] = [];

  const grupo = input.group.toUpperCase().trim();
  const divisao = input.division.toUpperCase().trim();

  // ── Dados essenciais faltando → nunca inventar, retornar INDETERMINADO ──
  if (typeof input.areaM2 !== "number" || Number.isNaN(input.areaM2)) {
    missingData.push("Área construída (m²) não informada.");
  }
  if (typeof input.floors !== "number" || Number.isNaN(input.floors)) {
    missingData.push("Número de pavimentos não informado.");
  }

  if (missingData.length > 0) {
    return {
      processType: "INDETERMINADO",
      isPTS: false,
      isLowPotentialRisk: false,
      reasons: [],
      blockers: [],
      missingData,
      requiredHumanReview: true,
    };
  }

  // ── Bloqueadores normativos explícitos (Grupo M, explosivos, etc.) ───────
  if (grupo === "M") {
    blockers.push(
      `Grupo M (${divisao}) exige avaliação técnica específica (tabelas 6M e ITs correspondentes); não se enquadra em PTS comum.`
    );
  }
  if (grupo === "L") {
    blockers.push(
      `Grupo L (${divisao} — explosivos) exige Comissão Técnica ou ITCBMBA-30 específica; não se enquadra em PTS comum.`
    );
  }
  if (input.hasFuelSupply || divisao === "G-3") {
    blockers.push("Posto de abastecimento de combustível não pode ser regularizado por PTS (item 5.1.7 da IT-42/2024).");
  }
  if (input.hasDangerousProducts) {
    blockers.push("Manipulação/armazenamento de produtos perigosos não é permitido para PTS (item 5.1.8 da IT-42/2024).");
  }

  // ── Avalia elegibilidade ao PTS reaproveitando a lógica fina existente ───
  const ptsResult = validatePTS({
    areaM2: input.areaM2,
    floors: input.floors,
    grupo,
    divisao,
    subsoilNonParkingAreaM2: input.subsoilNonParkingAreaM2,
    subsoilIsPublicAssembly: input.subsoilIsPublicAssembly,
    occupantLoad: input.occupantLoad,
    hasGLP: input.hasGLP,
    glpIsResale: input.glpIsResale ?? input.sellsGLP,
    glpKg: input.glpKg,
    hasFlammableGasTanks: input.hasFlammableGasTanks,
    hasFlammableLiquidsAboveGroundTanks: input.hasFlammableLiquidsAboveGroundTanks,
    isFuelStation: input.hasFuelSupply || divisao === "G-3",
    handlesHazardousMaterials: input.hasDangerousProducts,
  });

  reasons.push(...ptsResult.failedRequirements.map((f) => `PTS não atendido: ${f}`));
  if (ptsResult.eligible) {
    reasons.push(`Edificação atende cumulativamente aos requisitos do item 5.1 da IT-42/2024 para PTS.`);
  }

  const { isLow, reasons: lowRiskReasons } = evaluateLowPotentialRisk(input);

  // ── Bloqueadores que vetam PTS mesmo que validatePTS não tenha pego ──────
  if (blockers.length > 0) {
    return {
      processType: "PT",
      isPTS: false,
      isLowPotentialRisk: false,
      reasons: [...reasons, ...blockers],
      blockers,
      missingData,
      requiredHumanReview: grupo === "M" || grupo === "L",
    };
  }

  if (!ptsResult.eligible) {
    return {
      processType: "PT",
      isPTS: false,
      isLowPotentialRisk: isLow,
      reasons: [...reasons, ...lowRiskReasons],
      blockers,
      missingData,
      requiredHumanReview: false,
    };
  }

  // ── Elegível a PTS: dentro do PTS, pode ainda ser DDRCB se baixíssimo risco ──
  if (isLow) {
    reasons.push(...lowRiskReasons);
    reasons.push(
      "Edificação de baixo potencial de risco (área reduzida, térrea, risco Baixo, sem condições agravantes); " +
      "pode ser elegível a DDRCB conforme critérios específicos do CBMBA — confirmar com Corpo de Bombeiros local."
    );
    return {
      processType: "DDRCB",
      isPTS: true,
      isLowPotentialRisk: true,
      reasons,
      blockers,
      missingData,
      requiredHumanReview: true, // DDRCB depende de confirmação específica do CBM, nunca afirmar com certeza absoluta
    };
  }

  reasons.push("Edificação elegível ao PTS_AVCB conforme item 5.1 da IT-42/2024.");
  return {
    processType: "PTS_AVCB",
    isPTS: true,
    isLowPotentialRisk: false,
    reasons,
    blockers,
    missingData,
    requiredHumanReview: false,
  };
}
