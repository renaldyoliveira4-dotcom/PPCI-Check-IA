/**
 * NORMAS — Classificação de Ocupações
 * Baseado na IT-01 do Corpo de Bombeiros Militar da Bahia (CBMBA)
 */

export interface Divisao {
  descricao: string;
  exemplos: string;
  populacao_por_m2: number;
  carga_incendio_especifica: number;
}

export interface Grupo {
  nome: string;
  divisoes: Record<string, Divisao>;
}

export const GRUPOS_OCUPACAO: Record<string, Grupo> = {
  A: {
    nome: "Residencial",
    divisoes: {
      "A-1": {
        descricao: "Habitação unifamiliar",
        exemplos: "Casas térreas ou sobrados",
        populacao_por_m2: 0.05,
        carga_incendio_especifica: 300,
      },
      "A-2": {
        descricao: "Habitação multifamiliar",
        exemplos: "Edifícios de apartamentos",
        populacao_por_m2: 0.05,
        carga_incendio_especifica: 300,
      },
      "A-3": {
        descricao: "Habitação coletiva",
        exemplos: "Pensionatos, alojamentos, mosteiros, conventos, internatos",
        populacao_por_m2: 0.1,
        carga_incendio_especifica: 300,
      },
    },
  },
  B: {
    nome: "Serviços de Hospedagem",
    divisoes: {
      "B-1": {
        descricao: "Hotel e assemelhados",
        exemplos: "Hotéis, motéis, pousadas, pensões",
        populacao_por_m2: 0.1,
        carga_incendio_especifica: 300,
      },
      "B-2": {
        descricao: "Hotel residencial",
        exemplos: "Hotéis residenciais, flats",
        populacao_por_m2: 0.1,
        carga_incendio_especifica: 300,
      },
    },
  },
  C: {
    nome: "Comercial Varejista",
    divisoes: {
      "C-1": {
        descricao: "Comércio com baixa carga de incêndio",
        exemplos: "Armarinhos, artigos de metal, drogarias",
        populacao_por_m2: 0.1,
        carga_incendio_especifica: 400,
      },
      "C-2": {
        descricao: "Comércio com alta carga de incêndio",
        exemplos: "Lojas de departamentos, magazines, supermercados",
        populacao_por_m2: 0.2,
        carga_incendio_especifica: 800,
      },
      "C-3": {
        descricao: "Shopping centers",
        exemplos: "Shopping centers, centros comerciais",
        populacao_por_m2: 0.2,
        carga_incendio_especifica: 600,
      },
    },
  },
  D: {
    nome: "Serviços Profissionais, Pessoais e Técnicos",
    divisoes: {
      "D-1": {
        descricao: "Local para prestação de serviço profissional ou condução de negócios",
        exemplos:
          "Escritórios administrativos, consultórios, repartições públicas, agências bancárias",
        populacao_por_m2: 0.1,
        carga_incendio_especifica: 700,
      },
      "D-2": {
        descricao: "Agência bancária e assemelhados",
        exemplos: "Agências bancárias, postos de câmbio",
        populacao_por_m2: 0.1,
        carga_incendio_especifica: 400,
      },
      "D-3": {
        descricao: "Serviços de reparação (oficinas)",
        exemplos: "Oficinas elétricas, mecânicas, pintura",
        populacao_por_m2: 0.07,
        carga_incendio_especifica: 800,
      },
    },
  },
  E: {
    nome: "Educacional e Cultura Física",
    divisoes: {
      "E-1": {
        descricao: "Escola em geral",
        exemplos: "Escolas, auto-escolas, cursos de idiomas",
        populacao_por_m2: 0.5,
        carga_incendio_especifica: 300,
      },
      "E-2": {
        descricao: "Escola especial",
        exemplos: "Escolas para portadores de necessidades especiais",
        populacao_por_m2: 0.25,
        carga_incendio_especifica: 300,
      },
      "E-3": {
        descricao: "Espaço para cultura física",
        exemplos: "Academias, estúdios de dança, piscinas cobertas",
        populacao_por_m2: 0.25,
        carga_incendio_especifica: 200,
      },
      "E-4": {
        descricao: "Centro de treinamento profissional",
        exemplos: "SENAI, SENAC, escolas profissionalizantes",
        populacao_por_m2: 0.25,
        carga_incendio_especifica: 300,
      },
      "E-5": {
        descricao: "Pré-escola / Creche",
        exemplos: "Creches, jardim de infância, maternal",
        populacao_por_m2: 0.5,
        carga_incendio_especifica: 300,
      },
      "E-6": {
        descricao: "Escola para portadores de necessidades especiais",
        exemplos: "APAE, escolas especializadas",
        populacao_por_m2: 0.25,
        carga_incendio_especifica: 300,
      },
    },
  },
  F: {
    nome: "Locais de Reunião de Público",
    divisoes: {
      "F-1": {
        descricao: "Local onde há objeto de valor inestimável",
        exemplos: "Museus, centro de documentos históricos, galerias de arte",
        populacao_por_m2: 0.3,
        carga_incendio_especifica: 300,
      },
      "F-2": {
        descricao: "Local religioso e assemelhado",
        exemplos: "Igrejas, capelas, sinagogas, mesquitas, templos",
        populacao_por_m2: 0.5,
        carga_incendio_especifica: 200,
      },
      "F-3": {
        descricao: "Centro esportivo e de exibição",
        exemplos: "Estádios, ginásios, arena, autódromo, sambódromo",
        populacao_por_m2: 0.5,
        carga_incendio_especifica: 200,
      },
      "F-4": {
        descricao: "Estação e terminal de passageiro",
        exemplos: "Estação rodoviária, ferroviária, metroviária, aeroporto",
        populacao_por_m2: 0.2,
        carga_incendio_especifica: 200,
      },
      "F-5": {
        descricao: "Arte cênica e auditório",
        exemplos: "Teatros, cinemas, óperas, auditórios, anfiteatros",
        populacao_por_m2: 1.0,
        carga_incendio_especifica: 400,
      },
      "F-6": {
        descricao: "Clube social e diversão",
        exemplos: "Boate, salão de baile, restaurante dançante, clubes",
        populacao_por_m2: 1.0,
        carga_incendio_especifica: 300,
      },
      "F-7": {
        descricao: "Local para alimentação",
        exemplos: "Restaurantes, lanchonetes, bares, cafés, refeitórios",
        populacao_por_m2: 0.5,
        carga_incendio_especifica: 300,
      },
      "F-8": {
        descricao: "Local para comércio",
        exemplos: "Feiras de amostras, exposições, supermercados > 10.000 m²",
        populacao_por_m2: 0.3,
        carga_incendio_especifica: 600,
      },
    },
  },
  G: {
    nome: "Serviço Automotivo e Assemelhados",
    divisoes: {
      "G-1": {
        descricao: "Garagem sem acesso de público e sem abastecimento",
        exemplos: "Garagem automática (com ou sem manobrista), edifício-garagem",
        populacao_por_m2: 0.03,
        carga_incendio_especifica: 300,
      },
      "G-2": {
        descricao: "Garagem com acesso de público e sem abastecimento",
        exemplos: "Garagem coletiva (com ou sem manobrista), estacionamento",
        populacao_por_m2: 0.03,
        carga_incendio_especifica: 300,
      },
      "G-3": {
        descricao: "Local dotado de abastecimento de combustível",
        exemplos: "Posto de abastecimento de combustível, serviço de manutenção",
        populacao_por_m2: 0.05,
        carga_incendio_especifica: 1000,
      },
      "G-4": {
        descricao: "Serviço de conservação, manutenção e reparos",
        exemplos: "Oficinas de conserto de veículos, borracharia, funilaria",
        populacao_por_m2: 0.07,
        carga_incendio_especifica: 800,
      },
    },
  },
  H: {
    nome: "Serviço de Saúde e Institucional",
    divisoes: {
      "H-1": {
        descricao: "Hospital veterinário e assemelhados",
        exemplos: "Hospital veterinário, clínica veterinária com internação",
        populacao_por_m2: 0.1,
        carga_incendio_especifica: 300,
      },
      "H-2": {
        descricao: "Local onde pessoas requerem cuidados especiais",
        exemplos: "Hospital, casa de saúde, pronto-socorro, clínica com internação",
        populacao_por_m2: 0.15,
        carga_incendio_especifica: 300,
      },
      "H-3": {
        descricao: "Hospital e assemelhados",
        exemplos: "Hospital geral, hospital especializado",
        populacao_por_m2: 0.15,
        carga_incendio_especifica: 300,
      },
    },
  },
  I: {
    nome: "Industrial, Produção e Armazenamento",
    divisoes: {
      "I-1": {
        descricao: "Locais com baixo potencial de incêndio",
        exemplos: "Fábricas em geral com materiais incombustíveis",
        populacao_por_m2: 0.05,
        carga_incendio_especifica: 300,
      },
      "I-2": {
        descricao: "Locais com médio potencial de incêndio",
        exemplos: "Fábricas de alimentos, marcenarias, fábricas de móveis",
        populacao_por_m2: 0.05,
        carga_incendio_especifica: 1200,
      },
      "I-3": {
        descricao: "Locais com alto potencial de incêndio",
        exemplos: "Refinarias, fábricas de explosivos, fábricas de tintas",
        populacao_por_m2: 0.03,
        carga_incendio_especifica: 2000,
      },
    },
  },
  J: {
    nome: "Depósitos",
    divisoes: {
      "J-1": {
        descricao: "Depósito com baixa carga de incêndio",
        exemplos: "Depósito de materiais incombustíveis",
        populacao_por_m2: 0.02,
        carga_incendio_especifica: 300,
      },
      "J-2": {
        descricao: "Depósito com média e alta carga de incêndio",
        exemplos: "Depósito de grãos, cereais, malte, madeira, papel",
        populacao_por_m2: 0.02,
        carga_incendio_especifica: 2000,
      },
    },
  },
};

export function obterOcupacao(grupo: string, divisao: string) {
  const g = GRUPOS_OCUPACAO[grupo.toUpperCase()];
  if (!g) return null;
  const d = g.divisoes[divisao.toUpperCase()];
  if (!d) return null;
  return {
    grupo: grupo.toUpperCase(),
    nome_grupo: g.nome,
    divisao: divisao.toUpperCase(),
    ...d,
  };
}

export function listarGrupos() {
  return Object.entries(GRUPOS_OCUPACAO).map(([k, v]) => ({
    codigo: k,
    nome: v.nome,
    divisoes: Object.keys(v.divisoes),
  }));
}
