/**
 * Ponte entre o motor universal de exigências (src/lib/rules/ba) e o
 * formato de checklist consumido pelo restante do pipeline de análise
 * (prompt da IA, relatório, etc — ver src/lib/analysis/checklist.ts).
 *
 * POR QUE ESTA PONTE EXISTE:
 * O motor em src/lib/rules/ba/determineRequiredSystems.ts é a fonte de
 * verdade correta e testada para "este sistema é exigido?" (consulta a
 * matriz normativa completa: Tabela 5, Tabelas 6A-6M, Tabela 7). Mas
 * ele não foi desenhado pensando em "como verificar isso na planta /
 * no memorial" — esse detalhe de verificação (palavras-chave, itens a
 * procurar) já existia, bem construído, no motor antigo
 * (core.ts / sistemas.ts). Em vez de descartar esse trabalho, este
 * módulo REAPROVEITA os templates de verificação existentes sempre que
 * disponíveis, e só cria um template genérico para os sistemas que o
 * motor antigo nunca cobriu (ex: Controle de Materiais de Acabamento).
 */

import {
  determineRequiredSystems,
  type DetermineRequiredSystemsInput,
  type SystemRequirement,
} from "@/lib/rules/ba/determineRequiredSystems";
import type { SystemName } from "@/data/ba/requiredSystemsMatrix";
import type { ChecklistNormativoItem, Severidade } from "../../../checklist";

/**
 * Templates de verificação reaproveitados do motor antigo (core.ts +
 * sistemas.ts), mais os sistemas que faltavam ali (Controle de
 * Materiais de Acabamento, Compartimentação separada em H/V, Acesso de
 * Viatura, Plano de Emergência, etc). Indexados por SystemName (o nome
 * usado na matriz normativa nova), não pelo "id" antigo.
 */
const VERIFICATION_TEMPLATES: Partial<
  Record<
    SystemName,
    Pick<ChecklistNormativoItem, "id" | "norma" | "item_normativo" | "titulo" | "descricao" | "verificar_na_planta" | "verificar_no_memorial" | "palavras_chave">
  >
> = {
  "Extintores": {
    id: "IT21-extintores",
    norma: "IT-21",
    item_normativo: "IT-21/2017 · Seções 4 e 5",
    titulo: "Extintores portáteis e sobre rodas",
    descricao:
      "Verificar distribuição dos extintores na planta, tipo (pó ABC, CO2, água), capacidade extintora, sinalização e acessibilidade conforme IT-21/2017 CBMBA.",
    verificar_na_planta: [
      "símbolo de extintor conforme IT-04",
      "quantidade por área de cobertura",
      "distância máxima de caminhamento",
      "indicação de tipo e capacidade extintora na legenda",
      "posicionamento em rotas de fuga",
    ],
    verificar_no_memorial: [
      "cálculo de quantidade por área de cobertura e risco",
      "tipo de extintor compatível com classe de incêndio",
      "capacidade extintora mínima",
    ],
    palavras_chave: ["extintor", "portátil", "sobre rodas", "pó abc", "co2", "capacidade extintora", "cobertura", "caminhamento"],
  },
  "Saídas de Emergência": {
    id: "IT11-saidas",
    norma: "IT-11",
    item_normativo: "IT-11/2016 · Seções 5, 6 e 7",
    titulo: "Saídas de emergência",
    descricao:
      "Verificar dimensionamento e disposição das rotas de fuga, portas, escadas e largura das saídas conforme IT-11/2016 CBMBA.",
    verificar_na_planta: [
      "largura das saídas e corredores",
      "número de saídas por pavimento",
      "distância máxima a percorrer até a saída",
      "sentido de abertura das portas",
      "sinalização das rotas de fuga",
    ],
    verificar_no_memorial: [
      "cálculo de lotação e dimensionamento das saídas",
      "memorial de cálculo da população",
      "referência à IT-11/2016",
    ],
    palavras_chave: ["saída", "rota de fuga", "escada", "porta", "lotação", "corredor", "população"],
  },
  "Iluminação de Emergência": {
    id: "IT18-iluminacao",
    norma: "IT-18",
    item_normativo: "IT-18/2017",
    titulo: "Sistema de iluminação de emergência",
    descricao:
      "Verificar previsão de iluminação de emergência nas rotas de fuga e ambientes conforme IT-18/2017 CBMBA.",
    verificar_na_planta: ["blocos autônomos ou sistema central", "posicionamento ao longo das rotas de fuga", "símbolo conforme IT-04"],
    verificar_no_memorial: ["autonomia mínima do sistema", "nível de iluminância previsto", "referência à IT-18/2017"],
    palavras_chave: ["iluminação de emergência", "bloco autônomo", "autonomia", "luminária"],
  },
  "Sinalização de Emergência": {
    id: "IT20-sinalizacao",
    norma: "IT-20",
    item_normativo: "IT-20/2017",
    titulo: "Sinalização de emergência",
    descricao:
      "Verificar sinalização de orientação, alerta e proibição conforme IT-20/2017 e simbologia da IT-04 CBMBA.",
    verificar_na_planta: ["placas de orientação de saída", "sinalização de equipamentos (extintor, hidrante)", "simbologia conforme IT-04"],
    verificar_no_memorial: ["referência à IT-20/2017 e IT-04"],
    palavras_chave: ["sinalização", "placa", "símbolo", "orientação"],
  },
  "Brigada de Incêndio": {
    id: "IT17-brigada",
    norma: "IT-17",
    item_normativo: "IT-17/2016 · Seção 4",
    titulo: "Brigada de incêndio — previsão documental",
    descricao:
      "Verificar se o projeto prevê e documenta a formação de brigada de incêndio conforme IT-17/2016 CBMBA. Não é representado graficamente, mas deve constar no memorial.",
    verificar_na_planta: ["nenhuma representação gráfica exigida"],
    verificar_no_memorial: ["declaração de constituição de brigada", "dimensionamento do número de brigadistas", "referência à IT-17/2016"],
    palavras_chave: ["brigada", "brigadista", "plano de emergência", "treinamento", "emergência"],
  },
  "Hidrantes e Mangotinhos": {
    id: "IT22-hidrantes",
    norma: "IT-22",
    item_normativo: "IT-22/2016",
    titulo: "Sistema de hidrantes e mangotinhos",
    descricao: "Verificar pontos de hidrante/mangotinho, reserva técnica de incêndio e bomba de incêndio conforme IT-22/2016 CBMBA.",
    verificar_na_planta: ["pontos de hidrante/mangotinho", "abrigo, mangueira e esguicho", "casa de bombas e reservatório"],
    verificar_no_memorial: ["cálculo de vazão e pressão (RTI)", "volume da reserva técnica de incêndio", "tipo de sistema (1, 2 ou 3)"],
    palavras_chave: ["hidrante", "mangotinho", "mangueira", "rti", "reserva técnica", "bomba de incêndio"],
  },
  "Detecção de Incêndio": {
    id: "IT19-deteccao",
    norma: "IT-19",
    item_normativo: "IT-19/2017 · Seção 4",
    titulo: "Sistema de detecção de incêndio",
    descricao: "Verificar central, detectores automáticos e acionadores manuais conforme IT-19/2017 CBMBA.",
    verificar_na_planta: ["central de alarme / SDAI", "detectores automáticos (fumaça, temperatura, chama)", "acionadores manuais (botoeiras)", "símbolo conforme IT-04"],
    verificar_no_memorial: ["tipo de sistema (categoria I, II ou III)", "cobertura dos detectores", "referência à IT-19/2017"],
    palavras_chave: ["detecção", "detector", "central", "acionador", "fumaça", "sdai"],
  },
  "Alarme de Incêndio": {
    id: "IT19-alarme",
    norma: "IT-19",
    item_normativo: "IT-19/2017 · Seção 4",
    titulo: "Sistema de alarme de incêndio",
    descricao: "Verificar sirenes, dispositivos de aviso e acionamento conforme IT-19/2017 CBMBA.",
    verificar_na_planta: ["sirenes e dispositivos de aviso", "acionadores manuais (botoeiras)", "símbolo conforme IT-04"],
    verificar_no_memorial: ["autonomia da central", "referência à IT-19/2017"],
    palavras_chave: ["alarme", "sirene", "acionador"],
  },
  "Chuveiros Automáticos": {
    id: "IT23-sprinklers",
    norma: "IT-23",
    item_normativo: "IT-23/2018",
    titulo: "Sistema de chuveiros automáticos (sprinklers)",
    descricao: "Verificar disposição dos bicos sprinkler, reserva técnica de incêndio e bomba conforme IT-23/2018 CBMBA.",
    verificar_na_planta: ["bicos sprinkler e cobertura de área", "casa de bombas e reservatório"],
    verificar_no_memorial: ["cálculo hidráulico", "classificação de risco para sprinklers", "volume da reserva técnica"],
    palavras_chave: ["sprinkler", "chuveiro automático", "bico"],
  },
  "Compartimentação Horizontal": {
    id: "IT09-compartimentacao-h",
    norma: "IT-09",
    item_normativo: "IT-09/2022",
    titulo: "Compartimentação horizontal",
    descricao: "Verificar divisão em compartimentos horizontais (corta-fogo) conforme IT-09/2022 CBMBA.",
    verificar_na_planta: ["paredes corta-fogo (PCF)", "selagem de vãos e dutos entre compartimentos"],
    verificar_no_memorial: ["resistência ao fogo das paredes corta-fogo (PCF P-XX)", "referência à IT-09/2022"],
    palavras_chave: ["compartimentação", "corta-fogo", "pcf", "selagem"],
  },
  "Compartimentação Vertical": {
    id: "IT09-compartimentacao-v",
    norma: "IT-09",
    item_normativo: "IT-09/2022",
    titulo: "Compartimentação vertical",
    descricao: "Verificar isolamento entre pavimentos (lajes, shafts, dutos verticais) conforme IT-09/2022 CBMBA.",
    verificar_na_planta: ["selagem de shafts e dutos verticais", "isolamento de pavimentos"],
    verificar_no_memorial: ["resistência ao fogo de lajes e shafts", "referência à IT-09/2022"],
    palavras_chave: ["compartimentação vertical", "shaft", "duto", "laje"],
  },
  "Segurança Estrutural contra Incêndio": {
    id: "IT08-estrutural",
    norma: "IT-08",
    item_normativo: "IT-08/2016",
    titulo: "Resistência ao fogo dos elementos estruturais",
    descricao: "Verificar tempo requerido de resistência ao fogo (TRRF) dos elementos estruturais conforme IT-08/2016 CBMBA.",
    verificar_na_planta: ["indicação de revestimento contra fogo em pilares/vigas, se aplicável"],
    verificar_no_memorial: ["TRRF adotado e justificativa", "material/revestimento estrutural", "referência à IT-08/2016"],
    palavras_chave: ["trrf", "resistência ao fogo", "estrutural", "revestimento contra fogo"],
  },
  "Controle de Materiais de Acabamento": {
    id: "IT10-acabamento",
    norma: "IT-10",
    item_normativo: "IT-10/2016",
    titulo: "Controle de materiais de acabamento e revestimento",
    descricao:
      "Verificar se os materiais de acabamento e revestimento (piso, parede, teto) atendem às classes de reação ao fogo exigidas pela IT-10/2016 CBMBA.",
    verificar_na_planta: ["especificação de materiais de revestimento na planta/legenda"],
    verificar_no_memorial: [
      "classe de reação ao fogo dos materiais de piso, parede e teto",
      "ensaios ou certificação dos materiais especificados",
      "referência à IT-10/2016",
    ],
    palavras_chave: ["acabamento", "revestimento", "reação ao fogo", "classe", "piso", "forro", "teto"],
  },
  "Plano de Emergência": {
    id: "IT17-plano-emergencia",
    norma: "IT-17",
    item_normativo: "IT-17/2016",
    titulo: "Plano de emergência contra incêndio",
    descricao: "Verificar se o memorial prevê plano de emergência e procedimentos de abandono conforme IT-17/2016 CBMBA.",
    verificar_na_planta: ["nenhuma representação gráfica exigida"],
    verificar_no_memorial: ["procedimentos de evacuação", "responsáveis pelo plano", "referência à IT-17/2016"],
    palavras_chave: ["plano de emergência", "evacuação", "abandono"],
  },
  "Acesso de Viatura": {
    id: "IT06-acesso-viaturas",
    norma: "IT-06",
    item_normativo: "IT-06/2016",
    titulo: "Acesso de viaturas na edificação",
    descricao: "Verificar condições de acesso, raio de giro e capacidade de piso para viaturas do Corpo de Bombeiros conforme IT-06/2016 CBMBA.",
    verificar_na_planta: ["via de acesso e raio de giro", "distância da via pública até a edificação", "capacidade de suporte do piso de acesso"],
    verificar_no_memorial: ["referência à IT-06/2016"],
    palavras_chave: ["acesso de viatura", "raio de giro", "via de acesso"],
  },
};

/** Templates genéricos para os sistemas que ainda não têm um modelo de
 *  verificação dedicado acima — cobertura mínima, sinalizando a lacuna
 *  ao invés de omitir o sistema do checklist. */
function buildFallbackTemplate(
  systemName: string
): Pick<ChecklistNormativoItem, "id" | "norma" | "item_normativo" | "titulo" | "descricao" | "verificar_na_planta" | "verificar_no_memorial" | "palavras_chave"> {
  return {
    id: `SISTEMA-${systemName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toUpperCase()}`,
    norma: "Decreto 16.302/2015",
    item_normativo: undefined,
    titulo: systemName,
    descricao: `Sistema "${systemName}" exigido conforme a matriz normativa do Decreto 16.302/2015. Este sistema ainda não possui um roteiro de verificação detalhado neste módulo — avaliar manualmente sua presença e conformidade no projeto.`,
    verificar_na_planta: [`presença de "${systemName}" indicada na planta ou legenda`],
    verificar_no_memorial: [`menção a "${systemName}" e seu dimensionamento no memorial descritivo`],
    palavras_chave: [systemName.toLowerCase()],
  };
}

function severidadeFromRequirement(req: SystemRequirement): Severidade {
  if (req.severity === "critical") return "critica";
  if (req.severity === "warning") return "alta";
  if (req.severity === "info") return "media";
  return "baixa";
}

export interface GerarChecklistViaMatrizInput {
  area_construida: number;
  altura: number;
  grupo: string;
  divisao: string;
  floors: number;
  has_glp?: boolean;
  has_basement?: boolean;
  subsoil_use?: string;
  has_special_risks?: boolean;
  special_risks?: string[];
  tunnel_extension_m?: number;
}

export interface ChecklistViaMatrizResult {
  items: ChecklistNormativoItem[];
  /** Avisos normativos gerais (ex: tabelas usadas, alertas de subsolo/riscos especiais) */
  avisos: string[];
  /** Tabelas normativas efetivamente aplicadas (ex: ["Tabela 5"]) */
  tabelasUsadas: string[];
  /** Se a IA/usuário precisa de revisão humana adicional além do automático */
  requerRevisaoHumana: boolean;
}

/**
 * Gera o checklist normativo usando o motor universal de exigências
 * (determineRequiredSystems), convertendo o resultado para o formato
 * ChecklistNormativoItem já consumido pelo prompt da IA e pelo resto
 * do pipeline de análise.
 */
export function gerarChecklistViaMatriz(input: GerarChecklistViaMatrizInput): ChecklistViaMatrizResult {
  const matrixInput: DetermineRequiredSystemsInput = {
    group: input.grupo,
    division: input.divisao,
    areaM2: input.area_construida,
    heightM: input.altura,
    floors: input.floors,
    // processType é exigido pela interface, mas determineRequiredSystems
    // não usa este campo para decidir Tabela 5 vs 6 (isso é feito só por
    // área/altura) — mantemos um valor neutro aqui.
    processType: "INDETERMINADO",
    fireRisk: "Médio",
    hasSubsoil: input.has_basement,
    subsoilUse: input.subsoil_use,
    hasSpecialRisks: input.has_special_risks,
    specialRisks: input.special_risks,
    tunnelExtensionM: input.tunnel_extension_m,
  };

  const resultado = determineRequiredSystems(matrixInput);

  const items: ChecklistNormativoItem[] = [];

  for (const req of resultado.requiredSystems) {
    const template = VERIFICATION_TEMPLATES[req.system as SystemName] ?? buildFallbackTemplate(req.system);
    items.push({
      ...template,
      sistema: req.system,
      exigido: true,
      motivo: req.reason,
      severidade: severidadeFromRequirement(req),
    });
  }

  // Sistemas pendentes/que exigem revisão humana também entram no
  // checklist (marcados como não-exigidos por padrão, com o motivo
  // explicando a pendência) — a IA não deve inventar obrigatoriedade
  // para eles, mas o profissional que revisa o relatório precisa saber
  // que existe uma lacuna a resolver manualmente.
  for (const req of [...resultado.pendingSystems]) {
    const template = VERIFICATION_TEMPLATES[req.system as SystemName] ?? buildFallbackTemplate(req.system);
    items.push({
      ...template,
      sistema: req.system,
      exigido: false,
      motivo: `PENDENTE DE REVISÃO MANUAL: ${req.reason}`,
      severidade: "alta",
    });
  }

  return {
    items,
    avisos: resultado.globalWarnings,
    tabelasUsadas: resultado.normativeTablesUsed,
    requerRevisaoHumana: resultado.requiredHumanReview,
  };
}
