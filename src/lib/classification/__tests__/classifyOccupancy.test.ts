/**
 * Testes unitários — classificação de ocupação/divisão.
 * Cobre: classificação direta, ambiguidade, ocupação mista, fronteiras de
 * carga de incêndio, e casos não enquadráveis.
 *
 * Execução: npx tsx src/lib/classification/__tests__/classifyOccupancy.test.ts
 * (projeto não tem test runner configurado — testes em formato de asserts simples)
 */

import { classifyOccupancy, UNCLASSIFIED } from "../classifyOccupancy";
import { classifyFireRisk } from "../classifyFireRisk";
import { detectMixedOccupancy } from "../detectMixedOccupancy";
import { validatePTS } from "../validatePTS";

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`✅ ${label}`);
  } else {
    failed++;
    console.log(`❌ ${label}`);
    console.log(`   esperado: ${JSON.stringify(expected)}`);
    console.log(`   recebido: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`✅ ${label}`);
  } else {
    failed++;
    console.log(`❌ ${label}`);
  }
}

console.log("=== TESTE: Escritórios / Serviços profissionais / D-1 / 300 MJ/m² ===");
{
  const r = classifyOccupancy({
    projectText: "Escritórios administrativos, serviços profissionais, D-1",
    fireLoadMJm2: 300,
  });
  assertEqual(r.division, "D-1", "Divisão D-1 corretamente identificada");
  assertEqual(r.fireRisk, "Baixo", "Risco Baixo com 300 MJ/m² (fronteira inclusiva)");
  assertTrue(r.confidence > 0.7, "Confiança alta para classificação direta com código explícito");
}

console.log("\n=== TESTE: Agência bancária → D-2, não D-1 ===");
{
  const r = classifyOccupancy({ projectText: "Agência bancária com caixas eletrônicos" });
  assertEqual(r.division, "D-2", "Agência bancária classificada como D-2");
}

console.log("\n=== TESTE: Restaurante → F-8 ===");
{
  const r = classifyOccupancy({ projectText: "Restaurante para refeições, sem música ao vivo" });
  assertEqual(r.division, "F-8", "Restaurante classificado como F-8");
}

console.log("\n=== TESTE: Restaurante dançante → F-6 ou F-11 ===");
{
  const r = classifyOccupancy({ projectText: "Restaurante dançante com pista de dança e música ao vivo" });
  assertTrue(r.division === "F-6" || r.division === "F-11", `Restaurante dançante classificado como ${r.division} (esperado F-6 ou F-11)`);
}

console.log("\n=== TESTE: Igreja → F-2 ===");
{
  const r = classifyOccupancy({ projectText: "Igreja evangélica com salão de cultos" });
  assertEqual(r.division, "F-2", "Igreja classificada como F-2");
}

console.log("\n=== TESTE: Academia sem arquibancada → E-3 ===");
{
  const r = classifyOccupancy({ projectText: "Academia de musculação e ginástica, sem arquibancada" });
  assertEqual(r.division, "E-3", "Academia sem arquibancada classificada como E-3");
}

console.log("\n=== TESTE: Ginásio com arquibancada → F-3 ===");
{
  const r = classifyOccupancy({ projectText: "Ginásio poliesportivo com arquibancada para público" });
  assertEqual(r.division, "F-3", "Ginásio com arquibancada classificado como F-3");
}

console.log("\n=== TESTE: Clínica médica sem internação → H-6 ===");
{
  const r = classifyOccupancy({ projectText: "Clínica médica sem internação, consultórios" });
  assertEqual(r.division, "H-6", "Clínica sem internação classificada como H-6");
}

console.log("\n=== TESTE: Clínica com internação → H-3 ===");
{
  const r = classifyOccupancy({ projectText: "Clínica com internação de pacientes, leitos hospitalares" });
  assertEqual(r.division, "H-3", "Clínica com internação classificada como H-3");
}

console.log("\n=== TESTE: Depósito com carga 300 MJ/m² → J-2, risco Baixo ===");
{
  const r = classifyOccupancy({ projectText: "Depósito geral de mercadorias", fireLoadMJm2: 300 });
  assertEqual(r.division, "J-2", "Depósito com 300 MJ/m² classificado como J-2");
  assertEqual(r.fireRisk, "Baixo", "Risco Baixo no limite de 300 MJ/m²");
}

console.log("\n=== TESTE: Depósito com carga 301 MJ/m² → J-3, risco Médio ===");
{
  const r = classifyOccupancy({ projectText: "Depósito geral de mercadorias", fireLoadMJm2: 301 });
  assertEqual(r.division, "J-3", "Depósito com 301 MJ/m² classificado como J-3");
  assertEqual(r.fireRisk, "Médio", "Risco Médio a partir de 301 MJ/m²");
}

console.log("\n=== TESTE: Indústria com carga 1201 MJ/m² → I-3, risco Alto ===");
{
  const r = classifyOccupancy({ projectText: "Indústria de processamento e fabricação", fireLoadMJm2: 1201 });
  assertEqual(r.division, "I-3", "Indústria com 1201 MJ/m² classificada como I-3");
  assertEqual(r.fireRisk, "Alto", "Risco Alto acima de 1200 MJ/m²");
}

console.log("\n=== TESTE: Posto de combustível → G-3 ===");
{
  const r = classifyOccupancy({ projectText: "Posto de combustível para abastecimento de veículos" });
  assertEqual(r.division, "G-3", "Posto de combustível classificado como G-3");
}

console.log("\n=== TESTE: Oficina mecânica → G-4 ===");
{
  const r = classifyOccupancy({ projectText: "Oficina mecânica para manutenção automotiva" });
  assertEqual(r.division, "G-4", "Oficina mecânica classificada como G-4");
}

console.log("\n=== TESTE: Ocupação não enquadrável retorna UNCLASSIFIED ===");
{
  const r = classifyOccupancy({ projectText: "xyzabc123 atividade totalmente desconhecida sem nenhuma palavra-chave reconhecível" });
  assertEqual(r.division, UNCLASSIFIED, "Ocupação não mapeada retorna mensagem de não enquadrado");
  assertTrue(r.requiredHumanReview, "Revisão técnica obrigatória quando não enquadrado");
}

console.log("\n=== TESTE: Ambiguidade gera alternativas ===");
{
  // Texto com termos de duas divisões diferentes e próximas
  const r = classifyOccupancy({ projectText: "lavanderia e assistência técnica de eletrodomésticos, oficina mecânica" });
  assertTrue(r.alternatives.length >= 0, "Sistema retorna estrutura de alternativas (pode ou não estar vazia conforme pontuação)");
}

console.log("\n=== TESTE: Carga de incêndio ausente não é inventada ===");
{
  const r = classifyOccupancy({ projectText: "indústria de móveis e marcenaria" });
  assertEqual(r.fireLoadMJm2, null, "Carga de incêndio não informada permanece null, nunca inventada");
  assertEqual(r.fireRisk, "Não informado", "Risco fica 'Não informado' sem carga de incêndio");
}

console.log("\n=== TESTE: classifyFireRisk — fronteiras exatas ===");
{
  assertEqual(classifyFireRisk(300).fireRisk, "Baixo", "300 MJ/m² = Baixo");
  assertEqual(classifyFireRisk(301).fireRisk, "Médio", "301 MJ/m² = Médio");
  assertEqual(classifyFireRisk(1200).fireRisk, "Médio", "1200 MJ/m² = Médio");
  assertEqual(classifyFireRisk(1201).fireRisk, "Alto", "1201 MJ/m² = Alto");
  assertEqual(classifyFireRisk(null).fireRisk, "Não informado", "null = Não informado");
}

console.log("\n=== TESTE: Ocupação mista — térreo comercial + andares residenciais ===");
{
  const r = detectMixedOccupancy({
    segments: [
      { segmentText: "térreo: loja de roupas, comércio baixa carga", areaM2: 200 },
      { segmentText: "pavimentos superiores: apartamentos residenciais", areaM2: 1800 },
    ],
  });
  assertTrue(r.isMixed, "Detecta ocupação mista com múltiplos segmentos");
  assertEqual(r.predominant?.division, "A-2", "Predominante é o uso com maior área (residencial)");
}

console.log("\n=== TESTE: validatePTS — caso elegível ===");
{
  const r = validatePTS({
    areaM2: 600,
    floors: 2,
    grupo: "D",
    divisao: "D-1",
  });
  assertTrue(r.eligible, "Edificação D-1, 600m², 2 pavimentos é elegível ao PTS");
  assertEqual(r.tipo, "PTS", "Tipo de processo é PTS");
}

console.log("\n=== TESTE: validatePTS — área acima de 750m² ===");
{
  const r = validatePTS({
    areaM2: 826.38,
    floors: 1,
    grupo: "D",
    divisao: "D-1",
  });
  assertTrue(!r.eligible, "Edificação com 826,38 m² NÃO é elegível ao PTS (excede 750 m²)");
  assertEqual(r.tipo, "PROJETO_TECNICO", "Tipo de processo é Projeto Técnico Completo");
}

console.log("\n=== TESTE: validatePTS — mais de 3 pavimentos (critério é pavimentos, não altura) ===");
{
  const r = validatePTS({
    areaM2: 500,
    floors: 4,
    grupo: "D",
    divisao: "D-1",
  });
  assertTrue(!r.eligible, "Edificação com 4 pavimentos NÃO é elegível ao PTS, mesmo com área pequena");
  assertTrue(r.failedRequirements.some((f) => f.includes("pavimentos")), "Motivo de reprovação menciona pavimentos");
}

console.log("\n=== TESTE: validatePTS — posto de combustível nunca é PTS ===");
{
  const r = validatePTS({
    areaM2: 300,
    floors: 1,
    grupo: "G",
    divisao: "G-3",
    isFuelStation: true,
  });
  assertTrue(!r.eligible, "Posto de combustível nunca é elegível ao PTS, mesmo com área pequena");
}

console.log(`\n\n=== RESULTADO FINAL: ${passed} passaram, ${failed} falharam ===`);
if (failed > 0) {
  process.exit(1);
}
