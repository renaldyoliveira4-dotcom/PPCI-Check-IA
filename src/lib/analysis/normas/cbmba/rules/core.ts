/**
 * Regras core — aplicáveis a TODAS as edificações.
 * TAREFA 6 — src/lib/analysis/normas/cbmba/rules/core.ts
 *
 * IT de referência: IT-11, IT-18, IT-20, IT-21, IT-04
 * Mapeamento correto:
 * IT-04 = Símbolos gráficos (NÃO extintores)
 * IT-11 = Saídas de emergência
 * IT-18 = Iluminação de emergência
 * IT-20 = Sinalização de emergência
 * IT-21 = Extintores (NÃO sinalização)
 */

import type { ChecklistNormativoItem } from "../../../checklist";

/** Itens obrigatórios para TODAS as edificações */
export const REGRAS_CORE: Omit<ChecklistNormativoItem, "exigido" | "motivo">[] =
  [
    {
      id: "IT21-extintores",
      sistema: "Extintores de incêndio",
      norma: "IT-21",
      item_normativo: "IT-21/2017 · Seções 4 e 5",
      titulo: "Extintores portáteis e sobre rodas",
      descricao:
        "Verificar distribuição dos extintores na planta, tipo (pó ABC, CO2, água), capacidade extintora, sinalização e acessibilidade conforme IT-21/2017 CBMBA.",
      severidade: "critica",
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
      palavras_chave: [
        "extintor",
        "portátil",
        "sobre rodas",
        "pó abc",
        "co2",
        "capacidade extintora",
        "cobertura",
        "caminhamento",
      ],
    },
    {
      id: "IT11-saidas",
      sistema: "Saídas de emergência",
      norma: "IT-11",
      item_normativo: "IT-11/2016 · Seções 5, 6 e 7",
      titulo: "Saídas de emergência — dimensionamento e disposição",
      descricao:
        "Verificar número mínimo de saídas, largura de portas e corredores, distância máxima de caminhamento, escada, sentido de abertura das portas e identificação de rotas de fuga conforme IT-11/2016 CBMBA.",
      severidade: "critica",
      verificar_na_planta: [
        "número de saídas de emergência",
        "largura das portas (mínimo 0,90m populações pequenas)",
        "largura de corredores e descargas",
        "escada de emergência e tipo (comum, EP, PF)",
        "sentido de abertura das portas de emergência",
        "distância de caminhamento até saída",
        "seta de rota de fuga",
      ],
      verificar_no_memorial: [
        "cálculo de lotação do pavimento",
        "dimensionamento de larguras",
        "justificativa do tipo de escada",
        "distância máxima de caminhamento",
      ],
      palavras_chave: [
        "saída",
        "emergência",
        "porta",
        "corredor",
        "escada",
        "largura",
        "lotação",
        "caminhamento",
        "rota",
        "fuga",
        "descarga",
      ],
    },
    {
      id: "IT18-iluminacao",
      sistema: "Iluminação de emergência",
      norma: "IT-18",
      item_normativo: "IT-18/2017 · Seção 4",
      titulo: "Sistema de iluminação de emergência",
      descricao:
        "Verificar representação do sistema de iluminação de emergência na planta: luminárias autônomas ou centralizadas, cobertura de rotas de fuga, saídas, escadas e áreas de risco conforme IT-18/2017 CBMBA.",
      severidade: "alta",
      verificar_na_planta: [
        "símbolo de luminária de emergência conforme IT-04",
        "cobertura das rotas de fuga",
        "iluminação de escada de emergência",
        "iluminação de saídas e descargas",
        "autonomia mínima de 1 hora indicada em legenda",
      ],
      verificar_no_memorial: [
        "tipo do sistema: autônomo ou centralizado",
        "autonomia mínima (1 hora)",
        "nível de iluminamento (mín 30 lux nas rotas)",
      ],
      palavras_chave: [
        "iluminação",
        "emergência",
        "luminária",
        "autônoma",
        "autonomia",
        "lux",
        "rota",
        "escada",
      ],
    },
    {
      id: "IT20-sinalizacao",
      sistema: "Sinalização de emergência",
      norma: "IT-20",
      item_normativo: "IT-20/2017 · Seção 4",
      titulo: "Sinalização de emergência",
      descricao:
        "Verificar sinalização de proibição, alerta, orientação e emergência nas plantas conforme IT-20/2017 CBMBA: saídas, extintores, hidrantes, proibição de uso de elevadores etc.",
      severidade: "alta",
      verificar_na_planta: [
        "placas de saída de emergência",
        "setas de orientação de rota de fuga",
        "sinalização de extintores",
        "sinalização de hidrantes (se houver)",
        "sinais de alerta e proibição",
        "representados com símbolos conforme IT-04",
      ],
      verificar_no_memorial: [
        "lista de placas e quantitativos",
        "referência à IT-20/2017",
        "material das placas (fotoluminescente ou iluminado)",
      ],
      palavras_chave: [
        "sinalização",
        "placa",
        "saída",
        "rota",
        "fuga",
        "fotoluminescente",
        "emergência",
        "orientação",
      ],
    },
    {
      id: "IT04-simbolos",
      sistema: "Símbolos gráficos e legenda",
      norma: "IT-04",
      item_normativo: "IT-04/2016",
      titulo: "Símbolos gráficos conforme IT-04",
      descricao:
        "Verificar se a planta usa a simbologia oficial do CBMBA (IT-04/2016) para representar os sistemas de combate a incêndio, e se há legenda completa identificando todos os símbolos utilizados.",
      severidade: "media",
      verificar_na_planta: [
        "legenda com todos os símbolos utilizados",
        "símbolos padronizados conforme IT-04",
        "identificação de cada sistema representado",
        "quadro de áreas com área construída PCI",
      ],
      verificar_no_memorial: ["referência à IT-04/2016 na documentação"],
      palavras_chave: [
        "símbolo",
        "legenda",
        "gráfico",
        "representação",
        "padronizado",
        "quadro",
        "áreas",
      ],
    },
  ];
