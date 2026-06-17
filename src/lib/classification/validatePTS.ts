/**
 * Validação de elegibilidade ao PTS (Projeto Técnico Simplificado).
 *
 * Fonte normativa: IT-42/2024 CBMBA, item 5.1 — "A edificação deve ser
 * enquadrada nas regras de Projeto Técnico Simplificado (PTS), quando
 * atender aos seguintes requisitos CUMULATIVAMENTE":
 *
 * 5.1.1 Até 750 m² de área construída, com NO MÁXIMO 3 PAVIMENTOS
 *       (não é um limite de altura em metros — é número de pavimentos).
 * 5.1.2 Não possuir subsolo ocupado por reunião de público (Grupo F),
 *       nem qualquer outra ocupação (exceto estacionamento) com área > 50 m².
 * 5.1.3 Lotação máxima de 100 pessoas, quando Grupo F.
 * 5.1.4 GLP revenda: armazenamento até 12.480 kg (960 botijões de 13 kg).
 * 5.1.5 Não armazenar gases inflamáveis em tanques/cilindros (exceto 5.2.3).
 * 5.1.6 Não armazenar líquidos inflamáveis/combustíveis em tanques aéreos.
 * 5.1.7 Não ser posto de abastecimento de combustível.
 * 5.1.8 Não manipular/armazenar produtos perigosos (explosivos, fogos de
 *       artifício, peróxidos orgânicos, oxidantes, tóxicos, radioativos,
 *       corrosivos e outras substâncias perigosas).
 *
 * IMPORTANTE: este módulo NUNCA deve usar "altura em metros" como critério
 * de PTS — a norma real usa NÚMERO DE PAVIMENTOS, não altura.
 */

export interface ValidatePTSInput {
  areaM2: number;
  floors: number;
  grupo: string;
  divisao: string;
  /** Maior área ocupada no subsolo por uso diferente de estacionamento (m²) */
  subsoilNonParkingAreaM2?: number;
  /** Subsolo destinado a reunião de público (Grupo F)? */
  subsoilIsPublicAssembly?: boolean;
  /** Lotação prevista, se Grupo F */
  occupantLoad?: number;
  hasGLP?: boolean;
  /** GLP é revenda (comércio) ou central de consumo próprio? */
  glpIsResale?: boolean;
  glpKg?: number;
  hasFlammableGasTanks?: boolean;
  hasFlammableLiquidsAboveGroundTanks?: boolean;
  isFuelStation?: boolean;
  handlesHazardousMaterials?: boolean;
}

export interface ValidatePTSResult {
  eligible: boolean;
  tipo: "PTS" | "PROJETO_TECNICO";
  descricao: string;
  failedRequirements: string[];
  warnings: string[];
  normaReferencia: string;
}

const GLP_REVENDA_LIMITE_KG = 12480;

export function validatePTS(input: ValidatePTSInput): ValidatePTSResult {
  const failedRequirements: string[] = [];
  const warnings: string[] = [];

  // 5.1.1 — até 750 m² e no máximo 3 pavimentos (NÃO é critério de altura)
  if (input.areaM2 > 750) {
    failedRequirements.push(`Área construída de ${input.areaM2} m² excede o limite de 750 m² (item 5.1.1 da IT-42/2024).`);
  }
  if (input.floors > 3) {
    failedRequirements.push(`Edificação possui ${input.floors} pavimentos, excedendo o limite de 3 pavimentos (item 5.1.1 da IT-42/2024).`);
  }

  // 5.1.2 — subsolo
  if (input.subsoilIsPublicAssembly) {
    failedRequirements.push("Subsolo ocupado por local de reunião de público (Grupo F) não é permitido para PTS, independente da área (item 5.1.2).");
  }
  if (typeof input.subsoilNonParkingAreaM2 === "number" && input.subsoilNonParkingAreaM2 > 50) {
    failedRequirements.push(`Subsolo com ocupação diferente de estacionamento possui ${input.subsoilNonParkingAreaM2} m², excedendo o limite de 50 m² (item 5.1.2).`);
  }

  // 5.1.3 — lotação para Grupo F
  if (input.grupo.toUpperCase() === "F" && typeof input.occupantLoad === "number" && input.occupantLoad > 100) {
    failedRequirements.push(`Lotação de ${input.occupantLoad} pessoas excede o limite de 100 pessoas para Grupo F (item 5.1.3).`);
  }

  // 5.1.4 — GLP revenda
  if (input.hasGLP && input.glpIsResale && typeof input.glpKg === "number" && input.glpKg > GLP_REVENDA_LIMITE_KG) {
    failedRequirements.push(`Armazenamento de GLP para revenda de ${input.glpKg} kg excede o limite de ${GLP_REVENDA_LIMITE_KG} kg / 960 botijões de 13 kg (item 5.1.4).`);
  }

  // 5.1.5 — gases inflamáveis em tanques/cilindros
  if (input.hasFlammableGasTanks) {
    failedRequirements.push("Edificação armazena gases inflamáveis em tanques ou cilindros, o que não é permitido para PTS, salvo exceção específica da norma (item 5.1.5).");
  }

  // 5.1.6 — líquidos inflamáveis/combustíveis em tanques aéreos
  if (input.hasFlammableLiquidsAboveGroundTanks) {
    failedRequirements.push("Edificação armazena líquidos inflamáveis ou combustíveis em tanques aéreos, o que não é permitido para PTS (item 5.1.6).");
  }

  // 5.1.7 — posto de combustível
  if (input.isFuelStation) {
    failedRequirements.push("Posto de abastecimento de combustível não pode ser regularizado por PTS (item 5.1.7).");
  }

  // 5.1.8 — produtos perigosos
  if (input.handlesHazardousMaterials) {
    failedRequirements.push("Edificação manipula ou armazena produtos perigosos à saúde, ao meio ambiente ou ao patrimônio, o que não é permitido para PTS (item 5.1.8).");
  }

  const eligible = failedRequirements.length === 0;

  if (!eligible) {
    return {
      eligible: false,
      tipo: "PROJETO_TECNICO",
      descricao: "Projeto Técnico Completo",
      failedRequirements,
      warnings,
      normaReferencia: "IT-42/2024 CBMBA, item 5.1 (requisitos cumulativos)",
    };
  }

  return {
    eligible: true,
    tipo: "PTS",
    descricao: "Projeto Técnico Simplificado (PTS)",
    failedRequirements: [],
    warnings,
    normaReferencia: "IT-42/2024 CBMBA, item 5.1",
  };
}
