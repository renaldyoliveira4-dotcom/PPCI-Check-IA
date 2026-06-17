/**
 * NORMAS — Sistemas de Proteção Contra Incêndio Exigidos
 * Baseado na IT-01 do CBMBA (Tabela de Exigências)
 */

import type { NivelRisco } from "./riscos";

export interface SistemaProtecao {
  codigo: string;
  nome: string;
  it_referencia: string;
  descricao: string;
}

export const SISTEMAS_PROTECAO: Record<string, SistemaProtecao> = {
  ACESSO_VIATURAS: {
    codigo: "AV",
    nome: "Acesso de viaturas na edificação",
    it_referencia: "IT-06",
    descricao: "Condições de acesso para viaturas do corpo de bombeiros",
  },
  SEGURANCA_ESTRUTURAL: {
    codigo: "SE",
    nome: "Segurança estrutural contra incêndio",
    it_referencia: "IT-08",
    descricao:
      "Resistência ao fogo dos elementos estruturais e de compartimentação",
  },
  COMPARTIMENTACAO: {
    codigo: "CH/CV",
    nome: "Compartimentação horizontal e vertical",
    it_referencia: "IT-09",
    descricao: "Compartimentação para conter a propagação do incêndio",
  },
  CONTROLE_MATERIAIS: {
    codigo: "CMAR",
    nome: "Controle de materiais de acabamento e revestimento",
    it_referencia: "IT-10",
    descricao: "Características dos materiais de acabamento e revestimento",
  },
  SAIDA_EMERGENCIA: {
    codigo: "SAI",
    nome: "Saídas de emergência",
    it_referencia: "IT-11",
    descricao: "Dimensionamento e disposição das saídas de emergência",
  },
  ILUMINACAO_EMERGENCIA: {
    codigo: "ILE",
    nome: "Iluminação de emergência",
    it_referencia: "IT-18",
    descricao: "Sistema de iluminação de emergência para evacuação",
  },
  SINALIZACAO_EMERGENCIA: {
    codigo: "SNE",
    nome: "Sinalização de emergência",
    it_referencia: "IT-20",
    descricao: "Sinalização de segurança contra incêndio e pânico",
  },
  ALARME_INCENDIO: {
    codigo: "ALM",
    nome: "Alarme de incêndio",
    it_referencia: "IT-19",
    descricao: "Sistema de alarme para detecção e aviso de incêndio",
  },
  DETECCAO_INCENDIO: {
    codigo: "DET",
    nome: "Detecção de incêndio",
    it_referencia: "IT-19",
    descricao: "Sistema de detecção automática de incêndio",
  },
  EXTINTORES: {
    codigo: "EXT",
    nome: "Extintores de incêndio",
    it_referencia: "IT-21", // IT-21 = extintores (IT-04 = símbolos gráficos)
    descricao: "Proteção por extintores portáteis e sobre rodas",
  },
  HIDRANTES: {
    codigo: "HID",
    nome: "Hidrantes e mangotinhos",
    it_referencia: "IT-22", // IT-22 = hidrantes (IT-17 = brigada)
    descricao: "Sistema de hidrantes e mangotinhos para combate a incêndio",
  },
  CHUVEIROS_AUTOMATICOS: {
    codigo: "CHV",
    nome: "Chuveiros automáticos (sprinklers)",
    it_referencia: "IT-23",
    descricao: "Sistema de chuveiros automáticos para extinção",
  },
  GLP: {
    codigo: "GLP",
    nome: "Central de GLP",
    it_referencia: "IT-28",
    descricao: "Instalações de gás liquefeito de petróleo",
  },
  PARA_RAIOS: {
    codigo: "SPDA",
    nome: "Sistema de proteção contra descargas atmosféricas",
    it_referencia: "NBR 5419",
    descricao: "Proteção contra raios (SPDA)",
  },
  BRIGADA_INCENDIO: {
    codigo: "BRG",
    nome: "Brigada de incêndio",
    it_referencia: "IT-12",
    descricao: "Formação de brigada de incêndio",
  },
  PLANO_EMERGENCIA: {
    codigo: "PLE",
    nome: "Plano de emergência contra incêndio",
    it_referencia: "IT-16",
    descricao: "Plano de emergência e procedimentos de evacuação",
  },
};

interface RegraExigencia {
  condicao: string;
  descricao: string;
  area_minima?: number;
  altura_minima?: number;
  grupos?: string[];
  risco?: NivelRisco;
  possui_subsolo?: boolean;
  sistemas: string[];
}

const REGRAS_EXIGENCIA: RegraExigencia[] = [
  {
    condicao: "TODAS",
    descricao: "Exigências básicas para todas as edificações",
    sistemas: [
      "EXTINTORES",
      "SAIDA_EMERGENCIA",
      "ILUMINACAO_EMERGENCIA",
      "SINALIZACAO_EMERGENCIA",
    ],
  },
  {
    condicao: "AREA_ACIMA_700",
    descricao: "Exigências para edificações com área > 700 m²",
    area_minima: 700,
    sistemas: ["ALARME_INCENDIO", "HIDRANTES"],
  },
  {
    condicao: "ALTURA_ACIMA_12",
    descricao: "Exigências para edificações com altura > 12 m",
    altura_minima: 12,
    sistemas: ["ALARME_INCENDIO", "SEGURANCA_ESTRUTURAL", "COMPARTIMENTACAO"],
  },
  {
    condicao: "ALTURA_ACIMA_23",
    descricao: "Exigências para edificações com altura > 23 m",
    altura_minima: 23,
    sistemas: ["DETECCAO_INCENDIO", "BRIGADA_INCENDIO", "PLANO_EMERGENCIA"],
  },
  {
    condicao: "ALTURA_ACIMA_30",
    descricao: "Exigências para edificações com altura > 30 m",
    altura_minima: 30,
    sistemas: ["CHUVEIROS_AUTOMATICOS"],
  },
  {
    condicao: "AREA_ACIMA_5000",
    descricao: "Exigências para edificações com área > 5.000 m²",
    area_minima: 5000,
    sistemas: ["ACESSO_VIATURAS", "BRIGADA_INCENDIO", "PLANO_EMERGENCIA"],
  },
  {
    condicao: "REUNIAO_PUBLICO",
    descricao: "Exigências adicionais para locais de reunião de público",
    grupos: ["F"],
    sistemas: ["ALARME_INCENDIO", "BRIGADA_INCENDIO"],
  },
  {
    condicao: "SAUDE",
    descricao: "Exigências adicionais para serviços de saúde",
    grupos: ["H"],
    sistemas: ["ALARME_INCENDIO", "DETECCAO_INCENDIO", "PLANO_EMERGENCIA"],
  },
  {
    condicao: "RISCO_ELEVADO",
    descricao: "Exigências adicionais para risco elevado",
    risco: "ELEVADO",
    sistemas: ["DETECCAO_INCENDIO", "BRIGADA_INCENDIO"],
  },
  {
    condicao: "COM_SUBSOLO",
    descricao: "Exigências adicionais para edificações com subsolo",
    possui_subsolo: true,
    sistemas: ["DETECCAO_INCENDIO"],
  },
];

export interface SistemaExigido {
  id: string;
  codigo: string;
  nome: string;
  it_referencia: string;
  descricao: string;
}

export function determinarSistemasExigidos(params: {
  area_construida: number;
  altura: number;
  grupo: string;
  risco: NivelRisco;
  possui_subsolo?: boolean;
}): SistemaExigido[] {
  const {
    area_construida,
    altura,
    grupo,
    risco,
    possui_subsolo = false,
  } = params;

  const sistemasIds = new Set<string>();

  for (const regra of REGRAS_EXIGENCIA) {
    let aplicar = false;

    if (regra.condicao === "TODAS") {
      aplicar = true;
    } else if (regra.condicao.startsWith("AREA_ACIMA")) {
      aplicar = area_construida > (regra.area_minima ?? 0);
    } else if (regra.condicao.startsWith("ALTURA_ACIMA")) {
      aplicar = altura > (regra.altura_minima ?? 0);
    } else if (regra.condicao === "REUNIAO_PUBLICO" || regra.condicao === "SAUDE") {
      aplicar = regra.grupos?.includes(grupo.toUpperCase()) ?? false;
    } else if (regra.condicao === "RISCO_ELEVADO") {
      aplicar = risco === "ELEVADO";
    } else if (regra.condicao === "COM_SUBSOLO") {
      aplicar = possui_subsolo;
    }

    if (aplicar) {
      for (const s of regra.sistemas) {
        sistemasIds.add(s);
      }
    }
  }

  return Array.from(sistemasIds)
    .sort()
    .map((sid) => {
      const info = SISTEMAS_PROTECAO[sid];
      return {
        id: sid,
        codigo: info?.codigo ?? "",
        nome: info?.nome ?? sid,
        it_referencia: info?.it_referencia ?? "",
        descricao: info?.descricao ?? "",
      };
    });
}

export type TipoProcesso = "PTS" | "PROJETO_TECNICO";

/**
 * @deprecated Esta função usa um critério de altura (≤ 6m) que NÃO existe
 * na norma real (IT-42/2024). O critério correto é "até 750 m² de área
 * construída com no máximo 3 PAVIMENTOS", além de outros requisitos
 * cumulativos (subsolo, GLP, líquidos inflamáveis, produtos perigosos, etc).
 * Use `validatePTS` em src/lib/classification/validatePTS.ts, que implementa
 * os critérios reais do item 5.1 da IT-42/2024. Mantida apenas por
 * compatibilidade; não usar em código novo.
 */
export function definirTipoProcesso(params: {
  area_construida: number;
  altura: number;
  grupo: string;
  divisao: string;
}): {
  tipo: TipoProcesso;
  descricao: string;
  justificativa: string;
  norma_referencia: string;
} {
  const { area_construida, altura, grupo, divisao } = params;

  const gruposExcluidos = ["F", "H"];
  const divisoesExcluidas = ["I-3"];

  if (
    area_construida <= 750 &&
    altura <= 6 &&
    !gruposExcluidos.includes(grupo.toUpperCase()) &&
    !divisoesExcluidas.includes(divisao.toUpperCase())
  ) {
    return {
      tipo: "PTS",
      descricao: "Processo Técnico Simplificado",
      justificativa: `Edificação com área ${area_construida} m² (≤ 750 m²) e altura ${altura} m (≤ 6 m), grupo ${grupo}`,
      norma_referencia: "IT-01 CBMBA",
    };
  }

  return {
    tipo: "PROJETO_TECNICO",
    descricao: "Projeto Técnico Completo",
    justificativa: `Edificação com área ${area_construida} m² e/ou altura ${altura} m e/ou grupo ${grupo} excede os limites do PTS`,
    norma_referencia: "IT-01 CBMBA",
  };
}
