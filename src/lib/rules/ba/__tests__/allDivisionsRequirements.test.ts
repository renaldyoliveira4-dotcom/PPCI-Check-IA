/**
 * Testes de cobertura — determineRequiredSystems funcionando para TODAS as
 * divisões/grupos do Decreto 16.302/2015 (A, B, C, D, E, F, G, H, I, J, L, M),
 * tanto na faixa da Tabela 5 (<=750m², <=12m) quanto na faixa das Tabelas 6
 * (>750m² OU >12m).
 */

import { describe, it, expect } from "vitest";
import { determineRequiredSystems, type DetermineRequiredSystemsInput } from "../determineRequiredSystems";

function runAndExpectSomeResult(input: DetermineRequiredSystemsInput) {
  const result = determineRequiredSystems(input);
  const hasAnySystem =
    result.requiredSystems.length + result.notRequiredSystems.length + result.pendingSystems.length > 0;
  expect(hasAnySystem).toBe(true);
  return result;
}

describe("determineRequiredSystems — Tabela 5 (<=750m² e <=12m), uma divisão por grupo", () => {
  const tabela5Cases: Array<[string, string]> = [
    ["A", "A-2"],
    ["B", "B-1"],
    ["C", "C-1"],
    ["D", "D-1"],
    ["E", "E-1"],
    ["F", "F-8"],
    ["G", "G-1"],
    ["H", "H-6"],
    ["I", "I-1"],
    ["J", "J-2"],
    ["L", "L-1"],
  ];

  for (const [group, division] of tabela5Cases) {
    it(`${group}/${division} dentro da Tabela 5 retorna sistemas (required+notRequired+pending > 0)`, () => {
      runAndExpectSomeResult({
        group,
        division,
        areaM2: 400,
        floors: 1,
        heightM: 6,
        processType: "PTS_AVCB",
        fireRisk: "Baixo",
      });
    });
  }
});

describe("determineRequiredSystems — Tabelas 6A-6M, mesma divisão fora da faixa da Tabela 5", () => {
  const tabela6Cases: Array<[string, string, string]> = [
    ["A", "A-2", "Tabela 6A"],
    ["B", "B-1", "Tabela 6B"],
    ["C", "C-1", "Tabela 6C"],
    ["D", "D-1", "Tabela 6D"],
    ["E", "E-1", "Tabela 6E"],
    ["F", "F-8", "Tabela 6F.3"],
    ["G", "G-1", "Tabela 6G.1"],
    ["H", "H-6", "Tabela 6H.3"],
    ["I", "I-1", "Tabela 6I.1"],
    ["J", "J-2", "Tabela 6J.1"],
  ];

  for (const [group, division, expectedTable] of tabela6Cases) {
    it(`${group}/${division} (área 900m²) usa ${expectedTable} corretamente`, () => {
      const result = runAndExpectSomeResult({
        group,
        division,
        areaM2: 900,
        floors: 2,
        heightM: 8,
        processType: "PT",
        fireRisk: "Baixo",
      });
      expect(result.normativeTablesUsed.some((t) => t.includes(expectedTable))).toBe(true);
    });
  }
});

describe("determineRequiredSystems — Grupo L (explosivos), sem Tabela 6L cadastrada", () => {
  it("L-2 acima de 750m² -> revisão técnica obrigatória, nenhuma exigência inventada", () => {
    const result = determineRequiredSystems({
      group: "L",
      division: "L-2",
      areaM2: 900,
      floors: 2,
      heightM: 8,
      processType: "PT",
      fireRisk: "Alto",
    });
    expect(result.requiredHumanReview).toBe(true);
    expect(result.requiredSystems.length).toBe(0);
  });
});

describe("determineRequiredSystems — Grupo M, sempre usa tabela específica (nunca Tabela 5/6 genérica)", () => {
  const grupoMCases: Array<[string, string]> = [
    ["M-1", "Tabela 6M.1"],
    ["M-2", "Tabela 6M.2"],
    ["M-3", "Tabela 6M.3"],
    ["M-4", "Tabela 6M.4"],
    ["M-5", "Tabela 6M.5"],
  ];

  for (const [division, expectedTable] of grupoMCases) {
    it(`M (${division}) usa ${expectedTable}, nunca Tabela 5 genérica`, () => {
      const result = determineRequiredSystems({
        group: "M",
        division,
        areaM2: 1000,
        floors: 1,
        heightM: 5,
        processType: "PT",
        fireRisk: "Médio",
        tunnelExtensionM: division === "M-1" ? 600 : undefined,
      });
      expect(result.normativeTablesUsed.some((t) => t.includes(expectedTable))).toBe(true);
      expect(result.normativeTablesUsed.some((t) => t.includes("Tabela 5") && !t.includes("6M"))).toBe(false);
    });
  }
});

describe("determineRequiredSystems — divisão inexistente na matriz", () => {
  it("Z-9 (divisão fictícia) -> revisão técnica, zero exigências inventadas", () => {
    const result = determineRequiredSystems({
      group: "Z",
      division: "Z-9",
      areaM2: 900,
      floors: 2,
      heightM: 8,
      processType: "PT",
      fireRisk: "Baixo",
    });
    expect(result.requiredHumanReview).toBe(true);
    expect(result.requiredSystems.length).toBe(0);
  });
});
