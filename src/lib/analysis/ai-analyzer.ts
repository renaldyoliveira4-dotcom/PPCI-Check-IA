/**
 * Serviço de análise de plantas PPCI com IA real (Anthropic Claude API).
 *
 * Suporta:
 * - PDF nativo (até 32MB, 100 páginas) → Claude lê diretamente
 * - Imagens PNG/JPG/JPEG/WEBP → Claude vision
 * - CAD (DWG/DXF/RVT/IFC) → não suportado nativamente; retorna mensagem clara
 *
 * Requer variável de ambiente: ANTHROPIC_API_KEY
 *
 * Portado de plant_analysis.py do projeto original.
 */

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT_PPCI } from "./prompts";

// Modelo recomendado para análise de plantas
export const MODEL_DEFAULT = "claude-sonnet-4-5-20250929";

const MAX_TOKENS = 6000;
const PDF_MAX_BYTES = 32 * 1024 * 1024; // 32 MB
const IMG_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

const UNSUPPORTED_CAD = [".dwg", ".dxf", ".rvt", ".ifc"];

// ============================================================
// Tipos
// ============================================================

export type SituacaoSistema = "conforme" | "nao_conforme" | "pendente";
export type ConfiancaNivel = "alta" | "media" | "baixa" | "pendente";
export type StatusAprovacao =
  | "Apto a protocolar"
  | "Apto com ressalvas"
  | "Requer correções"
  | "Reprovado";

export interface SistemaAuditado {
  sistema: string;
  norma: string;
  it?: string; // campo legado (IA pode retornar "it" em vez de "norma")
  item_normativo?: string;
  exigido: boolean;
  situacao: SituacaoSistema;
  evidencia_prancha?: string;
  evidencia_memorial?: string;
  trecho_normativo_resumido?: string;
  observacao: string;
  recomendacao?: string | null;
  severidade?: string;
}

export interface SugestaoEnquadramento {
  grupo: string;
  divisao: string;
  descricao: string;
  risco: string;
  processo: string;
  enquadramento_correto?: boolean;
  numero_pavimentos?: number;
  area_total_construida?: string;
  justificativa: string;
  its_aplicaveis?: string[];
}

export interface Encontrado {
  campo: string;
  valor: string;
  confianca: ConfiancaNivel;
  origem?: string;
  fonte?: string;
}

export interface Aprovacao {
  nota: number;
  status: StatusAprovacao;
  resumo: string;
}

export interface AnalysisResult {
  confianca_geral: ConfiancaNivel;
  aprovacao?: Aprovacao;
  sugestao_enquadramento?: SugestaoEnquadramento;
  sistemas_auditados?: SistemaAuditado[];
  divergencias_planta_memorial?: string[];
  pendencias?: string[];
  encontrados?: Encontrado[];
  inconsistencias?: { tipo?: string; texto: string }[];
  erro?: string;
  sistemas_identificados?: unknown[];
  _meta?: {
    model: string;
    input_tokens?: number;
    output_tokens?: number;
    arquivos: string[];
    memorial?: string | null;
  };
}

export interface ArquivoEntrada {
  bytes: Buffer | Uint8Array;
  filename: string;
  contentType?: string;
}

// ============================================================
// Helpers
// ============================================================

interface Classificacao {
  tipo: "pdf" | "imagem" | "cad" | "desconhecido";
  media_type:
    | "application/pdf"
    | "image/png"
    | "image/jpeg"
    | "image/webp"
    | "image/gif"
    | null;
}

function classificarArquivo(
  filename: string,
  contentType?: string
): Classificacao {
  const name = filename.toLowerCase();
  const ext = name.includes(".") ? "." + name.split(".").pop() : "";

  if (ext === ".pdf" || contentType === "application/pdf") {
    return { tipo: "pdf", media_type: "application/pdf" };
  }
  if (ext === ".png" || contentType === "image/png") {
    return { tipo: "imagem", media_type: "image/png" };
  }
  if (
    ext === ".jpg" ||
    ext === ".jpeg" ||
    contentType === "image/jpeg" ||
    contentType === "image/jpg"
  ) {
    return { tipo: "imagem", media_type: "image/jpeg" };
  }
  if (ext === ".webp" || contentType === "image/webp") {
    return { tipo: "imagem", media_type: "image/webp" };
  }
  if (UNSUPPORTED_CAD.includes(ext)) {
    return { tipo: "cad", media_type: null };
  }
  return { tipo: "desconhecido", media_type: null };
}

function respostaFallbackCad(filename: string): AnalysisResult {
  const ext = filename.includes(".")
    ? filename.split(".").pop()!.toUpperCase()
    : "?";
  return {
    confianca_geral: "pendente",
    encontrados: [],
    sistemas_identificados: [],
    pendencias: [
      `O arquivo ${filename} (.${ext}) é um formato CAD/BIM que não pode ser lido diretamente pela IA.`,
      "Para análise automática, exporte uma versão em PDF da planta com as pranchas técnicas.",
      "Recomendado: pranchas com quadro de áreas, cortes, plantas baixas dos pavimentos e legenda.",
    ],
    inconsistencias: [
      {
        tipo: "info",
        texto: `Para projetos ${ext}, recomenda-se também fazer upload de PDF gerado a partir do mesmo arquivo, com as pranchas técnicas.`,
      },
    ],
    sugestao_enquadramento: {
      grupo: "",
      divisao: "",
      descricao: "Aguardando análise — envie PDF com pranchas técnicas",
      risco: "PENDENTE",
      processo: "Pendente",
      justificativa: "Não foi possível analisar o arquivo CAD diretamente. Envie um PDF.",
      its_aplicaveis: [],
    },
  };
}

function respostaErro(mensagem: string): AnalysisResult {
  return {
    confianca_geral: "baixa",
    erro: mensagem,
    encontrados: [],
    sistemas_identificados: [],
    pendencias: [mensagem, "Tente novamente ou contate o suporte."],
    inconsistencias: [],
    sugestao_enquadramento: {
      grupo: "",
      divisao: "",
      descricao: "Erro na análise",
      risco: "PENDENTE",
      processo: "Erro",
      justificativa: mensagem,
      its_aplicaveis: [],
    },
  };
}

/**
 * Extrai JSON do texto retornado pelo Claude.
 * Tolerante a: markdown fences, texto antes/depois, JSON truncado, escapes inválidos.
 */
export function extrairJson(texto: string): AnalysisResult | null {
  if (!texto || texto.trim().length === 0) return null;

  // ── Estratégia 1: fence markdown com balanceamento de chaves ──────────
  // Encontra o primeiro { APÓS qualquer fence de abertura
  const fenceOpenIdx = texto.search(/```(?:json)?/i);
  const startSearch = fenceOpenIdx >= 0 ? fenceOpenIdx : 0;

  const firstBrace = texto.indexOf("{", startSearch);
  if (firstBrace !== -1) {
    const extracted = extrairPorBalanceamento(texto, firstBrace);
    if (extracted) {
      const parsed = tentarParsear(extracted);
      if (parsed) return parsed;
    }
  }

  // ── Estratégia 2: limpa fences e tenta parsear o texto inteiro ────────
  let limpo = texto
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed2 = tentarParsear(limpo);
  if (parsed2) return parsed2;

  // ── Estratégia 3: balanceamento no texto limpo ────────────────────────
  const start3 = limpo.indexOf("{");
  if (start3 !== -1) {
    const extracted3 = extrairPorBalanceamento(limpo, start3);
    if (extracted3) {
      const parsed3 = tentarParsear(extracted3);
      if (parsed3) return parsed3;
    }
  }

  // ── Estratégia 4: busca o ÚLTIMO } e tenta o bloco inteiro ───────────
  const lastBrace = limpo.lastIndexOf("}");
  if (lastBrace !== -1 && start3 !== -1 && lastBrace > start3) {
    const candidato = limpo.slice(start3, lastBrace + 1);
    const parsed4 = tentarParsear(candidato);
    if (parsed4) return parsed4;

    // Sub-estratégia: remove trailing commas (erro comum da IA)
    const semVirgula = candidato.replace(/,(\s*[}\]])/g, "$1");
    const parsed5 = tentarParsear(semVirgula);
    if (parsed5) return parsed5;
  }

  return null;
}

/** Extrai substring de texto a partir de `startIdx` usando balanceamento de chaves */
function extrairPorBalanceamento(texto: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < texto.length; i++) {
    const c = texto[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return texto.slice(startIdx, i + 1);
    }
  }
  return null;
}

/** Tenta JSON.parse com fallback de limpeza mínima */
function tentarParsear(texto: string): AnalysisResult | null {
  if (!texto || !texto.trim().startsWith("{")) return null;
  try {
    return JSON.parse(texto) as AnalysisResult;
  } catch {
    // Remove trailing commas e tenta de novo
    try {
      const clean = texto.replace(/,(\s*[}\]])/g, "$1");
      return JSON.parse(clean) as AnalysisResult;
    } catch {
      return null;
    }
  }
}

type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "document";
      source: { type: "base64"; media_type: string; data: string };
    }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

function blocoConteudo(
  arquivo: ArquivoEntrada,
  rotulo: string
): { blocos: ContentBlock[]; erro: null } | { blocos: null; erro: string } {
  const { bytes, filename, contentType } = arquivo;
  const classificacao = classificarArquivo(filename, contentType);
  const tipo = classificacao.tipo;

  if (tipo === "cad") {
    return {
      blocos: null,
      erro: `O ${rotulo} (${filename}) é um arquivo CAD/BIM. Exporte em PDF.`,
    };
  }
  if (tipo === "desconhecido") {
    return {
      blocos: null,
      erro: `Tipo de arquivo não suportado no ${rotulo}: ${filename}. Aceitos: PDF, PNG, JPG, WEBP.`,
    };
  }

  const tamanho = bytes.byteLength;
  if (tipo === "pdf" && tamanho > PDF_MAX_BYTES) {
    return {
      blocos: null,
      erro: `${rotulo} PDF muito grande (${(tamanho / 1024 / 1024).toFixed(1)} MB). Máx: ${PDF_MAX_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (tipo === "imagem" && tamanho > IMG_MAX_BYTES) {
    return {
      blocos: null,
      erro: `${rotulo} (imagem) muito grande (${(tamanho / 1024 / 1024).toFixed(1)} MB). Máx: ${IMG_MAX_BYTES / 1024 / 1024} MB.`,
    };
  }

  const b64 = Buffer.from(bytes).toString("base64");
  const mediaType = classificacao.media_type!;
  const blocos: ContentBlock[] = [
    { type: "text", text: `--- ${rotulo.toUpperCase()}: ${filename} ---` },
  ];
  if (tipo === "pdf") {
    blocos.push({
      type: "document",
      source: { type: "base64", media_type: mediaType, data: b64 },
    });
  } else {
    blocos.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: b64 },
    });
  }

  return { blocos, erro: null };
}

// ============================================================
// Função principal
// ============================================================

export interface AnalisarPlantaOptions {
  plantas: ArquivoEntrada[];
  memorial?: ArquivoEntrada;
  instrucoesExtras?: string;
  apiKey?: string;
  model?: string;
}

/**
 * Audita um CONJUNTO de plantas PPCI usando IA real da Anthropic.
 */
export async function analisarPlanta(
  options: AnalisarPlantaOptions
): Promise<AnalysisResult> {
  const {
    plantas,
    memorial,
    instrucoesExtras,
    apiKey,
    model = MODEL_DEFAULT,
  } = options;

  if (!plantas || plantas.length === 0) {
    return respostaErro("Nenhuma planta enviada.");
  }

  // CAD na primeira planta? Orienta conversão.
  const primeira = plantas[0];
  const classif0 = classificarArquivo(primeira.filename, primeira.contentType);
  if (classif0.tipo === "cad") {
    return respostaFallbackCad(primeira.filename);
  }

  const finalApiKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!finalApiKey) {
    return respostaErro(
      "Chave da API Anthropic não configurada. Defina ANTHROPIC_API_KEY."
    );
  }

  // Monta blocos
  const content: ContentBlock[] = [];
  const nomesPlantas: string[] = [];

  for (let i = 0; i < plantas.length; i++) {
    const pl = plantas[i];
    const rotulo = `planta ${i + 1}/${plantas.length} — ${pl.filename}`;
    const { blocos, erro } = blocoConteudo(pl, rotulo);
    if (erro) {
      content.push({ type: "text", text: `[AVISO] ${erro}` });
      continue;
    }
    content.push(...blocos!);
    nomesPlantas.push(pl.filename);
  }

  if (nomesPlantas.length === 0) {
    return respostaErro(
      "Nenhuma das plantas pôde ser lida (verifique o formato: PDF, PNG, JPG)."
    );
  }

  const temMemorial = !!memorial;
  if (temMemorial) {
    const { blocos, erro } = blocoConteudo(memorial!, "memorial descritivo");
    if (erro) return respostaErro(erro);
    content.push(...blocos!);
  }

  let instrucao = `Foram enviadas ${nomesPlantas.length} prancha(s) do MESMO projeto de combate a incêndio (${nomesPlantas.join(", ")})`;
  instrucao += temMemorial ? " mais o memorial descritivo" : "";
  instrucao +=
    ". Elas se COMPLEMENTAM: a planta baixa mostra a distribuição dos sistemas em planta, os cortes mostram alturas e prumadas, e a cobertura mostra o nível superior. ANALISE TODAS EM CONJUNTO como um único projeto — NÃO trate uma prancha isolada nem afirme que falta a planta baixa se houver uma prancha de planta entre os arquivos enviados. Antes de dizer que um sistema está ausente, verifique em TODAS as pranchas. Faça a auditoria de conformidade conforme as ITs do CBMBA: enquadramento correto?, audite cada sistema exigido (conforme / não conforme / pendente), aponte divergências e atribua a NOTA (0 a 10) e o STATUS. Responda APENAS com o JSON do system prompt.";

  if (instrucoesExtras) {
    instrucao += `\n\nInstruções adicionais do usuário: ${instrucoesExtras}`;
  }
  content.push({ type: "text", text: instrucao });

  // Chamada à API
  let response;
  try {
    const client = new Anthropic({ apiKey: finalApiKey });
    response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT_PPCI,
      // O SDK não tipa explicitamente blocos "document", mas a API suporta PDFs nativos.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: "user", content: content as any }],
    });
  } catch (e: unknown) {
    const err = e as Error;
    return respostaErro(
      `Erro da API Anthropic: ${err.name}: ${err.message}`
    );
  }

  // Extrai texto
  let textoResposta = "";
  for (const block of response.content) {
    if (block.type === "text") {
      textoResposta += block.text;
    }
  }

  const resultado = extrairJson(textoResposta);
  if (!resultado) {
    return respostaErro(
      `IA retornou resposta não-JSON. Trecho: ${textoResposta.slice(0, 200)}...`
    );
  }

  resultado._meta = {
    model,
    input_tokens: response.usage?.input_tokens,
    output_tokens: response.usage?.output_tokens,
    arquivos: nomesPlantas,
    memorial: temMemorial ? memorial!.filename : null,
  };

  return resultado;
}
