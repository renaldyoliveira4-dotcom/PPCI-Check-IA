/**
 * Testes de exigência de Hidrantes e Mangotinhos (Etapa 9 do prompt de
 * correção do motor de exigências) — cobre o caso de teste obrigatório e os
 * 11 casos adicionais listados no prompt.
 */

import { describe, it, expect } from "vitest";
import { getHydrantsRequirement, type GetHydrantsRequirementInput } from "../hydrantsRequirement";

function expectRequirement(
  input: GetHydrantsRequirementInput,
  expectedStatus: string,
  expectedTableSubstring?: string
) {
  const result = getHydrantsRequirement(input);
  expect(result.status).toBe(expectedStatus);
  if (expectedTableSubstring) {
    expect(result.normativeBasis.some((t) => t.includes(expectedTableSubstring))).toBe(true);
  }
  return result;
}

describe("getHydrantsRequirement — caso de teste obrigatório do prompt", () => {
  it("D-1 / 318,75 m² / 2 pavimentos / PTS / risco Baixo -> NOT_REQUIRED", () => {
    const result = getHydrantsRequirement({
      group: "D",
      division: "D-1",
      areaM2: 318.75,
      floors: 2,
      heightM: 6,
      processType: "PTS_AVCB",
      fireRisk: "Baixo",
      fireLoadMJm2: 300,
      hasSpecialRisks: false,
    });

    expect(result.required).toBe(false);
    expect(result.status).toBe("NOT_REQUIRED");
  });

  it("a justificativa NUNCA usa 'Anexo E da IT-22 não isenta' nem 'Tabela 3 da IT-22'", () => {
    const result = getHydrantsRequirement({
      group: "D",
      division: "D-1",
      areaM2: 318.75,
      floors: 2,
      heightM: 6,
      processType: "PTS_AVCB",
      fireRisk: "Baixo",
      fireLoadMJm2: 300,
      hasSpecialRisks: false,
    });

    expect(result.reason).not.toMatch(/anexo e da it-22 n[aã]o isenta|tabela 3 da it-22/i);
  });
});

describe("getHydrantsRequirement — demais casos do prompt", () => {
  it("D-1 / 751 m² -> consultar Tabela 6D, hidrante REQUIRED", () => {
    expectRequirement(
      { group: "D", division: "D-1", areaM2: 751, floors: 2, heightM: 6, processType: "PT", fireRisk: "Baixo" },
      "REQUIRED",
      "Tabela 6D"
    );
  });

  it("D-1 / altura 13 m -> consultar Tabela 6D, hidrante REQUIRED", () => {
    expectRequirement(
      { group: "D", division: "D-1", areaM2: 300, floors: 4, heightM: 13, processType: "PT", fireRisk: "Baixo" },
      "REQUIRED",
      "Tabela 6D"
    );
  });

  it("F-8 / 500 m² / altura 6 m / PTS -> Tabela 5, hidrante NOT_REQUIRED", () => {
    expectRequirement(
      { group: "F", division: "F-8", areaM2: 500, floors: 1, heightM: 6, processType: "PTS_AVCB", fireRisk: "Baixo" },
      "NOT_REQUIRED",
      "Tabela 5"
    );
  });

  it("F-8 / 900 m² -> consultar Tabela 6F.3, hidrante REQUIRED", () => {
    expectRequirement(
      { group: "F", division: "F-8", areaM2: 900, floors: 1, heightM: 6, processType: "PT", fireRisk: "Baixo" },
      "REQUIRED",
      "Tabela 6F.3"
    );
  });

  it("H-6 / 500 m² / PTS -> aplicar Tabela 5, hidrante NOT_REQUIRED", () => {
    expectRequirement(
      { group: "H", division: "H-6", areaM2: 500, floors: 1, heightM: 6, processType: "PTS_AVCB", fireRisk: "Baixo" },
      "NOT_REQUIRED",
      "Tabela 5"
    );
  });

  it("H-6 / 900 m² -> consultar Tabela 6H.3, hidrante REQUIRED", () => {
    expectRequirement(
      { group: "H", division: "H-6", areaM2: 900, floors: 2, heightM: 8, processType: "PT", fireRisk: "Baixo" },
      "REQUIRED",
      "Tabela 6H.3"
    );
  });

  it("I-1 / 600 m² / altura 6 m -> aplicar Tabela 5, hidrante NOT_REQUIRED", () => {
    expectRequirement(
      { group: "I", division: "I-1", areaM2: 600, floors: 1, heightM: 6, processType: "PT", fireRisk: "Baixo" },
      "NOT_REQUIRED",
      "Tabela 5"
    );
  });

  it("I-1 / 900 m² -> consultar Tabela 6I.1, hidrante REQUIRED", () => {
    expectRequirement(
      { group: "I", division: "I-1", areaM2: 900, floors: 1, heightM: 6, processType: "PT", fireRisk: "Baixo" },
      "REQUIRED",
      "Tabela 6I.1"
    );
  });

  it("J-1 / 900 m² / altura 6m -> consultar Tabela 6J.1; hidrante NOT_REQUIRED até 12m", () => {
    expectRequirement(
      { group: "J", division: "J-1", areaM2: 900, floors: 1, heightM: 6, processType: "PT", fireRisk: "Baixo" },
      "NOT_REQUIRED",
      "Tabela 6J.1"
    );
  });

  it("J-1 / 900 m² / altura 15m -> consultar Tabela 6J.1; hidrante REQUIRED acima de 12m", () => {
    expectRequirement(
      { group: "J", division: "J-1", areaM2: 900, floors: 3, heightM: 15, processType: "PT", fireRisk: "Baixo" },
      "REQUIRED",
      "Tabela 6J.1"
    );
  });
});

describe("getHydrantsRequirement — M-1 túnel (estrutura especial por extensão)", () => {
  it("M-1 sem extensão informada -> PENDING (nunca NOT_REQUIRED por suposição, nunca Tabela 5 genérica)", () => {
    const result = getHydrantsRequirement({
      group: "M",
      division: "M-1",
      areaM2: 5000,
      floors: 1,
      heightM: 0,
      processType: "PT",
      fireRisk: "Médio",
    });
    expect(result.status).toBe("PENDING");
    expect(result.normativeBasis.some((t) => t.includes("Tabela 6M.1"))).toBe(true);
  });

  it("M-1 com extensão de 300m (faixa 'De 200 a 500') -> hidrante REQUIRED", () => {
    expectRequirement(
      {
        group: "M",
        division: "M-1",
        areaM2: 5000,
        floors: 1,
        heightM: 0,
        processType: "PT",
        fireRisk: "Médio",
        tunnelExtensionM: 300,
      },
      "REQUIRED",
      "Tabela 6M.1"
    );
  });

  it("M-1 com extensão de 150m (faixa 'Até 200') -> hidrante NOT_REQUIRED", () => {
    expectRequirement(
      {
        group: "M",
        division: "M-1",
        areaM2: 5000,
        floors: 1,
        heightM: 0,
        processType: "PT",
        fireRisk: "Médio",
        tunnelExtensionM: 150,
      },
      "NOT_REQUIRED",
      "Tabela 6M.1"
    );
  });
});
