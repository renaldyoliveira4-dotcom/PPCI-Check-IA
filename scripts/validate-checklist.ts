/**
 * TAREFA 12 — Validação do checklist para projeto D-1, 826,38 m², 6 m altura.
 *
 * Executar: npx ts-node --project tsconfig.scripts.json scripts/validate-checklist.ts
 */

import { gerarChecklistNormativo } from "../src/lib/analysis/checklist";

const projetoD1: Parameters<typeof gerarChecklistNormativo>[0] = {
  area_construida: 826.38,
  altura: 6,
  grupo: "D",
  divisao: "D-1",
  floors: 1,
  has_glp: false,
  has_basement: false,
  analysis_mode: "geral",
};

console.log("=== Validação — Projeto D-1, 826,38 m², 6m ===\n");

const checklist = gerarChecklistNormativo(projetoD1);

console.log(`Total de itens gerados: ${checklist.length}\n`);

const esperados = ["IT21-extintores", "IT11-saidas", "IT18-iluminacao", "IT20-sinalizacao", "IT04-simbolos", "IT22-hidrantes", "IT19-alarme"];
let ok = true;

for (const id of esperados) {
  const found = checklist.find((i) => i.id === id);
  if (found) {
    console.log(`✅ ${id} — ${found.norma} — ${found.titulo}`);
  } else {
    console.log(`❌ FALTANDO: ${id}`);
    ok = false;
  }
}

console.log("\n=== Lista completa ===");
checklist.forEach((item) => {
  console.log(`  [${item.id}] ${item.norma} · ${item.titulo} · severidade=${item.severidade} · exigido=${item.exigido}`);
});

if (ok) {
  console.log("\n✅ Todos os itens esperados presentes!");
} else {
  console.log("\n❌ Itens faltando! Revisar regras.");
  process.exit(1);
}
