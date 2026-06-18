/**
 * Validação de riscos especiais declarados no projeto.
 *
 * REGRA: riscos especiais NUNCA criam exigência de sistema por si só dentro
 * deste módulo — eles apenas direcionam para a IT específica correspondente,
 * que deve ser consultada manualmente ou por um módulo de dimensionamento
 * dedicado. Este módulo apenas sinaliza e referencia a norma; não decide
 * obrigatoriedade de sistemas da matriz (isso é exclusividade de
 * determineRequiredSystems.ts).
 */

export type SpecialRiskType =
  | "GLP"
  | "liquidos_inflamaveis"
  | "explosivos"
  | "produtos_perigosos"
  | "processo_industrial_alto_risco"
  | "abastecimento_combustivel"
  | "outro";

export interface ValidateSpecialRisksInput {
  hasSpecialRisks?: boolean;
  specialRisks?: string[];
  hasGLP?: boolean;
  glpKg?: number;
  hasFlammableLiquids?: boolean;
  flammableLiquidsLiters?: number;
  hasFuelSupply?: boolean;
  hasDangerousProducts?: boolean;
}

export interface SpecialRiskFinding {
  riskType: SpecialRiskType;
  description: string;
  itReference: string;
  requiresAdditionalReview: boolean;
}

export interface ValidateSpecialRisksResult {
  hasAnyRisk: boolean;
  findings: SpecialRiskFinding[];
  globalWarning: string | null;
  requiredHumanReview: boolean;
}

export function validateSpecialRisks(input: ValidateSpecialRisksInput): ValidateSpecialRisksResult {
  const findings: SpecialRiskFinding[] = [];

  if (input.hasGLP) {
    findings.push({
      riskType: "GLP",
      description: `Armazenamento/uso de GLP${typeof input.glpKg === "number" ? ` (${input.glpKg} kg)` : ""}.`,
      itReference: "ITCBMBA-28 (manipulação, armazenamento, comercialização e utilização de GLP)",
      requiresAdditionalReview: true,
    });
  }

  if (input.hasFlammableLiquids) {
    findings.push({
      riskType: "liquidos_inflamaveis",
      description: `Armazenamento/manipulação de líquidos inflamáveis ou combustíveis${
        typeof input.flammableLiquidsLiters === "number" ? ` (${input.flammableLiquidsLiters} litros)` : ""
      }.`,
      itReference: "ITCBMBA-25 (segurança contra incêndio para líquidos inflamáveis e combustíveis)",
      requiresAdditionalReview: true,
    });
  }

  if (input.hasFuelSupply) {
    findings.push({
      riskType: "abastecimento_combustivel",
      description: "Edificação possui abastecimento de combustível (posto de combustível ou similar).",
      itReference: "ITCBMBA-25 e Tabela 6G.2 (Divisão G-3)",
      requiresAdditionalReview: true,
    });
  }

  if (input.hasDangerousProducts) {
    findings.push({
      riskType: "produtos_perigosos",
      description: "Manipulação ou armazenamento de produtos perigosos à saúde, ao meio ambiente ou ao patrimônio.",
      itReference: "IT específica do produto perigoso declarado — exige identificação detalhada e Comissão Técnica quando aplicável",
      requiresAdditionalReview: true,
    });
  }

  if (input.specialRisks && input.specialRisks.length > 0) {
    for (const risk of input.specialRisks) {
      const normalized = risk.toLowerCase();
      if (normalized.includes("explosiv")) {
        findings.push({
          riskType: "explosivos",
          description: `Risco especial declarado: ${risk}.`,
          itReference: "ITCBMBA-30 (explosivos) — Grupo L sempre exige Comissão Técnica para L-2/L-3",
          requiresAdditionalReview: true,
        });
      } else if (!findings.some((f) => f.description.toLowerCase().includes(normalized))) {
        findings.push({
          riskType: "outro",
          description: `Risco especial declarado: ${risk}.`,
          itReference: "Consultar IT específica correspondente ao risco declarado.",
          requiresAdditionalReview: true,
        });
      }
    }
  }

  const hasAnyRisk = findings.length > 0;

  return {
    hasAnyRisk,
    findings,
    globalWarning: hasAnyRisk
      ? "Riscos especiais identificados podem acrescentar exigências além da matriz padrão de sistemas " +
        "(Tabela 5/6 do Decreto 16.302/2015). Consultar a IT específica de cada risco listado; estas exigências " +
        "são cumulativas às exigências normais da matriz, não substitutas."
      : null,
    requiredHumanReview: hasAnyRisk,
  };
}
