/**
 * Testes de validateProcessType — determinação de DDRCB / CLCB / PTS_AVCB / PT.
 */

import { describe, it, expect } from "vitest";
import { validateProcessType, type ValidateProcessTypeInput } from "../validateProcessType";

function expectProcessType(input: ValidateProcessTypeInput, expectedType: string) {
  const result = validateProcessType(input);
  expect(result.processType).toBe(expectedType);
  return result;
}

describe("validateProcessType — caso do prompt", () => {
  it("D-1 / 318,75m² / 2 pavimentos / risco Baixo -> elegível a PTS (PTS_AVCB ou DDRCB)", () => {
    const result = validateProcessType({
      group: "D",
      division: "D-1",
      areaM2: 318.75,
      floors: 2,
      heightM: 6,
      fireRisk: "Baixo",
    });
    expect(result.isPTS).toBe(true);
    expect(["PTS_AVCB", "DDRCB"]).toContain(result.processType);
  });
});

describe("validateProcessType — bloqueadores e limites", () => {
  it("Edificação >750m² -> nunca PTS, vira PT", () => {
    expectProcessType(
      { group: "D", division: "D-1", areaM2: 900, floors: 2, heightM: 8, fireRisk: "Baixo" },
      "PT"
    );
  });

  it("Edificação com 4 pavimentos -> nunca PTS, mesmo com área pequena (critério é pavimentos, não altura)", () => {
    expectProcessType(
      { group: "D", division: "D-1", areaM2: 300, floors: 4, heightM: 8, fireRisk: "Baixo" },
      "PT"
    );
  });

  it("Posto de combustível (G-3) -> nunca PTS", () => {
    expectProcessType(
      { group: "G", division: "G-3", areaM2: 300, floors: 1, heightM: 4, fireRisk: "Baixo", hasFuelSupply: true },
      "PT"
    );
  });

  it("Produtos perigosos declarados -> nunca PTS", () => {
    expectProcessType(
      { group: "D", division: "D-1", areaM2: 300, floors: 1, heightM: 4, fireRisk: "Baixo", hasDangerousProducts: true },
      "PT"
    );
  });

  it("Grupo M -> sempre PT (avaliação técnica específica), nunca PTS comum", () => {
    expectProcessType(
      { group: "M", division: "M-2", areaM2: 200, floors: 1, heightM: 4, fireRisk: "Médio" },
      "PT"
    );
  });

  it("Grupo L -> sempre PT (Comissão Técnica/ITCBMBA-30), nunca PTS comum", () => {
    expectProcessType(
      { group: "L", division: "L-2", areaM2: 100, floors: 1, heightM: 4, fireRisk: "Alto" },
      "PT"
    );
  });
});

describe("validateProcessType — dados essenciais faltando", () => {
  it("área ausente -> INDETERMINADO com revisão obrigatória, nunca PT ou PTS por suposição", () => {
    // @ts-expect-error -- omitindo areaM2 propositalmente para testar o guard de dados essenciais
    const result = validateProcessType({ group: "D", division: "D-1", floors: 2, heightM: 6, fireRisk: "Baixo" });
    expect(result.processType).toBe("INDETERMINADO");
    expect(result.requiredHumanReview).toBe(true);
  });
});

describe("validateProcessType — baixo potencial de risco (DDRCB)", () => {
  it("edificação térrea pequena/baixo risco -> DDRCB sinalizado com revisão (nunca afirmado sem ressalva)", () => {
    const result = validateProcessType({
      group: "D",
      division: "D-1",
      areaM2: 80,
      floors: 1,
      heightM: 3,
      fireRisk: "Baixo",
    });
    expect(result.processType).toBe("DDRCB");
    expect(result.isLowPotentialRisk).toBe(true);
    expect(result.requiredHumanReview).toBe(true);
  });
});
