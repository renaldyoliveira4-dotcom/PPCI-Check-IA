/**
 * NORMAS — Classificação de Risco de Incêndio
 * Baseado na IT-01 e IT-14 do CBMBA
 */

export type NivelRisco = "LEVE" | "MODERADO" | "ELEVADO" | "INDETERMINADO";

export interface FaixaRisco {
  carga_incendio_min: number;
  carga_incendio_max: number;
  descricao: string;
  exemplos: string;
  classe_incendio_predominante: string;
}

export const FAIXAS_RISCO: Record<Exclude<NivelRisco, "INDETERMINADO">, FaixaRisco> = {
  LEVE: {
    carga_incendio_min: 0,
    carga_incendio_max: 300,
    descricao: "Risco Leve (Classe A)",
    exemplos: "Residências, escritórios, escolas, hospitais, igrejas",
    classe_incendio_predominante: "A",
  },
  MODERADO: {
    carga_incendio_min: 301,
    carga_incendio_max: 1200,
    descricao: "Risco Moderado (Classe A e B)",
    exemplos: "Comércio, indústria leve, marcenarias, oficinas",
    classe_incendio_predominante: "A/B",
  },
  ELEVADO: {
    carga_incendio_min: 1201,
    carga_incendio_max: 99999,
    descricao: "Risco Elevado (Classe A, B e C)",
    exemplos: "Refinarias, depósitos de combustíveis, fábricas de tintas",
    classe_incendio_predominante: "A/B/C",
  },
};

export interface ClasseIncendio {
  descricao: string;
  agentes_extintores: string[];
}

export const CLASSES_INCENDIO: Record<string, ClasseIncendio> = {
  A: {
    descricao:
      "Materiais sólidos combustíveis (madeira, papel, tecido, borracha, plásticos)",
    agentes_extintores: ["Água", "Espuma", "Pó químico ABC"],
  },
  B: {
    descricao: "Líquidos inflamáveis e combustíveis, gases inflamáveis e graxas",
    agentes_extintores: ["Espuma", "Pó químico BC", "Pó químico ABC", "CO2"],
  },
  C: {
    descricao: "Equipamentos elétricos energizados",
    agentes_extintores: ["Pó químico BC", "Pó químico ABC", "CO2"],
  },
  D: {
    descricao:
      "Metais combustíveis (magnésio, titânio, zircônio, sódio, potássio, lítio)",
    agentes_extintores: ["Pó químico especial"],
  },
  K: {
    descricao: "Óleos e gorduras em cozinhas industriais e comerciais",
    agentes_extintores: ["Agente úmido (acetato de potássio)"],
  },
};

export function classificarRisco(cargaIncendio: number) {
  for (const [nivel, faixa] of Object.entries(FAIXAS_RISCO)) {
    if (
      cargaIncendio >= faixa.carga_incendio_min &&
      cargaIncendio <= faixa.carga_incendio_max
    ) {
      return {
        nivel: nivel as NivelRisco,
        descricao: faixa.descricao,
        classe_predominante: faixa.classe_incendio_predominante,
        carga_incendio_informada: cargaIncendio,
        norma_referencia: "IT-01 / IT-14 CBMBA",
      };
    }
  }
  return {
    nivel: "INDETERMINADO" as NivelRisco,
    descricao: "Carga de incêndio fora das faixas definidas",
    carga_incendio_informada: cargaIncendio,
  };
}
