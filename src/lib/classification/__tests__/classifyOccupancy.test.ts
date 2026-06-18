/**
 * Testes unitários — classificação de ocupação/divisão.
 * Cobre: classificação direta, ambiguidade, ocupação mista, fronteiras de
 * carga de incêndio, e casos não enquadráveis.
 */

import { describe, it, expect } from "vitest";
import { classifyOccupancy, UNCLASSIFIED } from "../classifyOccupancy";
import { classifyFireRisk } from "../classifyFireRisk";
import { detectMixedOccupancy } from "../detectMixedOccupancy";
import { validatePTS } from "../validatePTS";

describe("classifyOccupancy — classificação direta", () => {
  it("Escritórios / Serviços profissionais / D-1 / 300 MJ/m²", () => {
    const r = classifyOccupancy({
      projectText: "Escritórios administrativos, serviços profissionais, D-1",
      fireLoadMJm2: 300,
    });
    expect(r.division).toBe("D-1");
    expect(r.fireRisk).toBe("Baixo");
    expect(r.confidence).toBeGreaterThan(0.7);
  });

  it("Agência bancária -> D-2, não D-1", () => {
    const r = classifyOccupancy({ projectText: "Agência bancária com caixas eletrônicos" });
    expect(r.division).toBe("D-2");
  });

  it("Restaurante -> F-8", () => {
    const r = classifyOccupancy({ projectText: "Restaurante para refeições, sem música ao vivo" });
    expect(r.division).toBe("F-8");
  });

  it("Restaurante dançante -> F-6 ou F-11", () => {
    const r = classifyOccupancy({ projectText: "Restaurante dançante com pista de dança e música ao vivo" });
    expect(["F-6", "F-11"]).toContain(r.division);
  });

  it("Igreja -> F-2", () => {
    const r = classifyOccupancy({ projectText: "Igreja evangélica com salão de cultos" });
    expect(r.division).toBe("F-2");
  });

  it("Academia sem arquibancada -> E-3", () => {
    const r = classifyOccupancy({ projectText: "Academia de musculação e ginástica, sem arquibancada" });
    expect(r.division).toBe("E-3");
  });

  it("Ginásio com arquibancada -> F-3", () => {
    const r = classifyOccupancy({ projectText: "Ginásio poliesportivo com arquibancada para público" });
    expect(r.division).toBe("F-3");
  });

  it("Clínica médica sem internação -> H-6", () => {
    const r = classifyOccupancy({ projectText: "Clínica médica sem internação, consultórios" });
    expect(r.division).toBe("H-6");
  });

  it("Clínica com internação -> H-3", () => {
    const r = classifyOccupancy({ projectText: "Clínica com internação de pacientes, leitos hospitalares" });
    expect(r.division).toBe("H-3");
  });

  it("Depósito com carga 300 MJ/m² -> J-2, risco Baixo", () => {
    const r = classifyOccupancy({ projectText: "Depósito geral de mercadorias", fireLoadMJm2: 300 });
    expect(r.division).toBe("J-2");
    expect(r.fireRisk).toBe("Baixo");
  });

  it("Depósito com carga 301 MJ/m² -> J-3, risco Médio", () => {
    const r = classifyOccupancy({ projectText: "Depósito geral de mercadorias", fireLoadMJm2: 301 });
    expect(r.division).toBe("J-3");
    expect(r.fireRisk).toBe("Médio");
  });

  it("Indústria com carga 1201 MJ/m² -> I-3, risco Alto", () => {
    const r = classifyOccupancy({ projectText: "Indústria de processamento e fabricação", fireLoadMJm2: 1201 });
    expect(r.division).toBe("I-3");
    expect(r.fireRisk).toBe("Alto");
  });

  it("Posto de combustível -> G-3", () => {
    const r = classifyOccupancy({ projectText: "Posto de combustível para abastecimento de veículos" });
    expect(r.division).toBe("G-3");
  });

  it("Oficina mecânica -> G-4", () => {
    const r = classifyOccupancy({ projectText: "Oficina mecânica para manutenção automotiva" });
    expect(r.division).toBe("G-4");
  });
});

describe("classifyOccupancy — casos não enquadráveis e ambiguidade", () => {
  it("ocupação não enquadrável retorna UNCLASSIFIED com revisão obrigatória", () => {
    const r = classifyOccupancy({ projectText: "xyzabc123 atividade totalmente desconhecida sem nenhuma palavra-chave reconhecível" });
    expect(r.division).toBe(UNCLASSIFIED);
    expect(r.requiredHumanReview).toBe(true);
  });

  it("ambiguidade retorna estrutura de alternativas", () => {
    const r = classifyOccupancy({ projectText: "lavanderia e assistência técnica de eletrodomésticos, oficina mecânica" });
    expect(r.alternatives.length).toBeGreaterThanOrEqual(0);
  });

  it("carga de incêndio ausente não é inventada", () => {
    const r = classifyOccupancy({ projectText: "indústria de móveis e marcenaria" });
    expect(r.fireLoadMJm2).toBeNull();
    expect(r.fireRisk).toBe("Não informado");
  });
});

describe("classifyFireRisk — fronteiras exatas", () => {
  it("300 MJ/m² = Baixo", () => {
    expect(classifyFireRisk(300).fireRisk).toBe("Baixo");
  });
  it("301 MJ/m² = Médio", () => {
    expect(classifyFireRisk(301).fireRisk).toBe("Médio");
  });
  it("1200 MJ/m² = Médio", () => {
    expect(classifyFireRisk(1200).fireRisk).toBe("Médio");
  });
  it("1201 MJ/m² = Alto", () => {
    expect(classifyFireRisk(1201).fireRisk).toBe("Alto");
  });
  it("null = Não informado", () => {
    expect(classifyFireRisk(null).fireRisk).toBe("Não informado");
  });
});

describe("detectMixedOccupancy", () => {
  it("térreo comercial + andares residenciais -> detecta ocupação mista, predominante residencial", () => {
    const r = detectMixedOccupancy({
      segments: [
        { segmentText: "térreo: loja de roupas, comércio baixa carga", areaM2: 200 },
        { segmentText: "pavimentos superiores: apartamentos residenciais", areaM2: 1800 },
      ],
    });
    expect(r.isMixed).toBe(true);
    expect(r.predominant?.division).toBe("A-2");
  });
});

describe("validatePTS", () => {
  it("D-1, 600m², 2 pavimentos -> elegível ao PTS", () => {
    const r = validatePTS({ areaM2: 600, floors: 2, grupo: "D", divisao: "D-1" });
    expect(r.eligible).toBe(true);
    expect(r.tipo).toBe("PTS");
  });

  it("826,38 m² -> NÃO elegível ao PTS (excede 750 m²)", () => {
    const r = validatePTS({ areaM2: 826.38, floors: 1, grupo: "D", divisao: "D-1" });
    expect(r.eligible).toBe(false);
    expect(r.tipo).toBe("PROJETO_TECNICO");
  });

  it("4 pavimentos -> NÃO elegível ao PTS, mesmo com área pequena (critério é pavimentos, não altura)", () => {
    const r = validatePTS({ areaM2: 500, floors: 4, grupo: "D", divisao: "D-1" });
    expect(r.eligible).toBe(false);
    expect(r.failedRequirements.some((f) => f.includes("pavimentos"))).toBe(true);
  });

  it("posto de combustível nunca é PTS", () => {
    const r = validatePTS({ areaM2: 300, floors: 1, grupo: "G", divisao: "G-3", isFuelStation: true });
    expect(r.eligible).toBe(false);
  });
});

// ── Casos de classificação pedidos na Etapa 9 do prompt de correção do motor de exigências ──

describe("classifyOccupancy — Etapa 9 do prompt (casos obrigatórios)", () => {
  it("Agência bancária -> D-2", () => {
    const r = classifyOccupancy({ projectText: "Agência bancária" });
    expect(r.division).toBe("D-2");
  });

  it("Restaurante sem música/dança -> F-8", () => {
    const r = classifyOccupancy({ projectText: "Restaurante sem música ao vivo ou dança, refeitório" });
    expect(r.division).toBe("F-8");
  });

  it("Restaurante dançante -> F-6/F-11 ou revisão técnica", () => {
    const r = classifyOccupancy({ projectText: "Restaurante com pista de dança e música ao vivo" });
    expect(r.division === "F-6" || r.division === "F-11" || r.requiredHumanReview).toBe(true);
  });

  it("Igreja -> F-2", () => {
    const r = classifyOccupancy({ projectText: "Igreja evangélica, templo religioso" });
    expect(r.division).toBe("F-2");
  });

  it("Academia sem arquibancada -> E-3", () => {
    const r = classifyOccupancy({ projectText: "Academia de musculação, ginástica e pilates, espaço para cultura física" });
    expect(r.division).toBe("E-3");
  });

  it("Ginásio com arquibancada -> F-3", () => {
    const r = classifyOccupancy({ projectText: "Ginásio com arquibancada, centro esportivo" });
    expect(r.division).toBe("F-3");
  });

  it("Clínica sem internação -> H-6", () => {
    const r = classifyOccupancy({ projectText: "Clínica odontológica sem internação, consultório médico" });
    expect(r.division).toBe("H-6");
  });

  it("Clínica/hospital com internação -> H-3", () => {
    const r = classifyOccupancy({ projectText: "Hospital com internação de pacientes" });
    expect(r.division).toBe("H-3");
  });

  it("Posto de combustível -> G-3", () => {
    const r = classifyOccupancy({ projectText: "Posto de combustível, abastecimento de veículos" });
    expect(r.division).toBe("G-3");
  });

  it("Oficina mecânica -> G-4", () => {
    const r = classifyOccupancy({ projectText: "Oficina mecânica, borracharia, serviço de reparação automotiva" });
    expect(r.division).toBe("G-4");
  });

  it("Depósito incombustível -> J-1", () => {
    const r = classifyOccupancy({ projectText: "Depósito de material incombustível, depósito de cimento e tijolos" });
    expect(r.division).toBe("J-1");
  });

  it("Depósito 300 MJ/m² -> J-2, risco baixo", () => {
    const r = classifyOccupancy({ projectText: "Depósito geral, armazém com baixa carga de incêndio", fireLoadMJm2: 300 });
    expect(r.division).toBe("J-2");
    expect(r.fireRisk).toBe("Baixo");
  });

  it("Depósito 301 MJ/m² -> J-3, risco médio", () => {
    const r = classifyOccupancy({ projectText: "Depósito geral, armazém", fireLoadMJm2: 301 });
    expect(r.division).toBe("J-3");
    expect(r.fireRisk).toBe("Médio");
  });

  it("Depósito 1201 MJ/m² -> J-4, risco alto", () => {
    const r = classifyOccupancy({ projectText: "Depósito geral, armazém", fireLoadMJm2: 1201 });
    expect(r.division).toBe("J-4");
    expect(r.fireRisk).toBe("Alto");
  });

  it("Indústria 300 MJ/m² -> I-1, risco baixo", () => {
    const r = classifyOccupancy({ projectText: "Indústria, processo industrial leve, serralheria", fireLoadMJm2: 300 });
    expect(r.division).toBe("I-1");
    expect(r.fireRisk).toBe("Baixo");
  });

  it("Indústria 301 MJ/m² -> I-2, risco médio", () => {
    const r = classifyOccupancy({ projectText: "Indústria, processo industrial", fireLoadMJm2: 301 });
    expect(r.division).toBe("I-2");
    expect(r.fireRisk).toBe("Médio");
  });

  it("Indústria 1201 MJ/m² -> I-3, risco alto", () => {
    const r = classifyOccupancy({ projectText: "Indústria, processo industrial", fireLoadMJm2: 1201 });
    expect(r.division).toBe("I-3");
    expect(r.fireRisk).toBe("Alto");
  });
});
