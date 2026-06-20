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
import { regra_hidrantes_corrigida } from "@/lib/analysis/normas/cbmba/rules/hidrantesCorrigido";
import { classifyOccupancy } from "@/lib/classification/classifyOccupancy";
import { validatePTS } from "@/lib/classification/validatePTS";
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

  // 1.5. Rate limiting: impede abuso/custo descontrolado de IA limitando
  // quantas análises um mesmo usuário pode iniciar em um curto período.
  // Limite: 5 análises em 10 minutos. Generoso para uso legítimo (ninguém
  // analisa 5 projetos diferentes em 10 minutos no uso normal), mas
  // bloqueia scripts/cliques repetidos.
  const { data: profileForLimit } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profileForLimit?.is_admin) {
    const { data: analisesRecentes, error: rateLimitError } = await supabase.rpc(
      "contar_analises_recentes",
      { p_user_id: user.id, p_minutos: 10 }
    );

    if (!rateLimitError && typeof analisesRecentes === "number" && analisesRecentes >= 5) {
      return NextResponse.json(
        {
          error: "Você atingiu o limite de análises em um curto período. Aguarde alguns minutos e tente novamente.",
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }
  }

  // 1. Buscar projeto
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();
  if (projErr || !project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  // 2. Verificar e RESERVAR o token atomicamente, ANTES de processar a
  // análise (que pode levar minutos). Reservar no início — em vez de só
  // checar saldo aqui e debitar no fim — impede que duas requisições
  // concorrentes do mesmo usuário ambas passem a checagem inicial e
  // processem a análise completa (gastando IA de verdade) antes de uma
  // delas falhar. Se a análise falhar depois, devolvemos o token.
  const { data: profile } = await supabase
    .from("users")
    .select("tokens, tokens_used, is_admin")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Perfil de usuário não encontrado." }, { status: 404 });
  }

  let tokenReservado = false;
  let tokensRestantes = profile.tokens;

  if (!profile.is_admin) {
    const { data: debitoResult, error: debitoError } = await supabase.rpc(
      "debitar_token",
      { p_user_id: user.id }
    );

    if (debitoError) {
      console.error("Erro ao reservar token de forma atômica:", debitoError);
      return NextResponse.json(
        { error: "Não foi possível verificar seu saldo de tokens. Tente novamente." },
        { status: 500 }
      );
    }

    const linha = debitoResult?.[0];
    if (!linha?.sucesso) {
      return NextResponse.json(
        { error: "Você não tem tokens disponíveis. Adquira mais para continuar.", code: "INSUFFICIENT_TOKENS" },
        { status: 402 }
      );
    }

    tokenReservado = true;
    tokensRestantes = linha.novo_saldo;
  }

  // Helper: devolve o token reservado se a análise falhar em qualquer
  // etapa a partir daqui — evita cobrar pelo que não foi entregue.
  const devolverTokenSeReservado = async () => {
    if (tokenReservado) {
      await supabase.rpc("creditar_tokens", { p_user_id: user.id, p_quantidade: 1 });
      await supabase.from("token_transactions").insert({
        user_id: user.id, amount: 1, reason: "refund",
        description: "Estorno automático: análise não pôde ser concluída.",
      });
    }
  };

  // 3. Buscar arquivos
  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", project_id)
    .order("uploaded_at", { ascending: true });
  if (!files || files.length === 0) {
    await devolverTokenSeReservado();
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
    await devolverTokenSeReservado();
    return NextResponse.json({ error: "Não foi possível baixar as plantas do storage" }, { status: 500 });
  }

  // 5. Gerar checklist normativo determinístico
  const grupo = project.occupancy_type?.split("-")[0] ?? "D";
  const divisao = project.occupancy_type ?? "D-1";
  const checklistBase = gerarChecklistNormativo({
    area_construida: project.built_area ?? 0,
    altura: (project.floors ?? 1) * 3,
    grupo,
    divisao,
    floors: project.floors ?? 1,
    has_glp: false,
    has_basement: false,
    analysis_mode,
  });

  // 5b. Corrigir o item de hidrantes ANTES de montar o prompt da IA — sem
  // isso, a IA recebe (e repete na análise textual) o item antigo que usava
  // a Tabela 3 da IT-22 como fonte de obrigatoriedade, mesmo que o item
  // estruturado seja corrigido depois da resposta da IA (passo 9b). É essa
  // correção "tardia demais" que permitia a IA escrever frases do tipo
  // "IT-22/2016 não isenta edificações D-1..." mesmo com o resultado final
  // estruturado já corrigido.
  const itemHidrantePreIA = regra_hidrantes_corrigida({
    area_construida: project.built_area ?? 0,
    altura: (project.floors ?? 1) * 3,
    grupo,
    divisao,
    risco: "MODERADO",
    floors: project.floors ?? 1,
    analysis_mode,
  });
  const checklist = itemHidrantePreIA
    ? (checklistBase.some((it) => it.id === "IT22-hidrantes")
        ? checklistBase.map((it) => (it.id === "IT22-hidrantes" ? itemHidrantePreIA : it))
        : [...checklistBase, itemHidrantePreIA])
    : checklistBase;

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
    await devolverTokenSeReservado();
    return NextResponse.json({ error: `Falha ao chamar a IA: ${err.message}` }, { status: 500 });
  }

  // 9. Mapear resultado
  const sistemas = result.sistemas_auditados ?? [];

  // 9a. Reclassificar ocupação/divisão com base no texto real do projeto
  // (descrição cadastrada + dados extraídos pela IA do memorial/planta),
  // usando a base normativa estruturada — nunca aceitando uma divisão
  // "inventada" fora da Tabela 1 do Decreto 16.302/2015.
  const cargaIncendioExtraida = result.sugestao_enquadramento?.carga_incendio_mjm2;

  const textoParaClassificacao = [
    project.name ?? "",
    project.client_name ?? "",
    project.occupancy_type ?? "",
    result.sugestao_enquadramento?.descricao ?? "",
    result.sugestao_enquadramento?.divisao ?? "",
  ].join(" ");

  const classificacaoOcupacao = classifyOccupancy({
    projectText: textoParaClassificacao,
    declaredUse: project.occupancy_type ?? undefined,
    areaM2: project.built_area ?? undefined,
    floors: project.floors ?? undefined,
    fireLoadMJm2: cargaIncendioExtraida,
  });

  // Usa a divisão reclassificada quando a confiança é razoável; caso
  // contrário, mantém o que o usuário cadastrou e sinaliza para revisão.
  const divisaoFinalClassificacao =
    classificacaoOcupacao.confidence >= 0.5 && classificacaoOcupacao.division !== "NÃO ENQUADRADO AUTOMATICAMENTE – EXIGE ANÁLISE TÉCNICA"
      ? classificacaoOcupacao.division
      : divisao;
  const grupoFinalClassificacao = divisaoFinalClassificacao.split("-")[0] ?? grupo;

  // 9b. Recalcular item de hidrantes usando o motor corrigido baseado na
  // matriz normativa do Decreto 16.302/2015 (Tabela 5 / Tabelas 6A-6M), e
  // NUNCA na Tabela 3 da IT-22 como fonte de obrigatoriedade. Diferente da
  // versão anterior, este recálculo SEMPRE ocorre — mesmo sem carga de
  // incêndio extraída pela IA — porque o item gerado na criação inicial do
  // checklist (gerarChecklistNormativo, antes da IA) podia estar usando a
  // mesma lógica equivocada e nunca era corrigido quando a IA não extraía
  // carga de incêndio do memorial.
  let checklistFinal: ChecklistNormativoItem[] = checklist;
  {
    const itemHidranteAtualizado = regra_hidrantes_corrigida({
      area_construida: project.built_area ?? 0,
      altura: (project.floors ?? 1) * 3,
      grupo: grupoFinalClassificacao,
      divisao: divisaoFinalClassificacao,
      risco: "MODERADO",
      floors: project.floors ?? 1,
      analysis_mode,
      carga_incendio: cargaIncendioExtraida,
    });
    if (itemHidranteAtualizado) {
      const jaTinhaItem = checklist.some((it) => it.id === "IT22-hidrantes");
      checklistFinal = jaTinhaItem
        ? checklist.map((it) => (it.id === "IT22-hidrantes" ? itemHidranteAtualizado : it))
        : [...checklist, itemHidranteAtualizado];
    }
  }

  // 9c. Validar elegibilidade ao PTS com os critérios reais da IT-42/2024
  // (área ≤ 750 m² e NO MÁXIMO 3 PAVIMENTOS — nunca um limite de altura em metros).
  const validacaoPTS = validatePTS({
    areaM2: project.built_area ?? 0,
    floors: project.floors ?? 1,
    grupo: grupoFinalClassificacao,
    divisao: divisaoFinalClassificacao,
  });

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
      grupo_ocupacao: grupoFinalClassificacao,
      divisao_ocupacao: divisaoFinalClassificacao,
      risco_nivel: classificacaoOcupacao.fireRisk !== "Não informado" ? classificacaoOcupacao.fireRisk : (result.sugestao_enquadramento?.risco ?? null),
      tipo_processo: validacaoPTS.tipo,
      area_total_detectada: result.sugestao_enquadramento?.area_total_construida ?? null,
      numero_pavimentos_detectado: result.sugestao_enquadramento?.numero_pavimentos ?? null,
      enquadramento_correto: result.sugestao_enquadramento?.enquadramento_correto ?? null,
      divergencias: result.divergencias_planta_memorial ?? [],
      pendencias: result.pendencias ?? [],
      encontrados: result.encontrados ?? [],
      ai_meta: result._meta ?? null,
      checklist_normativo: checklistFinal,
      analysis_mode,
      classificacao_ocupacao: {
        occupancy_use: classificacaoOcupacao.occupancyUse,
        division: classificacaoOcupacao.division,
        description: classificacaoOcupacao.description,
        fire_load_mjm2: classificacaoOcupacao.fireLoadMJm2,
        fire_risk: classificacaoOcupacao.fireRisk,
        confidence: classificacaoOcupacao.confidence,
        reasoning: classificacaoOcupacao.reasoning,
        warnings: classificacaoOcupacao.warnings,
        alternatives: classificacaoOcupacao.alternatives,
        required_human_review: classificacaoOcupacao.requiredHumanReview,
      },
      validacao_pts: {
        eligible: validacaoPTS.eligible,
        tipo: validacaoPTS.tipo,
        failed_requirements: validacaoPTS.failedRequirements,
        norma_referencia: validacaoPTS.normaReferencia,
      },
    })
    .select()
    .single();

  if (aErr || !analysisRow) {
    await supabase.from("projects").update({ status: "uploaded" }).eq("id", project_id);
    await devolverTokenSeReservado();
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

  // 12. Atualizar projeto (o token já foi debitado atomicamente no início
  // da requisição — ver passo 2 — para impedir que requisições
  // concorrentes processassem a análise completa antes de uma delas
  // falhar no débito).
  await supabase.from("projects").update({ status: "completed" }).eq("id", project_id);

  if (tokenReservado) {
    await supabase.from("token_transactions").insert({
      user_id: user.id, amount: -1, reason: "analysis_consumption",
      reference_id: analysisRow.id,
      description: `Análise do projeto: ${project.name}`,
    });
  }

  return NextResponse.json({
    success: true,
    analysis_id: analysisRow.id,
    tokens_remaining: tokensRestantes,
  });
}
