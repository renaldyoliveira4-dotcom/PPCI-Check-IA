/**
 * Classificação de risco quanto à carga de incêndio.
 *
 * REGRA NORMATIVA (limites exatos — atenção às fronteiras):
 * - Baixo:  carga de incêndio ATÉ 300 MJ/m² (inclusive 300)
 * - Médio:  carga de incêndio ACIMA de 300 até 1.200 MJ/m² (inclusive 1.200)
 * - Alto:   carga de incêndio ACIMA de 1.200 MJ/m²
 *
 * 300 MJ/m²  → ainda é risco Baixo
 * 301 MJ/m²  → já é risco Médio
 * 1200 MJ/m² → ainda é risco Médio
 * 1201 MJ/m² → já é risco Alto
 */

export type FireRiskLevel = "Baixo" | "Médio" | "Alto" | "Não informado";

export interface FireRiskClassification {
  fireRisk: FireRiskLevel;
  fireLoadMJm2: number | null;
  reasoning: string;
}

export function classifyFireRisk(fireLoadMJm2: number | null | undefined): FireRiskClassification {
  if (fireLoadMJm2 === null || fireLoadMJm2 === undefined || Number.isNaN(fireLoadMJm2)) {
    return {
      fireRisk: "Não informado",
      fireLoadMJm2: null,
      reasoning: "Carga de incêndio não informada no projeto/memorial — não é possível classificar o risco automaticamente.",
    };
  }

  if (fireLoadMJm2 < 0) {
    return {
      fireRisk: "Não informado",
      fireLoadMJm2,
      reasoning: "Valor de carga de incêndio inválido (negativo) — exige revisão técnica.",
    };
  }

  if (fireLoadMJm2 <= 300) {
    return {
      fireRisk: "Baixo",
      fireLoadMJm2,
      reasoning: `Carga de incêndio de ${fireLoadMJm2} MJ/m² está dentro da faixa de risco Baixo (até 300 MJ/m², inclusive).`,
    };
  }

  if (fireLoadMJm2 <= 1200) {
    return {
      fireRisk: "Médio",
      fireLoadMJm2,
      reasoning: `Carga de incêndio de ${fireLoadMJm2} MJ/m² está dentro da faixa de risco Médio (acima de 300 até 1.200 MJ/m², inclusive).`,
    };
  }

  return {
    fireRisk: "Alto",
    fireLoadMJm2,
    reasoning: `Carga de incêndio de ${fireLoadMJm2} MJ/m² está acima de 1.200 MJ/m², classificando como risco Alto.`,
  };
}
