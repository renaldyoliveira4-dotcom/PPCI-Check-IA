import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analisarPlanta } from "@/lib/analysis/ai-analyzer";
import {
  gerarChecklistNormativo,
  formatarChecklistParaPrompt,
  formatarDadosProjeto,
  type ModoAnalise,
  type ChecklistNormativoItem,
} from "@/lib/analysis/checklist";
import { regra_hidrantes } from "@/lib/analysis/normas/cbmba/rules/sistemas";
import {
  buscarTrechosPorChecklist,
  montarContextoNormativo,
} from "@/lib/analysis/normas/cbmba/search";
import type {
  ArquivoEntrada,
  SistemaAuditado,
  AnalysisResult as AIAnalysisResult,
} from "@/lib/analysis/ai-analyzer";
import type { ItemStatus, RiskLevel } from "@/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface AnalyzeRequest {
  project_id: string;
  memorial_file_id?: string;
  analysis_mode?: ModoAnalise;
}

export async function POST(req: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { project_id, memorial_file_id, analysis_mode = "geral" } = body;
  if (!project_id) return NextResponse.json({ error: "project_id é obrigatório" }, { status: 400 });

  // 1. Buscar projeto
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();
  if (projErr || !project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  // 2. Verificar saldo de tokens (admins não pagam tokens)
  const { data: profile } = await supabase
    .from("users")
    .select("tokens, tokens_used, is_admin")
    .eq("id", user.id)
    .single();
  if (!profile || (!profile.is_admin && profile.tokens < 1)) {
    return NextResponse.json(
      { error: "Você não tem tokens disponíveis. Adquira mais para continuar.", code: "INSUFFICIENT_TOKENS" },
      { status: 402 }
    );
  }

  // 3. Buscar arquivos
  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", project_id)
    .order("uploaded_at", { ascending: true });
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado para este projeto" }, { status: 400 });
  }

  // Marca em análise
  await supabase.from("projects").update({ status: "analyzing" }).eq("id", project_id);

  // 4. Separar plantas e memorial
  const plantas: ArquivoEntrada[] = [];
  let memorial: ArquivoEntrada | undefined;

  for (const file of files) {
    const { data: blob, error: dlErr } = await supabase.storage
      .from("project-files")
      .download(file.storage_path);
    if (dlErr || !blob) continue;

    const arrayBuffer = await blob.arrayBuffer();
    const entrada: ArquivoEntrada = {
      bytes: Buffer.from(arrayBuffer),
      filename: file.file_name,
      contentType: file.file_type,
    };

    if (memorial_file_id && file.id === memorial_file_id) {
      memorial = entrada;
    } else {
      plantas.push(entrada);
    }
  }

  if (plantas.length === 0) {
    await supabase.from("projects").update({ status: "uploaded" }).eq("id", project_id);
    return NextResponse.json({ error: "Não foi possível baixar as plantas do storage" }, { status: 500 });
  }

  // 5. Gerar checklist normativo determinístico
  const grupo = project.occupancy_type?.split("-")[0] ?? "D";
  const divisao = project.occupancy_type ?? "D-1";
  const checklist = gerarChecklistNormativo({
    area_construida: project.built_area ?? 0,
    altura: (project.floors ?? 1) * 3,
    grupo,
    divisao,
    floors: project.floors ?? 1,
    has_glp: false,
    has_basement: false,
    analysis_mode,
  });

  // 6. Buscar trechos normativos relevantes
  const trechosPorItem = buscarTrechosPorChecklist(checklist, 2);
  const contextoNormativo = montarContextoNormativo(trechosPorItem, 6000);

  // 7. Montar instruções extras
  const dadosProjeto = formatarDadosProjeto(project);
  const checklistStr = formatarChecklistParaPrompt(checklist);
  const instrucoesExtras = [dadosProjeto, checklistStr, contextoNormativo].join("\n\n");

  // 8. Chamar IA
  let result: AIAnalysisResult;
  try {
    result = await analisarPlanta({ plantas, memorial, instrucoesExtras });
  } catch (e: unknown) {
    const err = e as Error;
    await supabase.from("projects").update({ status: "uploaded" }).eq("id", project_id);
    return NextResponse.json({ error: `Falha ao chamar a IA: ${err.message}` }, { status: 500 });
  }

  // 9. Mapear resultado
  const sistemas = result.sistemas_auditados ?? [];

  // 9b. Recalcular item de hidrantes (IT-22) com a carga de incêndio real
  // extraída do memorial pela IA, em vez do valor genérico usado na geração
  // inicial do checklist (que ocorreu antes da IA ler o memorial).
  const cargaIncendioExtraida = result.sugestao_enquadramento?.carga_incendio_mjm2;
  let checklistFinal: ChecklistNormativoItem[] = checklist;
  if (cargaIncendioExtraida !== undefined) {
    const itemHidranteAtualizado = regra_hidrantes({
      area_construida: project.built_area ?? 0,
      altura: (project.floors ?? 1) * 3,
      grupo,
      divisao,
      risco: "MODERADO",
      floors: project.floors ?? 1,
      analysis_mode,
      carga_incendio: cargaIncendioExtraida,
    });
    if (itemHidranteAtualizado) {
      checklistFinal = checklist.map((it) =>
        it.id === "IT22-hidrantes" ? itemHidranteAtualizado : it
      );
    }
  }

  const mapStatus = (s: SistemaAuditado["situacao"]): ItemStatus =>
    s === "conforme" ? "conforme" : s === "nao_conforme" ? "nao_conforme" : "atencao";
  const riskFromSituacao = (s: SistemaAuditado): RiskLevel => {
    if (s.situacao === "conforme") return "baixo";
    if (s.situacao === "pendente") return "medio";
    return s.exigido ? "alto" : "medio";
  };

  const conforming = sistemas.filter((s) => s.situacao === "conforme").length;
  const warning = sistemas.filter((s) => s.situacao === "pendente").length;
  const nonConf = sistemas.filter((s) => s.situacao === "nao_conforme").length;
  const total = sistemas.length;
  const notaIA = result.aprovacao?.nota;
  const score = notaIA !== undefined && notaIA !== null
    ? Math.round(notaIA * 10)
    : total > 0 ? Math.round((conforming / total) * 100) : 0;

  // 10. Salvar análise
  const { data: analysisRow, error: aErr } = await supabase
    .from("analyses")
    .insert({
      project_id,
      score,
      summary: result.aprovacao?.resumo ?? null,
      status: "completed",
      total_items: total,
      conforming_items: conforming,
      warning_items: warning,
      non_conforming_items: nonConf,
      completed_at: new Date().toISOString(),
      nota: notaIA ?? null,
      status_aprovacao: result.aprovacao?.status ?? null,
      confianca_geral: result.confianca_geral ?? null,
      grupo_ocupacao: result.sugestao_enquadramento?.grupo ?? null,
      divisao_ocupacao: result.sugestao_enquadramento?.divisao ?? null,
      risco_nivel: result.sugestao_enquadramento?.risco ?? null,
      tipo_processo: result.sugestao_enquadramento?.processo ?? null,
      area_total_detectada: result.sugestao_enquadramento?.area_total_construida ?? null,
      numero_pavimentos_detectado: result.sugestao_enquadramento?.numero_pavimentos ?? null,
      enquadramento_correto: result.sugestao_enquadramento?.enquadramento_correto ?? null,
      divergencias: result.divergencias_planta_memorial ?? [],
      pendencias: result.pendencias ?? [],
      encontrados: result.encontrados ?? [],
      ai_meta: result._meta ?? null,
      checklist_normativo: checklistFinal,
      analysis_mode,
    })
    .select()
    .single();

  if (aErr || !analysisRow) {
    await supabase.from("projects").update({ status: "uploaded" }).eq("id", project_id);
    return NextResponse.json({ error: "Falha ao salvar análise no banco" }, { status: 500 });
  }

  // 11. Salvar analysis_items (sistemas + divergências + pendências)
  const itemsToInsert: Array<Record<string, unknown>> = [];

  sistemas.forEach((s, idx) => {
    // Mapeia severidade da IA para o schema
    const sevMap: Record<string, string> = {
      critica: "alto",
      alta: "alto",
      media: "medio",
      baixa: "baixo",
    };
    itemsToInsert.push({
      analysis_id: analysisRow.id,
      category: s.sistema,
      status: mapStatus(s.situacao),
      description: s.observacao || s.evidencia_prancha || "",
      recommendation: s.recomendacao || null,
      normative_reference: s.norma,
      risk_level: riskFromSituacao(s),
      order_index: idx,
      item_type: "sistema",
      norma_codigo: s.norma,
      item_normativo: s.item_normativo || null,
      evidencia_prancha: s.evidencia_prancha || null,
      evidencia_memorial: s.evidencia_memorial || null,
      trecho_normativo_resumido: s.trecho_normativo_resumido || null,
      severidade: sevMap[s.severidade ?? ""] ?? "medio",
    });
  });

  (result.divergencias_planta_memorial ?? []).forEach((texto, idx) => {
    itemsToInsert.push({
      analysis_id: analysisRow.id, category: "Divergência planta × memorial",
      status: "atencao", description: texto,
      recommendation: "Revisar inconsistência entre planta e memorial.",
      normative_reference: null, risk_level: "medio",
      order_index: sistemas.length + idx, item_type: "divergencia", severidade: "medio",
    });
  });

  (result.pendencias ?? []).forEach((texto, idx) => {
    itemsToInsert.push({
      analysis_id: analysisRow.id, category: "Pendência geral",
      status: "atencao", description: texto, recommendation: null,
      normative_reference: null, risk_level: "medio",
      order_index: sistemas.length + (result.divergencias_planta_memorial?.length ?? 0) + idx,
      item_type: "pendencia", severidade: "medio",
    });
  });

  if (itemsToInsert.length > 0) {
    await supabase.from("analysis_items").insert(itemsToInsert);
  }

  // 12. Atualizar projeto e debitar token (pula débito para admins)
  await supabase.from("projects").update({ status: "completed" }).eq("id", project_id);

  if (!profile.is_admin) {
    await supabase.from("users").update({
      tokens: profile.tokens - 1,
      tokens_used: profile.tokens_used + 1,
    }).eq("id", user.id);
    await supabase.from("token_transactions").insert({
      user_id: user.id, amount: -1, reason: "analysis_consumption",
      reference_id: analysisRow.id,
      description: `Análise do projeto: ${project.name}`,
    });
  }

  return NextResponse.json({
    success: true,
    analysis_id: analysisRow.id,
    tokens_remaining: profile.is_admin ? profile.tokens : profile.tokens - 1,
  });
}
