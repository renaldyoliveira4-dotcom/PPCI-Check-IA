/**
 * Matriz universal de exigências de medidas de segurança contra incêndio.
 * Fonte: Decreto Estadual nº 16.302/2015 (Bahia) — Tabela 5 e Tabelas 6A a 6M.
 *
 * REGRA FUNDAMENTAL: esta matriz é a ÚNICA fonte de obrigatoriedade de
 * sistemas (hidrante, alarme, brigada, CMAR, etc). As Instruções Técnicas
 * específicas (IT-22, IT-21, IT-11, IT-18, IT-20, etc.) NUNCA decidem se um
 * sistema é exigido — elas só dimensionam o sistema DEPOIS que esta matriz
 * já determinou que ele é obrigatório.
 *
 * Camada 1 — Tabela 5: área <= 750 m2 E altura <= 12 m. Lista fixa de 6
 * sistemas; tudo que não aparece nela (hidrante, alarme, detecção,
 * chuveiros, CMAR, etc.) NÃO é exigido nessa faixa.
 *
 * Camada 2 — Tabelas 6A a 6M: área > 750 m2 OU altura > 12 m. Cada tabela
 * detalha por faixa de altura (ou, para M-1, por faixa de extensão em
 * metros). Fonte fiel às imagens das tabelas reais conferidas página a
 * página no PDF do Decreto.
 *
 * Se uma divisão/tabela não estiver cadastrada aqui, o motor que consome
 * esta matriz DEVE retornar "revisão técnica obrigatória" — nunca inventar.
 */

export const ALL_SYSTEMS = [
  "Acesso de Viatura",
  "Segurança Estrutural contra Incêndio",
  "Compartimentação Horizontal",
  "Compartimentação Vertical",
  "Controle de Materiais de Acabamento",
  "Saídas de Emergência",
  "Plano de Emergência",
  "Brigada de Incêndio",
  "Iluminação de Emergência",
  "Detecção de Incêndio",
  "Alarme de Incêndio",
  "Sinalização de Emergência",
  "Extintores",
  "Hidrantes e Mangotinhos",
  "Chuveiros Automáticos",
  "Controle de Fumaça",
  "Sistema de Espuma",
  "SPDA/Instalações Elétricas",
  "Sistema de Comunicação",
  "Circuito de TV",
  "Riscos Especiais",
  "Resfriamento",
  "Controle de Temperatura",
  "Controle de Fontes de Ignição",
  "Controle de Pós",
] as const;

export type SystemName = (typeof ALL_SYSTEMS)[number];

export type HeightBand = "Térrea" | "H<=6" | "6<H<=12" | "12<H<=23" | "23<H<=30" | "H>30";

export const HEIGHT_BANDS: HeightBand[] = ["Térrea", "H<=6", "6<H<=12", "12<H<=23", "23<H<=30", "H>30"];

export interface SystemCell {
  required: boolean;
  note?: string;
}

export interface SystemRequirementByHeight {
  requiredByHeight: Partial<Record<HeightBand, SystemCell>>;
  notes?: string[];
}

export interface MatrixTableEntry {
  table: string;
  appliesWhen: {
    groups: string[];
    divisions: string[];
  };
  heightBands?: HeightBand[];
  systems?: Partial<Record<SystemName, SystemRequirementByHeight>>;
  specialStructure?: "tunnel_extension" | "flammable_liquids_gas" | "comission_only";
  tunnelExtensionBands?: TunnelExtensionBand[];
  generalNotes?: string[];
}

export type TunnelExtensionLabel = "Até 200" | "De 200 a 500" | "De 500 a 1.000" | "Acima de 1.000";

export interface TunnelExtensionBand {
  label: TunnelExtensionLabel;
  maxMeters: number | null;
  systems: Partial<Record<SystemName, SystemCell>>;
}

export function mapExtensionToBand(extensionM: number | undefined | null): TunnelExtensionLabel {
  if (extensionM === undefined || extensionM === null) return "Até 200";
  if (extensionM <= 200) return "Até 200";
  if (extensionM <= 500) return "De 200 a 500";
  if (extensionM <= 1000) return "De 500 a 1.000";
  return "Acima de 1.000";
}

function allHeights(required: boolean, note?: string): Partial<Record<HeightBand, SystemCell>> {
  const cell: SystemCell = { required, ...(note ? { note } : {}) };
  return {
    Térrea: cell,
    "H<=6": cell,
    "6<H<=12": cell,
    "12<H<=23": cell,
    "23<H<=30": cell,
    "H>30": cell,
  };
}

export const TABELA_5_COLUNAS: Record<string, string[]> = {
  col1: ["A-1", "A-2", "A-3", "D-1", "D-2", "D-3", "D-4", "E-1", "E-2", "E-3", "E-4", "E-5", "E-6", "G-1", "G-2", "G-3", "G-4", "G-5"],
  col2: ["B-1", "B-2"],
  col3: ["C-1", "C-2", "C-3"],
  col4: ["F-1", "F-5"],
  col5: ["F-2", "F-3", "F-4", "F-6", "F-7", "F-8"],
  col6: ["F-9", "F-10"],
  col7: ["H-1", "H-4", "H-6"],
  col8: ["H-2", "H-3", "H-5"],
  col9: ["I-1", "I-2", "I-3", "J-1", "J-2", "J-3", "J-4"],
  col10: ["L-1"],
};

const TABELA_5_CMA_NAO_EXIGIDO = new Set(["col1", "col3", "col6", "col9"]);

export const TABELA_5_SYSTEMS_UNIVERSAIS: SystemName[] = [
  "Saídas de Emergência",
  "Iluminação de Emergência",
  "Sinalização de Emergência",
  "Extintores",
  "Brigada de Incêndio",
];

export function getTabela5Requirements(divisao: string): Partial<Record<SystemName, SystemCell>> | null {
  const d = divisao.toUpperCase().trim();
  const coluna = Object.entries(TABELA_5_COLUNAS).find(([, divs]) => divs.includes(d))?.[0];
  if (!coluna) return null;

  const result: Partial<Record<SystemName, SystemCell>> = {};
  for (const sys of TABELA_5_SYSTEMS_UNIVERSAIS) {
    result[sys] = { required: true };
  }
  result["Controle de Materiais de Acabamento"] = {
    required: !TABELA_5_CMA_NAO_EXIGIDO.has(coluna),
  };
  result["Hidrantes e Mangotinhos"] = { required: false, note: "Não consta na Tabela 5 (área <=750m2 e altura <=12m)." };
  result["Alarme de Incêndio"] = { required: false, note: "Não consta na Tabela 5." };
  result["Detecção de Incêndio"] = { required: false, note: "Não consta na Tabela 5." };
  result["Chuveiros Automáticos"] = { required: false, note: "Não consta na Tabela 5." };
  result["Compartimentação Horizontal"] = { required: false, note: "Não consta na Tabela 5." };
  result["Compartimentação Vertical"] = { required: false, note: "Não consta na Tabela 5." };
  result["Controle de Fumaça"] = { required: false, note: "Não consta na Tabela 5." };

  return result;
}

export const REQUIRED_SYSTEMS_MATRIX: MatrixTableEntry[] = [
  {
    table: "Tabela 6A",
    appliesWhen: { groups: ["A"], divisions: ["A-2", "A-3"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false },
          "12<H<=23": { required: true, note: "Pode ser substituída por controle de fumaça nos átrios." },
          "23<H<=30": { required: true, note: "Pode ser substituída por controle de fumaça nos átrios." },
          "H>30": { required: true, note: "Pode ser substituída por controle de fumaça nos átrios." },
        },
      },
      "Controle de Materiais de Acabamento": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Saídas de Emergência": {
        requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Deve haver elevador de emergência para altura maior que 80m." } },
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Alarme de Incêndio": {
        requiredByHeight: allHeights(true, "Pode ser substituído por interfone com ramal por apartamento ligado a portaria com vigilância humana 24h e fonte autônoma de 60 min."),
      },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
    },
    generalNotes: [
      "O pavimento superior da unidade duplex do último piso não é computado para a altura da edificação.",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6B",
    appliesWhen: { groups: ["B"], divisions: ["B-1", "B-2"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: {
          Térrea: { required: false },
          "H<=6": { required: true, note: "Pode ser substituída por detecção de incêndio e chuveiros automáticos." },
          "6<H<=12": { required: true, note: "Pode ser substituída por detecção de incêndio e chuveiros automáticos." },
          "12<H<=23": { required: true, note: "Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos." },
          "23<H<=30": { required: true, note: "Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos." },
          "H>30": { required: true },
        },
      },
      "Compartimentação Vertical": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false },
          "12<H<=23": { required: true }, "23<H<=30": { required: true },
          "H>30": { required: true, note: "Pode ser substituída por controle de fumaça, detecção e chuveiros até 60m, exceto compartimentação de fachadas/shafts." },
        },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Deve haver elevador de emergência para altura acima de 60m." } } },
      "Plano de Emergência": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": {
        requiredByHeight: allHeights(true, "Isentos motéis sem corredores internos de serviço (apenas Térrea e H<=6)."),
      },
      "Detecção de Incêndio": {
        requiredByHeight: {
          Térrea: { required: false },
          "H<=6": { required: true, note: "Detectores em todos os quartos. Isento para motéis sem corredores internos." },
          "6<H<=12": { required: true, note: "Detectores em todos os quartos." },
          "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true },
        },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true, "Acionadores manuais nas áreas de circulação.") },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60 metros de altura." } },
      },
    },
  },
  {
    table: "Tabela 6C",
    appliesWhen: { groups: ["C"], divisions: ["C-1", "C-2", "C-3"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": { requiredByHeight: allHeights(true, "Pode ser substituída por chuveiros automáticos ou por detecção+chuveiros, conforme faixa.") },
      "Compartimentação Vertical": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false },
          "12<H<=23": { required: true, note: "Controle de fumaça nos átrios (ITCBMBA-15)." },
          "23<H<=30": { required: true }, "H>30": { required: true, note: "Até 60m, exceto compartimentação de fachadas/shafts." },
        },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Apenas para divisão C-3 (shopping centers).") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": { requiredByHeight: allHeights(true) },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
  },
  {
    table: "Tabela 6D",
    appliesWhen: { groups: ["D"], divisions: ["D-1", "D-2", "D-3", "D-4"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: {
          Térrea: { required: true, note: "Pode ser substituída por chuveiros automáticos." },
          "H<=6": { required: true, note: "Pode ser substituída por chuveiros automáticos." },
          "6<H<=12": { required: true, note: "Pode ser substituída por chuveiros automáticos." },
          "12<H<=23": { required: true, note: "Pode ser substituída por detecção e chuveiros automáticos." },
          "23<H<=30": { required: true, note: "Pode ser substituída por detecção e chuveiros automáticos." },
          "H>30": { required: false },
        },
      },
      "Compartimentação Vertical": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false },
          "12<H<=23": { required: true, note: "Pode ser substituída por detecção+chuveiros; controle de fumaça nos átrios (ITCBMBA-15)." },
          "23<H<=30": { required: true, note: "Pode ser substituída por controle de fumaça, detecção e chuveiros, exceto fachadas/shafts." },
          "H>30": { required: true, note: "Até 60m pode ser substituída por controle de fumaça+detecção+chuveiros, exceto fachadas/shafts; acima de 60m adicionalmente conforme ITCBMBA-09." },
        },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Deve haver Elevador de Emergência para altura maior que 60m." } } },
      "Plano de Emergência": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Edificações acima de 60 metros de altura." } },
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Edificações acima de 60 metros de altura." } },
      },
    },
  },
  {
    table: "Tabela 6E",
    appliesWhen: { groups: ["E"], divisions: ["E-1", "E-2", "E-3", "E-4", "E-5", "E-6"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false },
          "12<H<=23": { required: true, note: "Considerada para fachadas e selagens de shafts e dutos." },
          "23<H<=30": { required: true, note: "Considerada para fachadas e selagens de shafts e dutos." },
          "H>30": { required: true, note: "Pode ser substituída por controle de fumaça, detecção e chuveiros até 60m, exceto fachadas/shafts; acima, ITCBMBA-09." },
        },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Deve haver Elevador de Emergência para altura maior que 60m." } } },
      "Plano de Emergência": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
    generalNotes: ["Os locais destinados a laboratórios devem ter proteção em função dos produtos utilizados."],
  },
  {
    table: "Tabela 6F.1",
    appliesWhen: { groups: ["F"], divisions: ["F-1"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: allHeights(true) },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para locais com público acima de 1000 pessoas.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
    },
  },
  {
    table: "Tabela 6F.1",
    appliesWhen: { groups: ["F"], divisions: ["F-2"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para locais com público acima de 1000 pessoas.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
  },
  {
    table: "Tabela 6F.2",
    appliesWhen: { groups: ["F"], divisions: ["F-3", "F-9"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para a divisão F-3.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true, note: "Não exigido nas arquibancadas." }, "23<H<=30": { required: true, note: "Não exigido nas arquibancadas." }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
    },
  },
  {
    table: "Tabela 6F.2",
    appliesWhen: { groups: ["F"], divisions: ["F-4"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para locais com público acima de 1000 pessoas.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": { requiredByHeight: allHeights(true, "Para locais com carga de incêndio (depósitos, escritórios, cozinhas) ou teto/forro falso combustível.") },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true, note: "Exigido para áreas edificadas superiores a 10.000 m²." }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
    },
    generalNotes: ["Locais de comércio ou atividades distintas das divisões F-3/F-4/F-9 terão medidas conforme suas respectivas ocupações."],
  },
  {
    table: "Tabela 6F.3",
    appliesWhen: { groups: ["F"], divisions: ["F-5", "F-6"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: { Térrea: { required: true }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: false }, "H>30": { required: false } },
      },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: false } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para locais com público acima de 1000 pessoas.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: true, note: "Para locais com carga de incêndio (depósitos, escritórios, cozinhas) ou teto/forro falso combustível." }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: false } },
      },
    },
    generalNotes: [
      "Nos locais de concentração de público, é obrigatória, antes do início de cada evento, a explanação ao público da localização das saídas de emergência e dos sistemas de segurança contra incêndio.",
    ],
  },
  {
    table: "Tabela 6F.3",
    appliesWhen: { groups: ["F"], divisions: ["F-8"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: false } },
      },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: false } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para locais com público acima de 1000 pessoas.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
    },
  },
  {
    table: "Tabela 6F.4",
    appliesWhen: { groups: ["F"], divisions: ["F-7"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(false) },
      "Compartimentação Horizontal": { requiredByHeight: allHeights(false) },
      "Compartimentação Vertical": { requiredByHeight: allHeights(false) },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: allHeights(true) },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para locais com público acima de 1000 pessoas.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": { requiredByHeight: allHeights(false) },
      "Alarme de Incêndio": { requiredByHeight: allHeights(false) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(false) },
      "Chuveiros Automáticos": { requiredByHeight: allHeights(false) },
      "Controle de Fumaça": { requiredByHeight: allHeights(false) },
    },
    generalNotes: ["A Divisão F-7 com altura superior a 6 metros será submetida à Comissão Técnica para definição das medidas de segurança."],
  },
  {
    table: "Tabela 6F.4",
    appliesWhen: { groups: ["F"], divisions: ["F-10"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: { Térrea: { required: true }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: false }, "H>30": { required: false } },
      },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: false } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Somente para locais com público acima de 1000 pessoas.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": {
        requiredByHeight: { Térrea: { required: true }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
    },
  },
  {
    table: "Tabela 6G.1",
    appliesWhen: { groups: ["G"], divisions: ["G-1", "G-2"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true, note: "Exigido para compartimentações de fachadas e selagens de shafts." }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true, "Pelo menos um acionador manual por pavimento, a no máximo 5m da saída de emergência.") },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Dispensado caso a edificação seja aberta lateralmente." } },
      },
    },
  },
  {
    table: "Tabela 6G.2",
    appliesWhen: { groups: ["G"], divisions: ["G-3"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": { requiredByHeight: allHeights(false) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true, note: "Exigido para selagens dos shafts e dutos de instalações." }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Elevador de emergência para altura maior que 60m." } } },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
    },
  },
  {
    table: "Tabela 6G.2",
    appliesWhen: { groups: ["G"], divisions: ["G-4"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true, note: "Exigido para selagens dos shafts e dutos de instalações." }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: allHeights(true) },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
    },
  },
  {
    table: "Tabela 6G.3",
    appliesWhen: { groups: ["G"], divisions: ["G-5"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: allHeights(true) },
      "Plano de Emergência": { requiredByHeight: allHeights(true) },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": { requiredByHeight: allHeights(true, "Somente para áreas superiores a 5.000 m².") },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true, "Prever extintores portáteis e sobrerrodas conforme ITCBMBA-21.") },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Sistema de Espuma": {
        requiredByHeight: allHeights(true, "Não exigido entre 750 e 2.000 m². Entre 2.000 e 5.000 m² pode ser manual. Acima de 5.000 m² deve ser fixo (chuveiros tipo dilúvio), podendo ser setorizado; ver ITCBMBA-23 e ITCBMBA-25."),
      },
    },
    generalNotes: [
      "Deve haver sistema de drenagem de líquidos nos pisos dos hangares para bacias de contenção à distância.",
      "Não é permitido armazenamento de líquidos combustíveis ou inflamáveis dentro dos hangares.",
    ],
  },
  {
    table: "Tabela 6H.1",
    appliesWhen: { groups: ["H"], divisions: ["H-1", "H-2"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false },
          "12<H<=23": { required: true }, "23<H<=30": { required: true },
          "H>30": { required: true },
        },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Deve haver elevador de emergência para altura maior que 60m (H-2)." } } },
      "Plano de Emergência": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false },
        },
        notes: ["Para H-2, Plano de Emergência é exigido em todas as faixas."],
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
        notes: ["Para H-2, detecção é exigida em todas as faixas; detectores instalados em todos os quartos."],
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true, "Acionadores manuais obrigatórios.") },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m de altura." } },
      },
    },
    generalNotes: [
      "H-1: hospital veterinário e assemelhado. H-2: local onde pessoas requerem cuidados especiais por limitações físicas ou mentais (asilos, etc).",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6H.2",
    appliesWhen: { groups: ["H"], divisions: ["H-3", "H-4"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
        notes: ["Faixa exigida apenas para H-3 (pode ser substituída por chuveiros automáticos). H-4 não exige."],
      },
      "Compartimentação Vertical": {
        requiredByHeight: {
          Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: true, note: "Exigido para selagens de shafts e dutos (H-3)." },
          "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true },
        },
        notes: ["H-4 não exige Compartimentação Vertical em nenhuma faixa."],
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Plano de Emergência": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
        notes: ["Não exigido nem para H-3 nem para H-4 nesta tabela."],
      },
      "Saídas de Emergência": {
        requiredByHeight: {
          Térrea: { required: true }, "H<=6": { required: true }, "6<H<=12": { required: true },
          "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true, note: "H-4: deve haver elevador de emergência para altura maior que 60m." },
        },
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: true }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: false } },
        notes: ["Coluna H-3: dispensado nos corredores de circulação. H-4 não exige detecção em nenhuma faixa."],
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true, "Acionadores manuais obrigatórios nos corredores (H-3).") },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
    generalNotes: [
      "H-3: hospital e assemelhado/clínica com internação. H-4: edificação das forças armadas e policiais (quartéis).",
      "Áreas administrativas devem ser consideradas como D-1, e hotéis de trânsito devem ser enquadrados como B-1.",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6H.3",
    appliesWhen: { groups: ["H"], divisions: ["H-5", "H-6"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
        notes: ["H-5 não exige nesta coluna. H-6 exige nas três primeiras faixas (pode ser substituída por chuveiros automáticos) e nas duas seguintes (pode ser substituída por detecção+chuveiros)."],
      },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
        notes: ["H-5: exigido a partir de 12<H<=23. H-6: padrão semelhante, com substituições possíveis por controle de fumaça/detecção/chuveiros."],
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "H-5: deve haver elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": {
        requiredByHeight: allHeights(true),
        notes: ["Exigido para H-5 em todas as faixas. H-6 não exige Plano de Emergência."],
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
        notes: ["H-5 (presídios em geral): não é necessário detecção automática. Hospitais psiquiátricos e assemelhados: prever detecção em todos os quartos. H-6: somente nos quartos, se houver."],
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
    generalNotes: [
      "H-5: local onde a liberdade das pessoas sofre restrição (presídios). H-6: clínica e consultório médico/odontológico sem internação.",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6I.1",
    appliesWhen: { groups: ["I"], divisions: ["I-1", "I-2"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: true, note: "Pode ser substituída por chuveiros automáticos." }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "I-1: deve haver elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
        notes: ["I-2 exige Plano de Emergência apenas acima de 12m."],
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
        notes: ["I-2 exige detecção em todas as faixas."],
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
    generalNotes: [
      "I-1: indústria com carga de incêndio até 300 MJ/m² (risco baixo). I-2: carga acima de 300 até 1.200 MJ/m² (risco médio).",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6I.2",
    appliesWhen: { groups: ["I"], divisions: ["I-3"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: { Térrea: { required: true }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: false }, "H>30": { required: false } },
      },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Deve haver elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true) },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": { requiredByHeight: allHeights(true) },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
    generalNotes: [
      "I-3: indústria com carga de incêndio acima de 1.200 MJ/m² (risco alto).",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6J.1",
    appliesWhen: { groups: ["J"], divisions: ["J-1", "J-2"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: false } },
        notes: ["Não exigido para J-1 em nenhuma faixa. J-2 exige em todas as faixas."],
      },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
        notes: ["J-1: exigido a partir de 12<H<=23. J-2: exigido apenas nas duas faixas intermediárias superiores (12<H<=23 e 23<H<=30); confirmar H>30 conforme edificação."],
      },
      "Controle de Materiais de Acabamento": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: true }, "6<H<=12": { required: true }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "J-2: deve haver elevador de emergência para altura maior que 60m." } } },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
        notes: ["J-1: detecção exigida só acima de 30m. J-2: exigida a partir de 12<H<=23."],
      },
      "Alarme de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
        notes: ["J-2 exige alarme em todas as faixas."],
      },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
        notes: ["J-1 (material incombustível): hidrante NÃO exigido até 12m de altura; exigido acima de 12m. J-2 (risco baixo): hidrante exigido em TODAS as faixas, inclusive Térrea."],
      },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
    generalNotes: [
      "J-1: depósito de material incombustível. J-2: depósito com carga de incêndio até 300 MJ/m² (risco baixo).",
      "Em qualquer tipo de ocupação, sempre que houver depósito de materiais combustíveis (J-2, J-3, J-4) em áreas descobertas, são exigidos: hidrantes e brigada para áreas de depósito superiores a 2.500m² (d.1); extintores com percurso máximo de 50m (d.2); recuos de divisas: 3,0m do passeio público, 2,0m das divisas laterais/fundos, 3,0m de bombas/equipamentos com fontes de ignição (d.3); lotes de depósito com no máximo 20m de comprimento/largura, separados por corredores de 1,5m (d.4).",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6J.2",
    appliesWhen: { groups: ["J"], divisions: ["J-3", "J-4"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: { ...allHeights(true), "H>30": { required: true, note: "Deve haver elevador de emergência para altura maior que 60m." } } },
      "Plano de Emergência": { requiredByHeight: allHeights(true) },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Fumaça": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true, note: "Acima de 60m." } },
      },
    },
    generalNotes: [
      "J-3: depósito com carga de incêndio acima de 300 até 1.200 MJ/m² (risco médio). J-4: carga acima de 1.200 MJ/m² (risco alto).",
      "Mesma nota da Tabela 6J.1 sobre depósitos em áreas descobertas (hidrante+brigada acima de 2.500m², etc).",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6M.1",
    appliesWhen: { groups: ["M"], divisions: ["M-1"] },
    specialStructure: "tunnel_extension",
    tunnelExtensionBands: [
      {
        label: "Até 200",
        maxMeters: 200,
        systems: {
          "Segurança Estrutural contra Incêndio": { required: true },
          "Saídas de Emergência": { required: true },
          "Controle de Fumaça": { required: true },
          "Sinalização de Emergência": { required: true },
          "Plano de Emergência": { required: false },
          "Brigada de Incêndio": { required: false },
          "Iluminação de Emergência": { required: false },
          "Extintores": { required: false },
          "Hidrantes e Mangotinhos": { required: false },
          "Sistema de Comunicação": { required: false },
          "Circuito de TV": { required: false },
        },
      },
      {
        label: "De 200 a 500",
        maxMeters: 500,
        systems: {
          "Segurança Estrutural contra Incêndio": { required: true },
          "Saídas de Emergência": { required: true },
          "Controle de Fumaça": { required: true },
          "Sinalização de Emergência": { required: true },
          "Plano de Emergência": { required: true },
          "Brigada de Incêndio": { required: true },
          "Iluminação de Emergência": { required: true },
          "Extintores": { required: true },
          "Hidrantes e Mangotinhos": { required: true },
          "Sistema de Comunicação": { required: false },
          "Circuito de TV": { required: false },
        },
      },
      {
        label: "De 500 a 1.000",
        maxMeters: 1000,
        systems: {
          "Segurança Estrutural contra Incêndio": { required: true },
          "Saídas de Emergência": { required: true },
          "Controle de Fumaça": { required: true },
          "Sinalização de Emergência": { required: true },
          "Plano de Emergência": { required: true },
          "Brigada de Incêndio": { required: true },
          "Iluminação de Emergência": { required: true },
          "Extintores": { required: true },
          "Hidrantes e Mangotinhos": { required: true },
          "Sistema de Comunicação": { required: true },
          "Circuito de TV": { required: false },
        },
      },
      {
        label: "Acima de 1.000",
        maxMeters: null,
        systems: {
          "Segurança Estrutural contra Incêndio": { required: true },
          "Saídas de Emergência": { required: true },
          "Controle de Fumaça": { required: true },
          "Sinalização de Emergência": { required: true },
          "Plano de Emergência": { required: true },
          "Brigada de Incêndio": { required: true },
          "Iluminação de Emergência": { required: true },
          "Extintores": { required: true },
          "Hidrantes e Mangotinhos": { required: true },
          "Sistema de Comunicação": { required: true },
          "Circuito de TV": { required: true, note: "Túneis acima de 1.000m devem ser regularizados mediante Comissão Técnica." },
        },
      },
    ],
    generalNotes: [
      "M-1 (túnel): estrutura por extensão em metros, não por área/altura. Faixas: Até 200m / De 200 a 500m / De 500 a 1.000m / Acima de 1.000m.",
      "Sistemas e exigência por extensão: Segurança Estrutural contra Incêndio (X em todas), Saídas de Emergência (X em todas), Controle de Fumaça (X em todas), Sinalização de Emergência (X em todas), Plano de Emergência (não exigido até 200m, X nas demais), Brigada de Incêndio (não exigido até 200m, X nas demais), Iluminação de Emergência (não exigido até 200m, X nas demais), Extintores (não exigido até 200m, X nas demais), Hidrantes e Mangotinhos (não exigido até 200m, X nas demais), Sistema de Comunicação (não exigido até 500m, X nas demais), Circuito de TV/monitoramento (exigido somente acima de 1.000m).",
      "Túneis acima de 1.000m de extensão devem ser regularizados mediante Comissão Técnica.",
      "Atender às exigências da ITCBMBA-35 (túnel rodoviário).",
    ],
  },
  {
    table: "Tabela 6M.2",
    appliesWhen: { groups: ["M"], divisions: ["M-2"] },
    specialStructure: "flammable_liquids_gas",
    generalNotes: [
      "M-2 (líquidos e gases combustíveis e inflamáveis): aplica-se a qualquer área e altura. Estrutura por categoria de operação, não por faixa de altura.",
      "Categorias: (1) Tanques/cilindros e processos com líquidos até 20m³ ou gases até 10m³; (2) Tanques/cilindros e processos com líquidos acima de 20m³ ou gases acima de 10m³; (3) Plataforma de carregamento; (4) Produtos acondicionados líquidos até 20m³ ou gases até 12.480kg; (5) Produtos acondicionados líquidos acima de 20m³ ou gases acima de 12.480kg.",
      "Hidrantes e Mangotinhos: NÃO exigido na categoria 1 (tanques/cilindros pequenos) e NÃO exigido na categoria 4 (produtos acondicionados pequenos); EXIGIDO na categoria 2 (tanques/cilindros grandes) e na categoria 5 (produtos acondicionados grandes); na categoria 3 (plataforma de carregamento) exigido apenas para líquidos inflamáveis/combustíveis conforme ITCBMBA-25.",
      "Resfriamento e Sistema de Espuma seguem o mesmo padrão do Hidrante: exigidos nas categorias 2 e 5, condicionalmente na 3, não exigidos nas categorias 1 e 4.",
      "Verificar sempre ITCBMBA-25 (líquidos inflamáveis/combustíveis), ITCBMBA-28 (GLP) e ITCBMBA-29 (gás natural) para armazenamento e processamento.",
      "Esta divisão exige sempre revisão técnica detalhada dado o caráter especial do risco — usar a matriz apenas como triagem inicial.",
    ],
  },
  {
    table: "Tabela 6M.3",
    appliesWhen: { groups: ["M"], divisions: ["M-3"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Segurança Estrutural contra Incêndio": { requiredByHeight: allHeights(true) },
      "Compartimentação Horizontal": { requiredByHeight: allHeights(true) },
      "Compartimentação Vertical": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Controle de Materiais de Acabamento": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: allHeights(true) },
      "Plano de Emergência": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true }, "23<H<=30": { required: true }, "H>30": { required: true } },
      },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true) },
      "Detecção de Incêndio": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: false }, "23<H<=30": { required: false }, "H>30": { required: true } },
      },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true) },
      "Chuveiros Automáticos": {
        requiredByHeight: { Térrea: { required: false }, "H<=6": { required: false }, "6<H<=12": { required: false }, "12<H<=23": { required: true, note: "Pode ser substituído por sistema de gases com supressão total do ambiente." }, "23<H<=30": { required: true, note: "Pode ser substituído por sistema de gases com supressão total do ambiente." }, "H>30": { required: true, note: "Pode ser substituído por sistema de gases com supressão total do ambiente." } },
      },
    },
    generalNotes: [
      "M-3: centrais de comunicação e energia.",
      "Para subestações elétricas observar também ITCBMBA-37.",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
  {
    table: "Tabela 6M.4",
    appliesWhen: { groups: ["M"], divisions: ["M-4", "M-7"] },
    specialStructure: "comission_only",
    generalNotes: [
      "M-4 (propriedade em transformação, qualquer altura) e M-7 (pátio de contêineres, térreo/áreas externas): estrutura simplificada, aplicável quando área > 750m².",
      "Sistemas exigidos para ambos: Acesso de Viatura, Saídas de Emergência (M-4 aceita saídas próprias da edificação, podendo ser escadas tipo NE; M-7 aceita arruamentos entre quadras de armazenamento), Brigada de Incêndio, Sinalização de Emergência, Extintores.",
      "Hidrantes e Mangotinhos NÃO consta nesta tabela — não exigido para M-4/M-7 por esta tabela específica.",
      "Observar também ITCBMBA-36 (pátio de contêiner). Quando houver edificação dentro do terreno das áreas de risco, verificar exigências particulares para cada ocupação; casos específicos vão para Comissão Técnica.",
    ],
  },
  {
    table: "Tabela 6M.5",
    appliesWhen: { groups: ["M"], divisions: ["M-5"] },
    heightBands: HEIGHT_BANDS,
    systems: {
      "Acesso de Viatura": { requiredByHeight: allHeights(true) },
      "Saídas de Emergência": { requiredByHeight: allHeights(true) },
      "Plano de Emergência": { requiredByHeight: allHeights(true, "Exigido quando a área de risco possuir mais de um depósito de silagem.") },
      "Brigada de Incêndio": { requiredByHeight: allHeights(true) },
      "Iluminação de Emergência": { requiredByHeight: allHeights(true, "Somente para as áreas de circulação.") },
      "Controle de Temperatura": { requiredByHeight: allHeights(true, "Observar ITCBMBA-27.") },
      "Alarme de Incêndio": { requiredByHeight: allHeights(true) },
      "Sinalização de Emergência": { requiredByHeight: allHeights(true) },
      "Extintores": { requiredByHeight: allHeights(true) },
      "Hidrantes e Mangotinhos": { requiredByHeight: allHeights(true, "Observar regras e condições particulares da ITCBMBA-27.") },
      "Chuveiros Automáticos": { requiredByHeight: allHeights(true, "Observar ITCBMBA-27.") },
      "Controle de Fontes de Ignição": { requiredByHeight: allHeights(true, "Nas áreas com acúmulo de pós.") },
      "Controle de Pós": { requiredByHeight: allHeights(true, "Nas áreas com acúmulo de pós.") },
      "SPDA/Instalações Elétricas": { requiredByHeight: allHeights(true) },
    },
    generalNotes: [
      "M-5: silos, armazenamento de grãos.",
      "Observar as exigências particulares da ITCBMBA-27 (armazenamento em silos).",
      "Para subsolos ocupados ver Tabela 7.",
    ],
  },
];

export const TABELA_7_SUBSOLO = {
  description: "Exigências adicionais para ocupações em subsolos diferentes de estacionamento (Decreto 16.302/2015, Tabela 7).",
  bands: [
    {
      areaM2Range: [0, 50] as [number, number],
      label: "Até 50 m²",
      requirement: "Sem exigências adicionais, para qualquer tipo de ocupação.",
    },
    {
      areaM2Range: [50, 100] as [number, number],
      label: "Entre 50 e 100 m²",
      byOccupation: {
        deposito: [
          "Depósitos individuais com área máxima até 5m² cada, OU",
          "Depósitos individuais com área máxima até 25m² cada e detecção automática de incêndio no depósito, OU",
          "Chuveiros automáticos de resposta rápida no depósito, OU",
          "Controle de fumaça.",
        ],
        divisoesF: [
          "Ambientes subdivididos com área máxima até 50m² e detecção automática de incêndio em todo o subsolo, OU",
          "Chuveiros automáticos de resposta rápida em todo o subsolo, OU",
          "Controle de fumaça.",
        ],
        outras: [
          "Ambientes subdivididos com área máxima até 50m² e detecção automática de incêndio nos ambientes ocupados, OU",
          "Chuveiros automáticos de resposta rápida nos ambientes ocupados, OU",
          "Controle de fumaça.",
        ],
      },
    },
    {
      areaM2Range: [100, 250] as [number, number],
      label: "Entre 100 e 250 m²",
      byOccupation: {
        deposito: [
          "Depósitos individuais com área máxima até 5m² cada, OU",
          "Ambientes subdivididos com área máxima até 50m², detecção automática de incêndio no depósito e exaustão, OU",
          "Chuveiros automáticos de resposta rápida no depósito e exaustão, OU",
          "Controle de fumaça.",
        ],
        divisoesF: [
          "Detecção automática de incêndio em todo o subsolo, exaustão e duas saídas de emergência, OU",
          "Chuveiros automáticos de resposta rápida em todo o subsolo e exaustão, OU",
          "Controle de fumaça.",
        ],
        outras: [
          "Detecção automática de incêndio nos ambientes ocupados e exaustão, OU",
          "Chuveiros automáticos de resposta rápida nos ambientes ocupados e exaustão, OU",
          "Controle de fumaça.",
        ],
      },
    },
    {
      areaM2Range: [250, 500] as [number, number],
      label: "Entre 250 e 500 m²",
      byOccupation: {
        deposito: [
          "Depósitos individuais (em edificações residenciais) com área máxima até 5m² cada, OU",
          "Detecção automática de incêndio em todo o subsolo e exaustão, OU",
          "Chuveiros automáticos de resposta rápida em todo o subsolo e exaustão, OU",
          "Controle de fumaça.",
        ],
        divisoesF: [
          "Detecção automática de incêndio em todo o subsolo, exaustão e duas saídas de emergência em lados opostos, OU",
          "Chuveiros automáticos de resposta rápida em todo o subsolo e exaustão, OU",
          "Controle de fumaça.",
        ],
        outras: [
          "Detecção automática de incêndio em todo o subsolo e exaustão, OU",
          "Chuveiros automáticos de resposta rápida em todo o subsolo e exaustão, OU",
          "Controle de fumaça.",
        ],
      },
    },
    {
      areaM2Range: [500, Infinity] as [number, number],
      label: "Acima de 500 m²",
      byOccupation: {
        deposito: [
          "Depósitos individuais (em edificações residenciais) com área máxima até 5m² cada, OU",
          "Chuveiros automáticos de resposta rápida e detecção automática de incêndio em todo o subsolo, duas saídas de emergência em lados opostos e controle de fumaça.",
        ],
        outras: [
          "Chuveiros automáticos de resposta rápida e detecção automática de incêndio em todo o subsolo, duas saídas de emergência em lados opostos e controle de fumaça.",
        ],
      },
    },
  ],
  generalNote: "Estas são medidas ALTERNATIVAS entre si (ligadas por 'ou'); a edificação deve atender a UMA das opções listadas para a faixa de área e tipo de ocupação aplicável. Para Divisões F-1, F-2, F-3, F-5, F-6 e F-10 aplicar a coluna específica de divisões F; para depósito aplicar a coluna de depósito; demais ocupações usar 'outras'.",
};

export function mapHeightToBand(heightM: number | undefined | null): HeightBand {
  if (heightM === undefined || heightM === null) return "Térrea";
  if (heightM <= 0) return "Térrea";
  if (heightM <= 6) return "H<=6";
  if (heightM <= 12) return "6<H<=12";
  if (heightM <= 23) return "12<H<=23";
  if (heightM <= 30) return "23<H<=30";
  return "H>30";
}

export function findMatrixEntry(group: string, division: string): MatrixTableEntry | null {
  const div = division.toUpperCase().trim();
  const grp = group.toUpperCase().trim();
  // Prioridade absoluta: correspondência exata de divisão. Nunca cair para
  // "primeira tabela do mesmo grupo" — grupos como F e H têm várias tabelas
  // (6F.1 a 6F.4, 6H.1 a 6H.3) e pegar a primeira por grupo geraria respostas
  // erradas para divisões que estão em outra tabela do mesmo grupo.
  const byDivision = REQUIRED_SYSTEMS_MATRIX.find((e) => e.appliesWhen.divisions.includes(div));
  if (byDivision) return byDivision;

  // Fallback só para entradas sem lista de divisões (nenhuma hoje, mas mantido por segurança de tipo).
  const byGroupOnly = REQUIRED_SYSTEMS_MATRIX.find(
    (e) => e.appliesWhen.divisions.length === 0 && e.appliesWhen.groups.includes(grp)
  );
  return byGroupOnly ?? null;
}

export function requiresTabela7(areaSubsoloM2: number | undefined | null): boolean {
  return typeof areaSubsoloM2 === "number" && areaSubsoloM2 > 0;
}
