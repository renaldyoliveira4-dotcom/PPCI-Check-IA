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
};

function item(
  partial: Omit<ChecklistNormativoItem, "exigido" | "motivo">,
  motivo: string,
  exigido = true
): ChecklistNormativoItem {
  return { ...partial, exigido, motivo };
}

/** IT-22 — Hidrantes e mangotinhos (área > 750 m²) */
export function regra_hidrantes(
  p: ProjectSnapshot
): ChecklistNormativoItem | null {
  if (p.area_construida <= 750) return null;
  return item(
    {
      id: "IT22-hidrantes",
      sistema: "Hidrantes e mangotinhos",
      norma: "IT-22",
      item_normativo: "IT-22/2016 · Seções 4 e 5",
      titulo: "Sistema de hidrantes e mangotinhos",
      descricao:
        "Área > 750 m² exige verificação do sistema de hidrantes/mangotinhos. Verificar rede, prumadas, abrigos, RTI, bomba e caminhamento conforme IT-22/2016 CBMBA.",
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
        "cálculo da Reserva Técnica de Incêndio (RTI)",
        "vazão e pressão mínimas",
        "tipo de sistema (Tipo 1, 2 ou 3)",
        "potência da bomba de incêndio",
        "material e diâmetro das tubulações",
      ],
      palavras_chave: [
        "hidrante",
        "mangotinho",
        "rti",
        "reserva técnica",
        "bomba",
        "abrigo",
        "caixa de incêndio",
        "prumada",
      ],
    },
    `Área construída (${p.area_construida} m²) > 750 m² — IT-22 exige sistema de hidrantes/mangotinhos`
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
