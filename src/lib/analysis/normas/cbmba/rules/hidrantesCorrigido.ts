/**
 * Versão corrigida de regra_hidrantes — substitui src/lib/analysis/normas/
 * cbmba/rules/sistemas.ts::regra_hidrantes como fonte de verdade no checklist.
 *
 * BUG ORIGINAL (corrigido aqui): a função antiga decidia a OBRIGATORIEDADE
 * de hidrante usando a Tabela 3 da IT-22/2016, que na realidade só serve
 * para DIMENSIONAR o sistema (Tipo + RTI) depois que ele já é exigido.
 * Como a Tabela 3 cobre todas as faixas de área (de "até 2.500 m²" até
 * "acima de 50.000 m²"), a função antiga nunca tinha um caminho para dizer
 * "não exigido" — toda edificação caía em alguma faixa e o item virava
 * "exigido: true" incondicionalmente, mesmo edificações pequenas tipo D-1
 * de 318,75 m² que a Tabela 5 do Decreto 16.302/2015 não exige hidrante.
 *
 * CORREÇÃO: esta função primeiro consulta getHydrantsRequirement(), que usa
 * EXCLUSIVAMENTE a matriz normativa do Decreto (Tabela 5 / Tabelas 6A-6M).
 * Só quando required === true, delega para a lógica de Tipo/RTI da Tabela 3
 * da IT-22 (reaproveitada de sistemas.ts, sem duplicar a tabela de valores).
 */

import type { ChecklistNormativoItem } from "../../../checklist";
import { getHydrantsRequirement } from "@/lib/rules/ba/hydrantsRequirement";
import type { ProcessType } from "@/lib/rules/ba/validateProcessType";
import { regra_hidrantes as regraHidrantesAntigaSoParaDimensionamento, type ProjectSnapshot } from "./sistemas";

function mapAnalysisModeToProcessType(analysisMode: string | undefined, areaM2: number, floors: number): ProcessType {
  // Critério aproximado quando o processo não foi determinado explicitamente
  // por validateProcessType — nunca usado para decidir hidrante por si só,
  // apenas como contexto informativo passado ao motor da matriz.
  if (analysisMode === "pts_bahia") return "PTS_AVCB";
  if (areaM2 <= 750 && floors <= 3) return "PTS_AVCB";
  return "PT";
}

function riscoToFireRisk(risco: ProjectSnapshot["risco"]): "Baixo" | "Médio" | "Alto" {
  if (risco === "LEVE") return "Baixo";
  if (risco === "ELEVADO") return "Alto";
  return "Médio";
}

/**
 * Substitui regra_hidrantes do módulo legado. Mesma assinatura de entrada
 * (ProjectSnapshot) e mesmo formato de saída (ChecklistNormativoItem | null),
 * para encaixar como drop-in replacement em checklist.ts e route.ts.
 */
export function regra_hidrantes_corrigida(p: ProjectSnapshot): ChecklistNormativoItem | null {
  const processType = mapAnalysisModeToProcessType(p.analysis_mode, p.area_construida, p.floors);
  const fireRisk = riscoToFireRisk(p.risco);

  const hidranteReq = getHydrantsRequirement({
    group: p.grupo,
    division: p.divisao,
    areaM2: p.area_construida,
    heightM: p.altura,
    floors: p.floors,
    processType,
    fireRisk,
    fireLoadMJm2: p.carga_incendio,
    hasSubsoil: p.has_basement,
  });

  // ── Não exigido pela matriz: retorna item informativo, NUNCA crítico ──────
  if (hidranteReq.status === "NOT_REQUIRED") {
    return {
      id: "IT22-hidrantes",
      sistema: "Hidrantes e mangotinhos",
      norma: "Decreto 16.302/2015",
      item_normativo: hidranteReq.normativeBasis.join("; ") || "Tabela 5/6 do Decreto 16.302/2015",
      titulo: "Sistema de hidrantes e mangotinhos — não exigido",
      descricao:
        `Para a edificação enquadrada como "${p.divisao}", com ${p.area_construida} m² e altura de ${p.altura} m, ` +
        `o sistema de hidrantes e/ou mangotinhos não é obrigatório pela matriz normativa do Decreto 16.302/2015, ` +
        `desde que não existam riscos especiais ou condição da edificação principal que altere o enquadramento. ` +
        `A IT-22/2016 não cria a obrigatoriedade; ela só seria aplicada para dimensionamento caso o sistema fosse exigido.`,
      exigido: false,
      motivo: hidranteReq.reason,
      severidade: "baixa",
      verificar_na_planta: [],
      verificar_no_memorial: [],
      palavras_chave: ["hidrante", "mangotinho"],
    };
  }

  // ── Pendência de dados ou revisão técnica: nunca crítico, nunca inventado ──
  if (hidranteReq.status === "PENDING" || hidranteReq.status === "REVIEW_REQUIRED" || hidranteReq.status === "NOT_APPLICABLE") {
    return {
      id: "IT22-hidrantes",
      sistema: "Hidrantes e mangotinhos",
      norma: "Decreto 16.302/2015",
      item_normativo: hidranteReq.normativeBasis.join("; ") || "Matriz normativa não cadastrada para este enquadramento",
      titulo: "Sistema de hidrantes e mangotinhos — revisão técnica necessária",
      descricao:
        `Não foi possível determinar automaticamente a exigência de hidrantes/mangotinhos para "${p.divisao}" ` +
        `com os dados disponíveis. Revisão técnica obrigatória antes de concluir sobre a obrigatoriedade do sistema.`,
      exigido: false,
      motivo: hidranteReq.reason,
      severidade: "media",
      verificar_na_planta: [],
      verificar_no_memorial: hidranteReq.missingData ?? [],
      palavras_chave: ["hidrante", "mangotinho"],
    };
  }

  // ── REQUIRED: agora sim, delega para a lógica de Tipo/RTI da Tabela 3 (IT-22) ──
  const itemDimensionado = regraHidrantesAntigaSoParaDimensionamento(p);

  if (!itemDimensionado) {
    // A matriz do Decreto disse que é exigido, mas a Tabela 3 da IT-22 não
    // tem coluna mapeada para esta divisão/carga — retorna item exigido,
    // pedindo o dado faltante para dimensionar, mas SEM inventar Tipo/RTI.
    return {
      id: "IT22-hidrantes",
      sistema: "Hidrantes e mangotinhos",
      norma: "Decreto 16.302/2015 + IT-22/2016",
      item_normativo: hidranteReq.normativeBasis.join("; "),
      titulo: "Sistema de hidrantes e mangotinhos — exigido (dimensionamento pendente)",
      descricao:
        `O sistema de hidrantes/mangotinhos é exigido pela matriz normativa do Decreto 16.302/2015 para esta ` +
        `edificação. O dimensionamento exato (Tipo de sistema e Reserva Técnica de Incêndio) depende de dados ` +
        `adicionais do memorial (carga de incêndio e/ou classificação completa) para aplicar a Tabela 3 da IT-22/2016.`,
      exigido: true,
      motivo: hidranteReq.reason,
      severidade: "critica",
      verificar_na_planta: [
        "representação da rede de hidrantes / mangotinhos",
        "posicionamento dos abrigos / caixas de incêndio",
        "caminhamento das tubulações",
        "localização da casa de bombas",
        "localização do reservatório RTI",
      ],
      verificar_no_memorial: [
        "cálculo da carga de incêndio (MJ/m²) — necessário para aplicar a Tabela 3 da IT-22/2016",
        "cálculo da Reserva Técnica de Incêndio (RTI)",
        "tipo de sistema conforme Tabela 3",
      ],
      palavras_chave: ["hidrante", "mangotinho", "rti", "reserva técnica"],
    };
  }

  // Item dimensionado normalmente pela Tabela 3 — apenas reforça na descrição
  // que a obrigatoriedade vem do Decreto, não da IT-22.
  return {
    ...itemDimensionado,
    item_normativo: `${hidranteReq.normativeBasis.join("; ")} (obrigatoriedade) + ${itemDimensionado.item_normativo ?? "IT-22/2016 · Tabela 3"} (dimensionamento)`,
    motivo: `${hidranteReq.reason} ${itemDimensionado.motivo}`,
  };
}
