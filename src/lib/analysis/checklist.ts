/**
 * Motor de checklist normativo determinístico — CBMBA
 * TAREFA 6 — src/lib/analysis/checklist.ts
 *
 * O checklist NÃO depende de IA. A IA apenas confronta a planta
 * contra os itens gerados aqui.
 */

import { REGRAS_CORE } from "./normas/cbmba/rules/core";
import { gerarChecklistViaMatriz } from "./normas/cbmba/rules/checklistViaMatriz";
import {
  regra_hidrantes,
  regra_alarme,
  regra_brigada,
  regra_sprinklers,
  regra_pressurizacao,
  regra_glp,
  regra_estrutural,
  type ProjectSnapshot,
} from "./normas/cbmba/rules/sistemas";
import { classificarRisco } from "./normas/riscos";
import { obterOcupacao } from "./normas/ocupacoes";

export type Severidade = "baixa" | "media" | "alta" | "critica";

export interface ChecklistNormativoItem {
  id: string;
  sistema: string;
  norma: string;
  item_normativo?: string;
  titulo: string;
  descricao: string;
  exigido: boolean;
  motivo: string;
  severidade: Severidade;
  verificar_na_planta: string[];
  verificar_no_memorial: string[];
  palavras_chave: string[];
}

export type ModoAnalise =
  | "geral"
  | "extintores"
  | "hidrantes"
  | "saidas"
  | "sinalizacao_iluminacao"
  | "pts_bahia"
  | "estrutural_compartimentacao";

export interface ChecklistInput {
  area_construida: number;
  altura: number;
  grupo: string;
  divisao: string;
  floors?: number;
  has_glp?: boolean;
  has_basement?: boolean;
  analysis_mode?: ModoAnalise;
  occupancy_type?: string; // "A-1", "F-8" etc
}

/**
 * Gera o checklist normativo determinístico com base nos dados do projeto.
 * NÃO chama IA — pura lógica de regras.
 */
export function gerarChecklistNormativo(
  input: ChecklistInput
): ChecklistNormativoItem[] {
  const {
    area_construida,
    altura,
    grupo,
    divisao,
    floors = 1,
    has_glp = false,
    has_basement = false,
    analysis_mode = "geral",
  } = input;

  // Classifica risco pela ocupação
  const ocupacao = obterOcupacao(grupo, divisao);
  const cargaIncendio = ocupacao?.carga_incendio_especifica ?? 500;
  const riscoInfo = classificarRisco(cargaIncendio);
  const risco = riscoInfo.nivel as "LEVE" | "MODERADO" | "ELEVADO";

  const is_reuniao_publico = grupo.toUpperCase() === "F";

  const snap: ProjectSnapshot = {
    area_construida,
    altura,
    grupo: grupo.toUpperCase(),
    divisao: divisao.toUpperCase(),
    risco,
    floors,
    has_glp,
    has_basement,
    is_reuniao_publico,
    analysis_mode,
  };

  // ── Modos de análise focada ───────────────────────────────────────────

  if (analysis_mode === "extintores") {
    return [
      toItem(REGRAS_CORE.find((r) => r.id === "IT21-extintores")!, true, "Modo: extintores"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT04-simbolos")!, true, "Modo: extintores — legenda necessária"),
    ].filter(Boolean);
  }

  if (analysis_mode === "hidrantes") {
    return [
      toItem(REGRAS_CORE.find((r) => r.id === "IT04-simbolos")!, true, "Modo: hidrantes — legenda necessária"),
      regra_hidrantes({ ...snap, area_construida: 99999 })!,
    ].filter(Boolean);
  }

  if (analysis_mode === "saidas") {
    return [
      toItem(REGRAS_CORE.find((r) => r.id === "IT11-saidas")!, true, "Modo: saídas"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT04-simbolos")!, true, "Modo: saídas — legenda necessária"),
      ...(altura > 12 ? [regra_pressurizacao(snap)!] : []),
    ].filter(Boolean);
  }

  if (analysis_mode === "sinalizacao_iluminacao") {
    return [
      toItem(REGRAS_CORE.find((r) => r.id === "IT18-iluminacao")!, true, "Modo: sinalização/iluminação"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT20-sinalizacao")!, true, "Modo: sinalização/iluminação"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT04-simbolos")!, true, "Modo: sinalização/iluminação — legenda necessária"),
    ].filter(Boolean);
  }

  if (analysis_mode === "pts_bahia") {
    return [
      toItem(REGRAS_CORE.find((r) => r.id === "IT21-extintores")!, true, "PTS Bahia — extintor obrigatório"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT11-saidas")!, true, "PTS Bahia — saídas de emergência"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT18-iluminacao")!, true, "PTS Bahia — iluminação de emergência"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT20-sinalizacao")!, true, "PTS Bahia — sinalização de emergência"),
      toItem(REGRAS_CORE.find((r) => r.id === "IT04-simbolos")!, true, "PTS Bahia — legenda com simbolos IT-04"),
      ...(has_glp ? [regra_glp(snap)!] : []),
    ].filter(Boolean);
  }

  if (analysis_mode === "estrutural_compartimentacao") {
    const est = regra_estrutural(snap);
    const press = regra_pressurizacao(snap);
    return [est, press].filter((i): i is ChecklistNormativoItem => i !== null);
  }

  // ── Modo geral (padrão) ───────────────────────────────────────────────
  //
  // Os sistemas "universais" (extintores, saídas, iluminação, sinalização,
  // brigada, controle de materiais) e os condicionados a área/altura
  // (hidrantes, alarme/detecção, sprinklers, compartimentação, segurança
  // estrutural) vêm agora do motor de matriz normativa completo
  // (determineRequiredSystems → Tabela 5/6 do Decreto 16.302/2015), que
  // substitui a lógica antiga abaixo. Essa troca corrige duas falhas
  // identificadas no motor anterior: (1) Brigada de Incêndio não era
  // exigida para enquadramentos pequenos da Tabela 5, contrariando a
  // norma; (2) Controle de Materiais de Acabamento (IT-10) nunca era
  // verificado, em nenhum caso.
  //
  // GLP e Pressurização de escada continuam vindo das regras antigas
  // (regra_glp, regra_pressurizacao) porque a matriz normativa nova
  // ainda não modela esses dois sistemas como itens determinísticos
  // próprios.

  const viaMatriz = gerarChecklistViaMatriz({
    area_construida,
    altura,
    grupo,
    divisao,
    floors,
    has_basement,
  });

  const items: ChecklistNormativoItem[] = [...viaMatriz.items];

  // Pressurização de escada (ainda não cobrida pela matriz nova)
  const p = regra_pressurizacao(snap);
  if (p) items.push(p);

  // GLP (ainda não cobrido pela matriz nova)
  const g = regra_glp(snap);
  if (g) items.push(g);

  return items;
}

function toItem(
  partial: Omit<ChecklistNormativoItem, "exigido" | "motivo">,
  exigido: boolean,
  motivo: string
): ChecklistNormativoItem {
  return { ...partial, exigido, motivo };
}

/**
 * Formata o checklist como string para incluir no prompt da IA.
 */
export function formatarChecklistParaPrompt(
  checklist: ChecklistNormativoItem[]
): string {
  const lines = ["=== CHECKLIST NORMATIVO (CBMBA) — VERIFICAR NA PRANCHA ===\n"];
  for (const item of checklist) {
    lines.push(`[${item.id}] ${item.titulo} (${item.norma})`);
    lines.push(`  Severidade: ${item.severidade} | Exigido: ${item.exigido ? "sim" : "condicional"}`);
    lines.push(`  Verificar na planta:`);
    item.verificar_na_planta.forEach((v) => lines.push(`    • ${v}`));
    if (item.verificar_no_memorial.length > 0) {
      lines.push(`  Verificar no memorial:`);
      item.verificar_no_memorial.forEach((v) => lines.push(`    • ${v}`));
    }
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Gera dados técnicos do projeto como string para incluir no prompt da IA.
 */
export function formatarDadosProjeto(project: {
  name?: string;
  client_name?: string;
  city?: string;
  state?: string;
  occupancy_type?: string;
  built_area?: number;
  floors?: number;
}): string {
  return [
    "=== DADOS TÉCNICOS DO PROJETO (informados pelo usuário) ===",
    `Nome: ${project.name ?? "não informado"}`,
    `Cliente: ${project.client_name ?? "não informado"}`,
    `Cidade/UF: ${project.city ?? ""}/${project.state ?? "BA"}`,
    `Ocupação: ${project.occupancy_type ?? "não informada"}`,
    `Área construída: ${project.built_area != null ? project.built_area + " m²" : "não informada"}`,
    `Número de pavimentos: ${project.floors != null ? project.floors : "não informado"}`,
  ].join("\n");
}
