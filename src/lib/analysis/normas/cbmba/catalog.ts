/**
 * Catálogo Normativo — Corpo de Bombeiros Militar da Bahia (CBMBA)
 * Fonte: IT-BOMBEIROS-BAHIA (ZIP oficial)
 * Mapeamento correto de ITs — NÃO alterar sem revisar a norma fonte.
 *
 * Mapeamento correto:
 * IT-04 = Símbolos gráficos (NÃO é extintores)
 * IT-11 = Saídas de emergência
 * IT-14 = Carga de incêndio
 * IT-17 = Brigada de incêndio (NÃO é hidrantes)
 * IT-18 = Iluminação de emergência
 * IT-19 = Detecção e alarme
 * IT-20 = Sinalização de emergência
 * IT-21 = Extintores (NÃO é sinalização)
 * IT-22 = Hidrantes e mangotinhos (NÃO é brigada)
 * IT-28 = GLP
 */

export type NormaCategory =
  | "legislacao"
  | "portaria"
  | "procedimentos"
  | "classificacao"
  | "sistemas_ativo"
  | "sistemas_passivo"
  | "especial"
  | "terminologia";

export interface NormaCBMBA {
  code: string;
  title: string;
  year: number | null;
  filename: string;
  category: NormaCategory;
  active: boolean;
  deprecated?: boolean;
  version_label?: string;
  /** ITs que esta norma complementa ou é complementada por */
  related_codes?: string[];
  /** Sistemas de proteção que esta norma regulamenta */
  sistemas?: string[];
}

export const NORMAS_CBMBA: NormaCBMBA[] = [
  // ── Legislação base ─────────────────────────────────────────────
  {
    code: "LEI-12929-2013",
    title: "Lei Estadual nº 12.929/2013 — Segurança contra incêndio e pânico no Estado da Bahia",
    year: 2013,
    filename: "lei_no_12929_de_27_12_2013_-_estadual_-_bahia_-_legisweb.pdf",
    category: "legislacao",
    active: true,
  },
  {
    code: "DEC-16302-2015",
    title: "Decreto nº 16.302/2015 — Regulamenta a Lei nº 12.929/2013",
    year: 2015,
    filename: "decreto_no_16.302_de_27_ago_15_-_regulamenta_a_lei_no_12.929.pdf",
    category: "legislacao",
    active: true,
  },
  {
    code: "PORT-061-2017",
    title: "Portaria 061 CG-CBMBA/2017 — Autorização relacionada à segurança contra incêndio",
    year: 2017,
    filename: "2017_061_portaria_que_regula_a_autorizacao_revisao_final_1.pdf",
    category: "portaria",
    active: true,
  },

  // ── Procedimentos administrativos ─────────────────────────────
  {
    code: "IT-01",
    title: "IT-01/2016 — Procedimentos administrativos",
    year: 2016,
    filename: "it_no_01.2016_homologa_as_alteracoes_da_instrucao_tecnica_do_corpo_de_bombeiros_militar_da_bahia_-_procedimentos_administrativos_e_da_outras_providencias.pdf",
    category: "procedimentos",
    active: true,
  },
  {
    code: "IT-02",
    title: "IT-02/2016 — Processo administrativo infracional",
    year: 2016,
    filename: "it_02.2016_-_processo_administrativo_infracional.pdf",
    category: "procedimentos",
    active: true,
  },
  {
    code: "IT-03",
    title: "IT-03/2016 — Terminologia de segurança contra incêndio",
    year: 2016,
    filename: "it_03.2016_-_terminologia_de_seguranca_contra_incendio.pdf",
    category: "terminologia",
    active: true,
  },

  // ── Representação e classificação ─────────────────────────────
  {
    code: "IT-04",
    title: "IT-04/2016 — Símbolos gráficos para projeto de segurança contra incêndio",
    year: 2016,
    filename: "it_04.2016_-_simbolos_graficos.pdf",
    category: "classificacao",
    active: true,
    sistemas: ["simbolos_graficos", "legenda"],
  },

  // ── Credenciamento ─────────────────────────────────────────────
  {
    code: "IT-05",
    title: "IT-05/2021 — Credenciamento de instrutores, bombeiros civis e empresas",
    year: 2021,
    filename: "it_05_2021_credenciamento_de_instrutores_e_bombeiroscivis_e_de_empresas_da_area_de_seguranca_contra_incendio_e_panico_anexos_disponiveis_republicacao_da_portaria_027.pdf",
    category: "procedimentos",
    active: true,
  },

  // ── Sistemas passivos ─────────────────────────────────────────
  {
    code: "IT-06",
    title: "IT-06/2016 — Acesso de viatura na edificação",
    year: 2016,
    filename: "it_06-2016_acesso_de_viatuara_na_edificacao.pdf",
    category: "sistemas_passivo",
    active: true,
    sistemas: ["acesso_viaturas"],
  },
  {
    code: "IT-07",
    title: "IT-07/2016 — Separação entre edificações / isolamento de risco",
    year: 2016,
    filename: "it_07.2016_-_separacao_entre_edificacoes.pdf",
    category: "sistemas_passivo",
    active: true,
    sistemas: ["separacao_edificacoes", "isolamento_risco"],
  },
  {
    code: "IT-08",
    title: "IT-08/2016 — Resistência ao fogo dos elementos de construção",
    year: 2016,
    filename: "it_08.2016_-_resistencia_ao_fogo_dos_elementos_de_construcao.pdf",
    category: "sistemas_passivo",
    active: true,
    sistemas: ["resistencia_fogo", "seguranca_estrutural"],
  },
  {
    code: "IT-09",
    title: "IT-09/2022 — Compartimentação horizontal e vertical",
    year: 2022,
    filename: "it_009.2022_-_homologa_as_alteracoes_na_instrucao_tecnica_do_corpo_de_bombeiros_militar_da_bahia_-_it_no_09_2022_-_compartimentacao_horizontal_e_compartimentacao_vertic_0.pdf",
    category: "sistemas_passivo",
    active: true,
    sistemas: ["compartimentacao"],
  },
  {
    code: "IT-10",
    title: "IT-10/2016 — Controle de materiais de acabamento e revestimento",
    year: 2016,
    filename: "it_10.2016_-_controle_de_materiais_de_acabamentorevestimento.pdf",
    category: "sistemas_passivo",
    active: true,
    sistemas: ["controle_materiais"],
  },

  // ── Saídas de emergência ───────────────────────────────────────
  {
    code: "IT-11",
    title: "IT-11/2016 — Saídas de emergência",
    year: 2016,
    filename: "it_11.2016_-_saidas_de_emergencia.pdf",
    category: "sistemas_passivo",
    active: true,
    sistemas: ["saidas_emergencia", "escadas", "portas", "rota_fuga", "lotacao"],
  },

  // ── Especiais ─────────────────────────────────────────────────
  {
    code: "IT-12",
    title: "IT-12/2016 — Centros esportivos e de exibição",
    year: 2016,
    filename: "it_12.2016_-_centros_esportivos_e_de_exibicao_-_requisitos_de_seguranca_contra_incendio.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-13",
    title: "IT-13/2022 — Pressurização de escada de segurança",
    year: 2022,
    filename: "it.cbmba_13._2022_-_pressurizacao_de_escada_de_seguranca.pdf",
    category: "sistemas_passivo",
    active: true,
    sistemas: ["pressurizacao_escada"],
  },
  {
    code: "IT-14",
    title: "IT-14/2017 — Carga de incêndio em edificações, estruturas e áreas de risco",
    year: 2017,
    filename: "it_14_2017_carga_de_incendio_em_edificacoes_estruturas_e_areas_de_risco_1.pdf",
    category: "classificacao",
    active: true,
    sistemas: ["carga_incendio"],
  },

  // ── Brigada ───────────────────────────────────────────────────
  {
    code: "IT-17",
    title: "IT-17/2016 — Brigada de incêndio",
    year: 2016,
    filename: "it_17.2016_-_brigada_de_incendio.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["brigada_incendio"],
  },

  // ── Sistemas ativos ───────────────────────────────────────────
  {
    code: "IT-18",
    title: "IT-18/2017 — Sistema de iluminação de emergência",
    year: 2017,
    filename: "it_18.2017_-_sistema_de_iluminacao_de_emergencia.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["iluminacao_emergencia"],
  },
  {
    code: "IT-19",
    title: "IT-19/2017 — Sistema de detecção e alarme de incêndio",
    year: 2017,
    filename: "it_19.2017-_sistema_de_deteccao_e_alarme_de_incendio.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["deteccao_incendio", "alarme_incendio"],
  },
  {
    code: "IT-20",
    title: "IT-20/2017 — Sinalização de emergência",
    year: 2017,
    filename: "it_20.2017_-_sinalizacao_de_emergencia.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["sinalizacao_emergencia"],
  },
  {
    code: "IT-21",
    title: "IT-21/2017 — Sistema de proteção por extintores de incêndio",
    year: 2017,
    filename: "it_21.2017_-_sistema_de_protecao_por_extintores_de_incendio.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["extintores"],
  },
  {
    code: "IT-22",
    title: "IT-22/2016 — Sistemas de hidrantes e de mangotinhos para combate a incêndio",
    year: 2016,
    filename: "it_22.2016_-_sistemas_de_hidrantes_e_de_mangotinhos_para_combate_a_incendio.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["hidrantes", "mangotinhos", "reservatorio", "bomba_incendio", "rti"],
  },
  {
    code: "IT-23",
    title: "IT-23/2018 — Sistema de chuveiros automáticos",
    year: 2018,
    filename: "it_23.2018_-_sistemas_de_chuveiros_automaticos.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["chuveiros_automaticos", "sprinklers"],
  },
  {
    code: "IT-24",
    title: "IT-24/2020 — Chuveiros automáticos para áreas de depósito",
    year: 2020,
    filename: "it-24-2020_sistema_de_chuveiros_automaticos_para_areas_de_deposito.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["chuveiros_automaticos_deposito"],
  },

  // ── Sistemas especiais ─────────────────────────────────────────
  {
    code: "IT-26",
    title: "IT-26/2021 — Sistema fixo de gases para combate a incêndio",
    year: 2021,
    filename: "it_26.2021_sistema_fixo_de_gases_para_combate_a_incendio.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["sistema_gases"],
  },
  {
    code: "IT-27",
    title: "IT-27/2020 — Silos",
    year: 2020,
    filename: "it_27.2020_silos.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-28",
    title: "IT-28/2021 — Manipulação, armazenamento, comercialização e utilização de GLP",
    year: 2021,
    filename: "it_28_2021_manipulacao_armazenamento_comercializacao_e_utilizacao_de_gas_liquefeito_de_petroleo.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["glp", "gas_liquefeito"],
  },
  {
    code: "IT-29",
    title: "IT-29/2021 — Comercialização, distribuição e utilização de gás natural",
    year: 2021,
    filename: "it_n29.2021_comercializacao_distribuicao_e_utilizacao_de_gas_natural.pdf",
    category: "sistemas_ativo",
    active: true,
    sistemas: ["gas_natural"],
  },
  {
    code: "IT-30",
    title: "IT-30/2017 — Fogos de artifício e pirotecnia",
    year: 2017,
    filename: "it_30.2017_-_fogos_de_artificio_e_pirotecnia.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-32",
    title: "IT-32/2021 — Produtos perigosos em edificações e áreas de risco",
    year: 2021,
    filename: "it_32_2021_produtos_perigosos_em_edificacoes_e_areas_de_risco_rev_final_3.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-33",
    title: "IT-33/2021 — Cobertura de sapé, piaçava e similares",
    year: 2021,
    filename: "it_33_2021_cobertura_de_sape_piacava_e_similares_rev._final_1_2.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-34",
    title: "IT-34/2021 — Hidrante urbano",
    year: 2021,
    filename: "it_34_2021_hidrante_urbano_rev._final_2_0.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-35",
    title: "IT-35/2021 — Túnel rodoviário",
    year: 2021,
    filename: "it_35_2021_tunel_rodoviario._rev._final_3.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-36",
    title: "IT-36/2021 — Pátio de contêineres",
    year: 2021,
    filename: "it_36_2021_patio_de_conteineres_rev._final_5.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-37",
    title: "IT-37/2018 — Subestação elétrica",
    year: 2018,
    filename: "it_37.2018_-_subestacao_eletrica.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-39",
    title: "IT-39/2016 — Estabelecimentos destinados à restrição de liberdade",
    year: 2016,
    filename: "it_39.2016_-_estabelecimentos_destinados_a_restricao_de_liberdade.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-40",
    title: "IT-40/2017 — Patrimônio histórico ou cultural",
    year: 2017,
    filename: "it_40.2017_-_seguranca_contra_incendio_em_edificacoes_que_compoem_o_patrimonio_historico_ou_cultural.pdf",
    category: "especial",
    active: true,
  },
  {
    code: "IT-41",
    title: "IT-41/2018 — Inspeção visual em instalações elétricas de baixa tensão",
    year: 2018,
    filename: "it_41.2018_-_inspecao_visual_em_instalacoes_eletricas_de_baixa_tensao.pdf",
    category: "especial",
    active: true,
  },

  // IT-42 — versão 2024 supera a 2016
  {
    code: "IT-42",
    title: "IT-42/2024 — Projeto Técnico Simplificado (PTS)",
    year: 2024,
    filename: "it_42-2024_-_projeto_tecnico_simplificado.pdf",
    category: "procedimentos",
    active: true,
    version_label: "2024",
    sistemas: ["pts", "projeto_simplificado"],
  },

  {
    code: "IT-43",
    title: "IT-43/2016 — Adaptação às normas de segurança contra incêndio em edificações existentes",
    year: 2016,
    filename: "it_43.2016_-_adaptacao_as_normas_de_seguranca_contra_incendio_-_edificacoes_existentes.pdf",
    category: "procedimentos",
    active: true,
  },
];

/** Retorna a norma pelo código (ex: "IT-21", "DEC-16302-2015") */
export function getNorma(code: string): NormaCBMBA | undefined {
  return NORMAS_CBMBA.find((n) => n.code === code);
}

/** Retorna normas ativas que regulamentam um sistema específico */
export function getNormasPorSistema(sistema: string): NormaCBMBA[] {
  return NORMAS_CBMBA.filter(
    (n) => n.active && n.sistemas?.includes(sistema)
  );
}

/** Lista de códigos de ITs ativas */
export const CODIGOS_NORMAS_ATIVAS = NORMAS_CBMBA.filter((n) => n.active).map(
  (n) => n.code
);
