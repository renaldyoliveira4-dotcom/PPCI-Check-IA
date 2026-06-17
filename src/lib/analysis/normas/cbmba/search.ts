/**
 * Motor de busca normativa local (CBMBA)
 * TAREFA 5 — src/lib/analysis/normas/cbmba/search.ts
 *
 * Busca por palavras-chave nos chunks extraídos dos PDFs.
 * MVP: busca simples com score por frequência de termos.
 * Futuro: pode evoluir para embeddings/vector search.
 */

import type { ChecklistNormativoItem } from "../../checklist";

// Importa os chunks gerados pela ingestão (runtime)
// Esses arquivos só existem após rodar scripts/ingest-normas-cbmba.ts
let _chunks: NormChunk[] | null = null;

interface NormChunk {
  document_code: string;
  section_ref: string;
  title: string;
  content: string;
  keywords: string[];
  filename: string;
}

function getChunks(): NormChunk[] {
  if (_chunks) return _chunks;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _chunks = require("./generated/chunks.json") as NormChunk[];
  } catch {
    _chunks = [];
  }
  return _chunks;
}

/** Tokeniza e normaliza string para busca */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

/** Score de relevância: soma quantas query-words aparecem no chunk */
function scoreChunk(chunk: NormChunk, queryTokens: string[]): number {
  const contentTokens = new Set(tokenize(chunk.content));
  const keywordTokens = new Set(chunk.keywords.map((k) => tokenize(k)[0] ?? k));
  let score = 0;
  for (const qt of queryTokens) {
    if (contentTokens.has(qt)) score += 1;
    if (keywordTokens.has(qt)) score += 2; // keywords têm peso 2x
  }
  return score;
}

export interface NormSearchResult {
  document_code: string;
  section_ref: string;
  title: string;
  content: string;
  keywords: string[];
  score: number;
}

export interface SearchOptions {
  /** Filtrar por codes de ITs específicas. Ex: ["IT-21", "IT-11"] */
  codes?: string[];
  /** Número máximo de resultados */
  limit?: number;
  /** Score mínimo para incluir */
  minScore?: number;
}

/**
 * Busca trechos normativos por query textual.
 * Ex: buscarTrechosNormativos("extintores portáteis distribuição")
 */
export function buscarTrechosNormativos(
  query: string,
  options: SearchOptions = {}
): NormSearchResult[] {
  const { codes, limit = 8, minScore = 1 } = options;
  const chunks = getChunks();
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) return [];

  let pool = chunks;
  if (codes && codes.length > 0) {
    pool = chunks.filter((c) => codes.includes(c.document_code));
  }

  const scored = pool
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk, queryTokens),
    }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

/**
 * Para cada item do checklist normativo, busca trechos relevantes.
 * Retorna um mapa { item_id → trechos[] }
 */
export function buscarTrechosPorChecklist(
  checklist: ChecklistNormativoItem[],
  limitPerItem = 2
): Record<string, NormSearchResult[]> {
  const result: Record<string, NormSearchResult[]> = {};

  for (const item of checklist) {
    const query = [
      item.sistema,
      item.titulo,
      ...item.palavras_chave,
      ...item.verificar_na_planta,
    ].join(" ");

    result[item.id] = buscarTrechosNormativos(query, {
      codes: [item.norma],
      limit: limitPerItem,
      minScore: 1,
    });
  }

  return result;
}

/**
 * Busca todos os chunks de uma norma específica.
 * Ex: buscarNormaPorCodigo("IT-22")
 */
export function buscarNormaPorCodigo(code: string): NormChunk[] {
  return getChunks().filter((c) => c.document_code === code);
}

/**
 * Monta um resumo textual dos trechos normativos para incluir no prompt da IA.
 * Limita o tamanho total para não estourar o contexto.
 */
export function montarContextoNormativo(
  trechosPorItem: Record<string, NormSearchResult[]>,
  maxTotalChars = 8000
): string {
  const lines: string[] = ["=== TRECHOS NORMATIVOS RELEVANTES (CBMBA) ===\n"];
  let totalChars = 0;

  for (const [itemId, trechos] of Object.entries(trechosPorItem)) {
    if (trechos.length === 0) continue;
    for (const t of trechos) {
      const snippet = t.content.slice(0, 500);
      const line = `[${t.document_code} · ${t.section_ref}]\n${snippet}\n`;
      if (totalChars + line.length > maxTotalChars) break;
      lines.push(line);
      totalChars += line.length;
    }
  }

  if (lines.length === 1) {
    lines.push("(nenhum trecho encontrado para os itens do checklist)");
  }

  return lines.join("\n");
}
