/**
 * Testes — integração do motor universal de exigências
 * (determineRequiredSystems) no checklist normativo de produção.
 *
 * Cobre especificamente as 3 falhas reais encontradas no motor antigo
 * antes desta integração:
 *   1. Brigada de Incêndio não era exigida em enquadramentos pequenos
 *      da Tabela 5 (contrariava a norma, que exige brigada para TODOS
 *      os grupos/divisões dentro de 750m²/12m).
 *   2. Controle de Materiais de Acabamento (IT-10) nunca era
 *      verificado, em nenhum caso.
 *   3. Não havia distinção entre Tabela 5 e Tabela 6 — tudo era
 *      tratado com os mesmos limiares genéricos.
 */

import { describe, it, expect } from "vitest";
import { gerarChecklistNormativo } from "../checklist";

describe("gerarChecklistNormativo — modo geral via motor de matriz", () => {
  it("Edificação pequena (Tabela 5): Brigada de Incêndio É exigida mesmo para Grupo A (residencial)", () => {
    // Bug original: regra_brigada só exigia para área>5000, grupo F/H,
    // risco elevado ou altura>23m — um A-2 pequeno nunca tinha brigada
    // exigida, embora a Tabela 5 exija para todos os grupos.
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 9,
      grupo: "A",
      divisao: "A-2",
      floors: 2,
    });

    const brigada = items.find((i) => i.sistema === "Brigada de Incêndio");
    expect(brigada).toBeDefined();
    expect(brigada?.exigido).toBe(true);
  });

  it("Edificação pequena (Tabela 5): Controle de Materiais de Acabamento aparece para Grupo B (hotel)", () => {
    // Bug original: este sistema nunca era verificado, em nenhum caso.
    const items = gerarChecklistNormativo({
      area_construida: 400,
      altura: 10,
      grupo: "B",
      divisao: "B-1",
      floors: 2,
    });

    const cma = items.find((i) => i.sistema === "Controle de Materiais de Acabamento");
    expect(cma).toBeDefined();
    expect(cma?.exigido).toBe(true);
  });

  it("Edificação pequena (Tabela 5): Controle de Materiais NÃO exigido para Grupo A (coluna sem X na tabela)", () => {
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 9,
      grupo: "A",
      divisao: "A-2",
      floors: 2,
    });

    const cma = items.find((i) => i.sistema === "Controle de Materiais de Acabamento");
    // Sistema não exigido não deve aparecer como item "exigido: true" —
    // pode estar ausente do checklist ou presente com exigido: false,
    // mas nunca deve ser reportado como obrigatório.
    if (cma) {
      expect(cma.exigido).toBe(false);
    }
  });

  it("Os 5 sistemas universais da Tabela 5 estão sempre presentes para um enquadramento pequeno comum", () => {
    const items = gerarChecklistNormativo({
      area_construida: 200,
      altura: 6,
      grupo: "C",
      divisao: "C-1",
      floors: 1,
    });

    const exigidos = items.filter((i) => i.exigido).map((i) => i.sistema);
    expect(exigidos).toContain("Saídas de Emergência");
    expect(exigidos).toContain("Iluminação de Emergência");
    expect(exigidos).toContain("Sinalização de Emergência");
    expect(exigidos).toContain("Extintores");
    expect(exigidos).toContain("Brigada de Incêndio");
  });

  it("Edificação grande (Tabela 6, área > 750m²): hidrantes aparecem como exigidos", () => {
    const items = gerarChecklistNormativo({
      area_construida: 1200,
      altura: 10,
      grupo: "C",
      divisao: "C-2",
      floors: 2,
    });

    const hidrantes = items.find((i) => i.sistema === "Hidrantes e mangotinhos" || i.sistema === "Hidrantes e Mangotinhos");
    expect(hidrantes).toBeDefined();
    expect(hidrantes?.exigido).toBe(true);
  });

  it("Edificação alta (altura > 12m, fora da Tabela 5): usa Tabela 6, não trata como Tabela 5", () => {
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 20,
      grupo: "D",
      divisao: "D-1",
      floors: 6,
    });

    // Não deve quebrar, e deve retornar algum conjunto de itens válido
    // (a tabela usada internamente é a 6, não a 5 — o teste de unidade
    // do motor já cobre isso; aqui validamos que a integração não some
    // com o resultado nesse cenário).
    expect(items.length).toBeGreaterThan(0);
  });

  it("GLP continua sendo verificado (sistema fora do motor de matriz, mantido do motor antigo)", () => {
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 9,
      grupo: "A",
      divisao: "A-2",
      floors: 2,
      has_glp: true,
    });

    const glp = items.find((i) => i.id === "IT28-glp");
    expect(glp).toBeDefined();
    expect(glp?.exigido).toBe(true);
  });

  it("Pressurização de escada continua sendo verificada para edificações altas", () => {
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 20,
      grupo: "D",
      divisao: "D-1",
      floors: 6,
    });

    const pressurizacao = items.find((i) => i.id === "IT13-pressurizacao");
    expect(pressurizacao).toBeDefined();
  });

  it("Nenhum item retornado fica sem 'sistema' definido (regressão de integração)", () => {
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 9,
      grupo: "F",
      divisao: "F-8",
      floors: 1,
    });

    for (const item of items) {
      expect(item.sistema).toBeTruthy();
      expect(item.id).toBeTruthy();
      expect(item.titulo).toBeTruthy();
    }
  });
});

describe("gerarChecklistNormativo — modos focados não foram afetados pela integração", () => {
  it("Modo 'extintores' continua funcionando isoladamente", () => {
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 9,
      grupo: "A",
      divisao: "A-2",
      floors: 2,
      analysis_mode: "extintores",
    });
    expect(items.some((i) => i.id === "IT21-extintores")).toBe(true);
  });

  it("Modo 'pts_bahia' continua funcionando isoladamente", () => {
    const items = gerarChecklistNormativo({
      area_construida: 300,
      altura: 9,
      grupo: "A",
      divisao: "A-2",
      floors: 2,
      analysis_mode: "pts_bahia",
    });
    expect(items.length).toBeGreaterThan(0);
  });
});
