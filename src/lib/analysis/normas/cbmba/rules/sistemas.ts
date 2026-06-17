/**
 * Regras condicionais por sistema / ocupação / características do projeto.
 * TAREFA 6 — src/lib/analysis/normas/cbmba/rules/sistemas.ts
 *
 * Cada função retorna itens de checklist quando a condição é atendida.
 *
 * Mapeamento correto de ITs (NÃO ALTERAR sem conferir a norma):
 * IT-17 = Brigada de incêndio
 * IT-19 = Detecção e alarme de incêndio
 * IT-22 = Hidrantes e mangotinhos
 * IT-23 = Chuveiros automáticos
 * IT-13 = Pressurização de escada
 * IT-28 = GLP
 * IT-09 = Compartimentação
 * IT-08 = Resistência ao fogo
 */

import type { ChecklistNormativoItem } from "../../../checklist";

export type ProjectSnapshot = {
  area_construida: number;
  altura: number;
  grupo: string;
  divisao: string;
  risco: "LEVE" | "MODERADO" | "ELEVADO";
  floors: number;
  has_glp?: boolean;
  has_basement?: boolean;
  is_reuniao_publico?: boolean;
  analysis_mode?: string;
  /** Carga de incêndio em MJ/m², extraída do memorial descritivo (cálculo do projetista) */
  carga_incendio?: number;
};

function item(
  partial: Omit<ChecklistNormativoItem, "exigido" | "motivo">,
  motivo: string,
  exigido = true
): ChecklistNormativoItem {
  return { ...partial, exigido, motivo };
}

/** Faixas de área da Tabela 3 (IT-22), em ordem crescente */
const FAIXAS_AREA_TABELA3 = [
  { max: 2500, label: "até 2.500 m²" },
  { max: 5000, label: "acima de 2.500 m² até 5.000 m²" },
  { max: 10000, label: "acima de 5.000 m² até 10.000 m²" },
  { max: 20000, label: "acima de 10.000 m² até 20.000 m²" },
  { max: 50000, label: "acima de 20.000 m² até 50.000 m²" },
  { max: Infinity, label: "acima de 50.000 m²" },
] as const;

/**
 * Tabela 3 (IT-22/2016) — Aplicabilidade dos tipos de sistemas e volume de
 * reserva de incêndio mínima (RTI em m³), por faixa de área x coluna de
 * classificação/carga de incêndio.
 *
 * Colunas (da Tabela 3, conforme classificação da Tabela 1 do Decreto
 * 16.302/15 e carga de incêndio em MJ/m² quando aplicável):
 *  col1 = A-2, A-3, C-1, D-1(até 300), D-2, D-3(até 300), D-4(até 300), E-1 a E-6,
 *         F-1(até 300), F-2, F-3, F-4, F-8, G-1 a G-4, H-1 a H-3, H-5, H-6, I-1,
 *         J-1, J-2 e M-3
 *  col2 = D-1(acima de 300), D-3(acima de 300), D-4(acima de 300), B-1, B-2,
 *         C-2, C-3, F-1(acima de 300 até 1000), F-5, F-6, F-7, F-9, F-10, H-4,
 *         I-2(acima de 300 até 800), J-2 e J-3
 *  col3 = C-2(acima de 1000), I-2(acima de 800), J-3(acima de 800)
 *  col4 = G-5, I-3, J-4, L-2 e L-3
 *
 * Cada célula: [tipoSistema, rtiM3]
 */
const TABELA3_HIDRANTES: Record<
  string,
  { col1: [number, number]; col2: [number, number]; col3: [number, number]; col4: [number, number] }
> = {
  "até 2.500 m²": { col1: [1, 5], col2: [2, 8], col3: [3, 12], col4: [4, 28] },
  "acima de 2.500 m² até 5.000 m²": { col1: [1, 8], col2: [2, 12], col3: [3, 18], col4: [4, 32] },
  "acima de 5.000 m² até 10.000 m²": { col1: [1, 12], col2: [2, 18], col3: [3, 25], col4: [4, 48] },
  "acima de 10.000 m² até 20.000 m²": { col1: [1, 18], col2: [2, 25], col3: [3, 35], col4: [4, 64] },
  "acima de 20.000 m² até 50.000 m²": { col1: [1, 25], col2: [2, 35], col3: [4, 48], col4: [5, 96] },
  "acima de 50.000 m²": { col1: [1, 35], col2: [2, 48], col3: [4, 70], col4: [5, 120] },
};

/**
 * Determina em qual coluna da Tabela 3 o projeto se encaixa, com base no
 * grupo/divisão e na carga de incêndio (MJ/m²) calculada no memorial.
 * Retorna null se não houver dado suficiente (divisão não mapeada).
 */
function colunaTabela3(divisao: string, cargaIncendio?: number): "col1" | "col2" | "col3" | "col4" | null {
  const d = divisao.toUpperCase().trim();

  // Coluna 4 — sempre, independente de carga de incêndio
  if (["G-5", "I-3", "J-4", "L-2", "L-3"].includes(d)) return "col4";

  // Divisões cuja coluna depende da carga de incêndio calculada no memorial
  if (["D-1", "D-3", "D-4", "F-1"].includes(d)) {
    if (cargaIncendio === undefined) return null; // precisa do memorial pra decidir
    if (d === "F-1") {
      if (cargaIncendio <= 300) return "col1";
      if (cargaIncendio <= 1000) return "col2";
      return null; // F-1 não definido acima de 1000 nesta tabela
    }
    return cargaIncendio <= 300 ? "col1" : "col2";
  }

  if (d === "C-2") {
    if (cargaIncendio === undefined) return null;
    return cargaIncendio <= 1000 ? "col2" : "col3";
  }

  if (d === "I-2") {
    if (cargaIncendio === undefined) return null;
    if (cargaIncendio <= 800) return "col2";
    return "col3";
  }

  if (d === "J-3") {
    if (cargaIncendio === undefined) return null;
    return cargaIncendio <= 800 ? "col2" : "col3";
  }

  // Coluna 1 — divisões sem dependência de carga de incêndio
  if (
    ["A-2", "A-3", "C-1", "D-2", "E-1", "E-2", "E-3", "E-4", "E-5", "E-6",
     "F-2", "F-3", "F-4", "F-8", "G-1", "G-2", "G-3", "G-4", "H-1", "H-2",
     "H-3", "H-5", "H-6", "I-1", "J-1", "J-2", "M-3"].includes(d)
  ) return "col1";

  // Coluna 2 — divisões sem dependência de carga de incêndio
  if (["B-1", "B-2", "C-3", "F-5", "F-6", "F-7", "F-9", "F-10", "H-4"].includes(d)) return "col2";

  return null; // divisão não mapeada nesta tabela — não cravar valor
}

/** IT-22 — Hidrantes e mangotinhos (Tabela 3, por área x classificação/carga de incêndio) */
export function regra_hidrantes(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  const faixa = FAIXAS_AREA_TABELA3.find((f) => p.area_construida <= f.max);
  if (!faixa) return null;

  const coluna = colunaTabela3(p.divisao, p.carga_incendio);

  // Sem dados suficientes pra determinar a coluna (falta carga de incêndio
  // do memorial, ou divisão fora do mapeamento): ainda assim sinaliza que
  // o sistema deve ser verificado, sem cravar Tipo/RTI errado.
  if (!coluna) {
    return item(
      {
        id: "IT22-hidrantes",
        sistema: "Hidrantes e mangotinhos",
        norma: "IT-22",
        item_normativo: "IT-22/2016 · Tabela 3",
        titulo: "Sistema de hidrantes e mangotinhos — verificar Tabela 3",
        descricao:
          `A Tabela 3 da IT-22/2016 define o Tipo de sistema e a Reserva Técnica de Incêndio (RTI) ` +
          `exigida em função da área construída e da classificação/carga de incêndio (MJ/m²) da ` +
          `edificação. Para confirmar automaticamente o Tipo e a RTI exigidos, é necessário o valor ` +
          `de carga de incêndio (MJ/m²) calculado no memorial descritivo.`,
        severidade: "critica",
        verificar_na_planta: [
          "representação da rede de hidrantes / mangotinhos",
          "posicionamento dos abrigos / caixas de incêndio",
          "caminhamento das tubulações",
          "localização da casa de bombas",
          "localização do reservatório RTI",
          "símbolo conforme IT-04",
        ],
        verificar_no_memorial: [
          "cálculo da carga de incêndio (MJ/m²) — necessário para definir a coluna da Tabela 3",
          "cálculo da Reserva Técnica de Incêndio (RTI) compatível com o Tipo de sistema",
          "vazão e pressão mínimas",
          "tipo de sistema (Tipo 1 a 5, conforme Tabela 3)",
          "potência da bomba de incêndio",
          "material e diâmetro das tubulações",
        ],
        palavras_chave: [
          "hidrante", "mangotinho", "rti", "reserva técnica", "bomba",
          "abrigo", "caixa de incêndio", "prumada", "carga de incêndio", "tabela 3",
        ],
      },
      `Área construída (${p.area_construida} m²) está na faixa "${faixa.label}" da Tabela 3 — ` +
      `IT-22 exige sistema de hidrantes/mangotinhos, mas o Tipo e a RTI exatos dependem da carga ` +
      `de incêndio (MJ/m²) calculada no memorial para a divisão "${p.divisao}".`
    );
  }

  const [tipoSistema, rti] = TABELA3_HIDRANTES[faixa.label][coluna];

  return item(
    {
      id: "IT22-hidrantes",
      sistema: "Hidrantes e mangotinhos",
      norma: "IT-22",
      item_normativo: "IT-22/2016 · Tabela 3",
      titulo: `Sistema de hidrantes e mangotinhos — Tipo ${tipoSistema}, RTI ${rti} m³`,
      descricao:
        `Conforme Tabela 3 da IT-22/2016, para área construída de ${p.area_construida} m² ` +
        `(faixa "${faixa.label}") e classificação "${p.divisao}"${p.carga_incendio !== undefined ? ` (carga de incêndio ${p.carga_incendio} MJ/m²)` : ""}, ` +
        `é exigido sistema Tipo ${tipoSistema} com Reserva Técnica de Incêndio mínima de ${rti} m³. ` +
        `Verificar rede, prumadas, abrigos, RTI, bomba e caminhamento conforme IT-22/2016 CBMBA.`,
      severidade: "critica",
      verificar_na_planta: [
        "representação da rede de hidrantes / mangotinhos",
        "posicionamento dos abrigos / caixas de incêndio",
        "caminhamento das tubulações",
        "localização da casa de bombas",
        "localização do reservatório RTI",
        "símbolo conforme IT-04",
      ],
      verificar_no_memorial: [
        `cálculo da Reserva Técnica de Incêndio (RTI) — mínimo ${rti} m³ conforme Tabela 3`,
        `tipo de sistema — deve ser Tipo ${tipoSistema} conforme Tabela 3`,
        "vazão e pressão mínimas",
        "potência da bomba de incêndio",
        "material e diâmetro das tubulações",
      ],
      palavras_chave: [
        "hidrante", "mangotinho", "rti", "reserva técnica", "bomba",
        "abrigo", "caixa de incêndio", "prumada", "tabela 3",
      ],
    },
    `Área construída (${p.area_construida} m²) na faixa "${faixa.label}" + classificação "${p.divisao}" ` +
    `→ Tabela 3 da IT-22 exige sistema Tipo ${tipoSistema}, RTI mínima ${rti} m³`
  );
}

/** IT-19 — Alarme e detecção */
export function regra_alarme(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  const motivos: string[] = [];
  if (p.area_construida > 750) motivos.push("área > 750 m²");
  if (p.has_basement) motivos.push("possui subsolo");
  if (p.is_reuniao_publico || p.grupo === "F")
    motivos.push("reunião de público (grupo F)");
  if (p.grupo === "H") motivos.push("serviço de saúde (grupo H)");
  if (p.risco === "ELEVADO") motivos.push("risco elevado");
  if (p.altura > 12) motivos.push("altura > 12 m");
  if (motivos.length === 0) return null;

  return item(
    {
      id: "IT19-alarme",
      sistema: "Alarme e detecção de incêndio",
      norma: "IT-19",
      item_normativo: "IT-19/2017 · Seção 4",
      titulo: "Sistema de detecção e alarme de incêndio",
      descricao:
        "Verificar sistema de alarme e/ou detecção automática na planta: central, detectores, acionadores manuais, sirenes/campainhas conforme IT-19/2017 CBMBA.",
      severidade: "alta",
      verificar_na_planta: [
        "central de alarme / SDAI",
        "detectores automáticos (fumaça, temperatura, chama)",
        "acionadores manuais (botoeiras)",
        "sirenes e dispositivos de aviso",
        "símbolo conforme IT-04",
      ],
      verificar_no_memorial: [
        "tipo de sistema (categoria I, II ou III)",
        "cobertura dos detectores",
        "autonomia da central",
        "referência à IT-19/2017",
      ],
      palavras_chave: [
        "alarme",
        "detecção",
        "detector",
        "sirene",
        "central",
        "acionador",
        "fumaça",
        "sdai",
      ],
    },
    motivos.join("; ")
  );
}

/** IT-17 — Brigada de incêndio */
export function regra_brigada(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  const motivos: string[] = [];
  if (p.area_construida > 5000) motivos.push("área > 5.000 m²");
  if (p.is_reuniao_publico || p.grupo === "F")
    motivos.push("reunião de público (grupo F)");
  if (p.grupo === "H") motivos.push("serviço de saúde (grupo H)");
  if (p.risco === "ELEVADO") motivos.push("risco elevado");
  if (p.altura > 23) motivos.push("altura > 23 m");
  if (motivos.length === 0) return null;

  return item(
    {
      id: "IT17-brigada",
      sistema: "Brigada de incêndio",
      norma: "IT-17",
      item_normativo: "IT-17/2016 · Seção 4",
      titulo: "Brigada de incêndio — previsão documental",
      descricao:
        "Verificar se o projeto prevê e documenta a formação de brigada de incêndio conforme IT-17/2016 CBMBA. Não é representado graficamente mas deve constar no memorial.",
      severidade: "alta",
      verificar_na_planta: ["nenhuma representação gráfica exigida"],
      verificar_no_memorial: [
        "declaração de constituição de brigada",
        "dimensionamento do número de brigadistas",
        "referência à IT-17/2016",
      ],
      palavras_chave: [
        "brigada",
        "brigadista",
        "plano de emergência",
        "treinamento",
        "emergência",
      ],
    },
    motivos.join("; ")
  );
}

/** IT-23 — Chuveiros automáticos (sprinklers) */
export function regra_sprinklers(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  if (p.altura <= 30 && p.area_construida <= 5000 && p.risco !== "ELEVADO")
    return null;

  const motivos: string[] = [];
  if (p.altura > 30) motivos.push("altura > 30 m");
  if (p.area_construida > 5000) motivos.push("área > 5.000 m²");
  if (p.risco === "ELEVADO") motivos.push("risco elevado");

  return item(
    {
      id: "IT23-sprinklers",
      sistema: "Chuveiros automáticos (sprinklers)",
      norma: "IT-23",
      item_normativo: "IT-23/2018 · Seção 4",
      titulo: "Sistema de chuveiros automáticos — sprinklers",
      descricao:
        "Verificar representação do sistema de chuveiros automáticos na planta: rede, prumadas, sprinklers, alarm valve, RTI exclusiva conforme IT-23/2018 CBMBA.",
      severidade: "critica",
      verificar_na_planta: [
        "rede de sprinklers em planta",
        "prumadas e ramificações",
        "alarm valve (válvula de alarme)",
        "RTI exclusiva do sistema",
      ],
      verificar_no_memorial: [
        "densidade de aplicação (mm/min)",
        "área de operação",
        "volume RTI exclusiva",
        "referência à IT-23/2018",
      ],
      palavras_chave: [
        "sprinkler",
        "chuveiro automático",
        "rti",
        "alarm valve",
        "densidade",
        "extinção automática",
      ],
    },
    motivos.join("; ")
  );
}

/** IT-13 — Pressurização de escada */
export function regra_pressurizacao(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  if (p.altura <= 12) return null;
  return item(
    {
      id: "IT13-pressurizacao",
      sistema: "Pressurização de escada de segurança",
      norma: "IT-13",
      item_normativo: "IT-13/2022 · Seção 4",
      titulo: "Escada enclausurada — tipo e pressurização",
      descricao:
        "Edificações com altura > 12 m exigem escada enclausurada. Acima de 23 m pode ser necessária pressurização. Verificar tipo de escada e, se aplicável, o sistema de pressurização conforme IT-13/2022 CBMBA.",
      severidade: "alta",
      verificar_na_planta: [
        "tipo de escada (EP = enclausurada protegida; PF = à prova de fumaça)",
        "planta do shaft de pressurização (se PF pressurizada)",
        "equipamento de pressurização (fan/ventilador)",
        "sistema de controle de fumaça",
      ],
      verificar_no_memorial: [
        "justificativa do tipo de escada",
        "cálculo de pressurização (se aplicável)",
        "referência à IT-13/2022",
      ],
      palavras_chave: [
        "pressurização",
        "escada",
        "enclausurada",
        "prova de fumaça",
        "shaft",
        "ventilação",
        "ep",
        "pf",
      ],
    },
    `Altura (${p.altura} m) > 12 m — escada enclausurada obrigatória; verificar necessidade de pressurização`
  );
}

/** IT-28 — GLP */
export function regra_glp(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  if (!p.has_glp) return null;
  return item(
    {
      id: "IT28-glp",
      sistema: "Instalação de GLP",
      norma: "IT-28",
      item_normativo: "IT-28/2021 · Seção 4",
      titulo: "Central de GLP — instalação e segurança",
      descricao:
        "Projeto informa presença de GLP. Verificar representação da central/botijão, afastamentos, ventilação e sinalização conforme IT-28/2021 CBMBA.",
      severidade: "alta",
      verificar_na_planta: [
        "localização da central de GLP / botijão",
        "afastamentos de paredes e aberturas",
        "ventilação natural",
        "sinalização de área de risco",
      ],
      verificar_no_memorial: [
        "capacidade do reservatório",
        "pressão de serviço",
        "referência à IT-28/2021 e normas ABNT aplicáveis",
      ],
      palavras_chave: [
        "glp",
        "gás",
        "central",
        "botijão",
        "cilindro",
        "reservatório",
        "ventilação",
        "afastamento",
      ],
    },
    "Projeto informa presença de GLP — IT-28 aplicável"
  );
}

/** IT-08/09 — Segurança estrutural e compartimentação (altura > 12 m) */
export function regra_estrutural(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  if (p.altura <= 12) return null;
  return item(
    {
      id: "IT08-IT09-estrutural",
      sistema: "Segurança estrutural e compartimentação",
      norma: "IT-08",
      item_normativo: "IT-08/2016 e IT-09/2022",
      titulo: "Resistência ao fogo e compartimentação",
      descricao:
        "Edificações com altura > 12 m exigem verificação de resistência ao fogo (TRRF) e compartimentação horizontal/vertical conforme IT-08/2016 e IT-09/2022 CBMBA.",
      severidade: "alta",
      verificar_na_planta: [
        "elementos de compartimentação horizontal (portas corta-fogo)",
        "elementos de compartimentação vertical (lajes, paredes)",
        "indicação de TRRF nos elementos estruturais",
        "selos corta-fogo em passagens de dutos/tubulações",
      ],
      verificar_no_memorial: [
        "TRRF dos elementos conforme tabela IT-08",
        "justificativa de compartimentação",
        "referência à IT-08/2016 e IT-09/2022",
      ],
      palavras_chave: [
        "resistência",
        "fogo",
        "trrf",
        "compartimentação",
        "porta corta-fogo",
        "pcf",
        "selagem",
      ],
    },
    `Altura (${p.altura} m) > 12 m — IT-08 e IT-09 aplicáveis`
  );
}
