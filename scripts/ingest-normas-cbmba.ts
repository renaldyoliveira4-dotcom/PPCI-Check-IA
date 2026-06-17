#!/usr/bin/env node
/**
 * scripts/ingest-normas-cbmba.ts
 *
 * Extrai texto dos PDFs das ITs do CBMBA e gera:
 *   src/lib/analysis/normas/cbmba/generated/documents.json
 *   src/lib/analysis/normas/cbmba/generated/chunks.json
 *   src/lib/analysis/normas/cbmba/generated/manifest.json
 *
 * Uso:
 *   npx ts-node --project tsconfig.scripts.json scripts/ingest-normas-cbmba.ts
 * Ou (após npm run build):
 *   node dist/scripts/ingest-normas-cbmba.js
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
// @ts-ignore
import pdfParse from "pdf-parse";

// Importa o catálogo (caminho relativo ao script)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NORMAS_CBMBA } = require("../src/lib/analysis/normas/cbmba/catalog");

const RAW_DIR = path.join(__dirname, "../data/normas/cbmba/raw");
const OUT_DIR = path.join(
  __dirname,
  "../src/lib/analysis/normas/cbmba/generated"
);

const CHUNK_MIN = 1200;
const CHUNK_MAX = 1800;

// ── Seções típicas nas ITs ─────────────────────────────────────────────────
const SECTION_PATTERNS = [
  /^\s*(\d+(?:\.\d+)*)\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][^\n]{3,80})\s*$/gm,
  /^\s*(CAPÍTULO|SEÇÃO|ANEXO|APÊNDICE)\s+[IVXLCDM\d]+[^\n]{0,60}\s*$/gim,
];

interface RawChunk {
  document_code: string;
  document_title: string;
  section_ref: string;
  title: string;
  content: string;
  keywords: string[];
  filename: string;
  page_start?: number;
  page_end?: number;
}

interface DocumentResult {
  code: string;
  title: string;
  year: number | null;
  filename: string;
  category: string;
  active: boolean;
  deprecated: boolean;
  file_hash: string;
  pages: number;
  char_count: number;
  chunk_count: number;
  extracted_ok: boolean;
  error?: string;
}

/** Extrai palavras-chave do texto */
function extractKeywords(text: string): string[] {
  const STOP = new Set([
    "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
    "e", "ou", "com", "para", "por", "que", "se", "um", "uma", "os",
    "as", "ao", "aos", "às", "é", "ser", "ter", "seu", "sua", "seus",
    "suas", "que", "mais", "não", "este", "esta", "estes", "estas",
    "pelo", "pela", "pelos", "pelas", "como", "quando", "onde",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-záàâãéêíóôõúüç\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([w]) => w);
}

/** Divide texto em chunks respeitando limites de tamanho */
function chunkText(
  text: string,
  docCode: string,
  docTitle: string,
  filename: string
): RawChunk[] {
  const chunks: RawChunk[] = [];

  // Tenta detectar seções
  const sectionMatches: { index: number; ref: string; title: string }[] = [];
  for (const pattern of SECTION_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
      const full = m[0].trim();
      const ref = m[1] || full.slice(0, 20);
      const title = m[2] || full;
      sectionMatches.push({ index: m.index, ref: ref.trim(), title: title.trim() });
    }
  }

  // Ordena e remove duplicatas próximas
  sectionMatches.sort((a, b) => a.index - b.index);
  const deduped = sectionMatches.filter(
    (s, i) => i === 0 || s.index - sectionMatches[i - 1].index > 50
  );

  if (deduped.length > 2) {
    // Fatia por seção
    for (let i = 0; i < deduped.length; i++) {
      const start = deduped[i].index;
      const end = i + 1 < deduped.length ? deduped[i + 1].index : text.length;
      let content = text.slice(start, end).trim();

      if (content.length < 100) continue;

      // Sub-divide se muito grande
      while (content.length > CHUNK_MAX) {
        const sub = content.slice(0, CHUNK_MAX);
        const lastPeriod = sub.lastIndexOf(". ");
        const cut = lastPeriod > CHUNK_MIN ? lastPeriod + 1 : CHUNK_MAX;
        const piece = content.slice(0, cut).trim();
        if (piece.length > 100) {
          chunks.push({
            document_code: docCode,
            document_title: docTitle,
            section_ref: deduped[i].ref,
            title: deduped[i].title,
            content: piece,
            keywords: extractKeywords(piece),
            filename,
          });
        }
        content = content.slice(cut).trim();
      }

      if (content.length > 100) {
        chunks.push({
          document_code: docCode,
          document_title: docTitle,
          section_ref: deduped[i].ref,
          title: deduped[i].title,
          content,
          keywords: extractKeywords(content),
          filename,
        });
      }
    }
  } else {
    // Sem seções detectadas — chunks por blocos
    let pos = 0;
    let chunkIdx = 0;
    while (pos < text.length) {
      const raw = text.slice(pos, pos + CHUNK_MAX);
      const lastPeriod = raw.lastIndexOf(". ");
      const cut = raw.length < CHUNK_MAX ? raw.length : lastPeriod > CHUNK_MIN ? lastPeriod + 1 : CHUNK_MAX;
      const piece = raw.slice(0, cut).trim();
      if (piece.length > 80) {
        chunkIdx++;
        chunks.push({
          document_code: docCode,
          document_title: docTitle,
          section_ref: `bloco-${chunkIdx}`,
          title: `${docCode} — bloco ${chunkIdx}`,
          content: piece,
          keywords: extractKeywords(piece),
          filename,
        });
      }
      pos += cut;
    }
  }

  return chunks;
}

async function main() {
  console.log("🔥 Ingestão de normas CBMBA iniciada\n");

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const allChunks: RawChunk[] = [];
  const allDocuments: DocumentResult[] = [];
  const skipped: string[] = [];

  for (const norma of NORMAS_CBMBA) {
    const filePath = path.join(RAW_DIR, norma.filename);
    process.stdout.write(`[${norma.code}] `);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${norma.filename}`);
      skipped.push(norma.code);
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      const data = await pdfParse(buffer);
      const text = data.text || "";
      const pages = data.numpages || 0;

      const chunks = chunkText(text, norma.code, norma.title, norma.filename);
      allChunks.push(...chunks);

      allDocuments.push({
        code: norma.code,
        title: norma.title,
        year: norma.year ?? null,
        filename: norma.filename,
        category: norma.category,
        active: norma.active,
        deprecated: norma.deprecated ?? false,
        file_hash: hash,
        pages,
        char_count: text.length,
        chunk_count: chunks.length,
        extracted_ok: true,
      });

      console.log(`✅ ${pages}p · ${chunks.length} chunks · ${(text.length / 1000).toFixed(0)}k chars`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`❌ ERRO: ${msg}`);
      allDocuments.push({
        code: norma.code,
        title: norma.title,
        year: norma.year ?? null,
        filename: norma.filename,
        category: norma.category,
        active: norma.active,
        deprecated: norma.deprecated ?? false,
        file_hash: "",
        pages: 0,
        char_count: 0,
        chunk_count: 0,
        extracted_ok: false,
        error: msg,
      });
    }
  }

  // Salva arquivos gerados
  fs.writeFileSync(
    path.join(OUT_DIR, "documents.json"),
    JSON.stringify(allDocuments, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "chunks.json"),
    JSON.stringify(allChunks, null, 2)
  );

  const manifest = {
    generated_at: new Date().toISOString(),
    total_documents: allDocuments.length,
    total_chunks: allChunks.length,
    skipped,
    documents: allDocuments.map((d) => ({
      code: d.code,
      ok: d.extracted_ok,
      chunks: d.chunk_count,
      pages: d.pages,
    })),
  };
  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n✅ Concluído!`);
  console.log(`   Documentos: ${allDocuments.length}`);
  console.log(`   Chunks: ${allChunks.length}`);
  console.log(`   Ignorados: ${skipped.join(", ") || "nenhum"}`);
  console.log(`   Saída: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
