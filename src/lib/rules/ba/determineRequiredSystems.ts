/**
 * Motor universal de exigências de medidas de segurança contra incêndio.
 *
 * REGRA FUNDAMENTAL (não negociável): a única fonte de obrigatoriedade de
 * qualquer sistema é a matriz normativa em
 * src/data/ba/requiredSystemsMatrix.ts (Tabela 5, Tabelas 6A-6M, Tabela 7,
 * todas do Decreto Estadual nº 16.302/2015). As Instruções Técnicas
 * específicas (IT-22, IT-21, IT-11, IT-18, IT-20, etc.) NUNCA decidem se um
 * sistema é exigido — elas só dimensionam o sistema DEPOIS que esta matriz
 * já determinou que ele é obrigatório (ver applySpecificIT.ts).
 *
 * Lógica de escolha de tabela (nunca pular etapas):
 *  1. Validar grupo e divisão (vêm de occupancyDivisions.ts).
 *  2. Validar área, altura e pavimentos.
 *  3. Validar processo (vem de validateProcessType.ts).
 *  4. Verificar subsolo (Tabela 7, quando aplicável).
 *  5. Verificar riscos especiais (validateSpecialRisks.ts).
 *  6. Escolher tabela: Tabela 5 (área<=750 E altura<=12) OU Tabela 6
 *     correspondente (área>750 OU altura>12) OU tabela específica de M.
 *  7. Retornar sistemas exigidos/não exigidos/pendentes.
 */

import {
  findMatrixEntry,
  getTabela5Requirements,
  mapHeightToBand,
  mapExtensionToBand,
  ALL_SYSTEMS,
  type SystemName,
  type SystemCell,
} from "@/data/ba/requiredSystemsMatrix";
import type { ProcessType } from "./validateProcessType";

export type RequirementStatus =
  | "REQUIRED"
  | "NOT_REQUIRED"
  | "PENDING"
  | "NOT_APPLICABLE"
  | "REVIEW_REQUIRED";

export interface SystemRequirement {
  system: string;
  required: boolean;
  status: RequirementStatus;
  severity: "none" | "info" | "warning" | "critical";
  reason: string;
  normativeBasis: string[];
  notes?: string[];
  missingData?: string[];
  recommendation?: string;
}

export interface DetermineRequiredSystemsInput {
  group: string;
  division: string;
  areaM2: number;
  heightM?: number;
  floors: number;
  processType: ProcessType;
  fireRisk: "Baixo" | "Médio" | "Alto";
  fireLoadMJm2?: number;
  occupantLoad?: number;
  hasSubsoil?: boolean;
  subsoilUse?: string;
  subsoilAreaM2?: number;
  hasSpecialRisks?: boolean;
  specialRisks?: string[];
  isInsideLargerBuilding?: boolean;
  largerBuildingHasValidAVCB?: boolean;
  /** Extensão em metros, exclusivamente para M-1 (túnel) — estrutura por extensão, não por área/altura */
  tunnelExtensionM?: number;
}

export interface DetermineRequiredSystemsResult {
  requiredSystems: SystemRequirement[];
  notRequiredSystems: SystemRequirement[];
  pendingSystems: SystemRequirement[];
  nonCompliantSystems: SystemRequirement[];
  globalWarnings: string[];
  normativeTablesUsed: string[];
  requiredHumanReview: boolean;
}

const TABELA5_LIMITE_AREA = 750;
const TABELA5_LIMITE_ALTURA = 12;

function cellToRequirement(
  system: SystemName,
  cell: SystemCell | undefined,
  tableName: string
): SystemRequirement {
  if (!cell) {
    return {
      system,
      required: false,
      status: "NOT_APPLICABLE",
      severity: "none",
      reason: `Sistema "${system}" não consta em ${tableName} para este enquadramento — não é exigido por esta tabela.`,
      normativeBasis: [tableName],
    };
  }

  return {
    system,
    required: cell.required,
    status: cell.required ? "REQUIRED" : "NOT_REQUIRED",
    severity: cell.required ? "info" : "none",
    reason: cell.required
      ? `Exigido conforme ${tableName}.${cell.note ? ` ${cell.note}` : ""}`
      : `Não exigido conforme ${tableName} para este enquadramento.${cell.note ? ` ${cell.note}` : ""}`,
    normativeBasis: [tableName],
    notes: cell.note ? [cell.note] : undefined,
  };
}

export function determineRequiredSystems(
  input: DetermineRequiredSystemsInput
): DetermineRequiredSystemsResult {
  const globalWarnings: string[] = [];
  const normativeTablesUsed: string[] = [];
  let requiredHumanReview = false;

  const grupo = input.group.toUpperCase().trim();
  const divisao = input.division.toUpperCase().trim();

  const allRequirements: SystemRequirement[] = [];

  // ── 1/2/3. Validação básica de dados essenciais ──────────────────────────
  const missingEssential: string[] = [];
  if (typeof input.areaM2 !== "number" || Number.isNaN(input.areaM2)) {
    missingEssential.push("área construída (m²)");
  }
  if (typeof input.floors !== "number" || Number.isNaN(input.floors)) {
    missingEssential.push("número de pavimentos");
  }

  if (missingEssential.length > 0) {
    globalWarnings.push(
      `Dados essenciais faltando para determinar exigências: ${missingEssential.join(", ")}. ` +
      `Revisão técnica obrigatória — nenhuma exigência foi presumida.`
    );
    return {
      requiredSystems: [],
      notRequiredSystems: [],
      pendingSystems: ALL_SYSTEMS.map((s) => ({
        system: s,
        required: false,
        status: "PENDING" as RequirementStatus,
        severity: "warning" as const,
        reason: "Dados essenciais da edificação não informados.",
        normativeBasis: [],
        missingData: missingEssential,
      })),
      nonCompliantSystems: [],
      globalWarnings,
      normativeTablesUsed: [],
      requiredHumanReview: true,
    };
  }

  const heightM = input.heightM ?? 0;
  const areaExcedeTabela5 = input.areaM2 > TABELA5_LIMITE_AREA;
  const alturaExcedeTabela5 = heightM > TABELA5_LIMITE_ALTURA;
  const usaTabela6 = areaExcedeTabela5 || alturaExcedeTabela5;

  // ── 6. Grupo M sempre usa tabela específica, nunca a regra genérica 5/6 ──
  if (grupo === "M") {
    const entry = findMatrixEntry(grupo, divisao);
    if (!entry) {
      globalWarnings.push(
        `Divisão "${divisao}" do Grupo M não está cadastrada na matriz normativa. ` +
        `Revisão técnica obrigatória — nenhuma exigência foi presumida.`
      );
      return {
        requiredSystems: [],
        notRequiredSystems: [],
        pendingSystems: ALL_SYSTEMS.map((s) => ({
          system: s,
          required: false,
          status: "REVIEW_REQUIRED" as RequirementStatus,
          severity: "warning" as const,
          reason: `Tabela específica do Grupo M para "${divisao}" não cadastrada.`,
          normativeBasis: [],
        })),
        nonCompliantSystems: [],
        globalWarnings,
        normativeTablesUsed: [],
        requiredHumanReview: true,
      };
    }

    normativeTablesUsed.push(entry.table);
    globalWarnings.push(
      `Grupo M (${divisao}) usa estrutura normativa especial (${entry.table}). ` +
      `${entry.generalNotes?.join(" ") ?? ""}`
    );
    requiredHumanReview = true; // Grupo M sempre merece revisão técnica adicional

    if (entry.tunnelExtensionBands && entry.tunnelExtensionBands.length > 0) {
      if (input.tunnelExtensionM === undefined || input.tunnelExtensionM === null) {
        globalWarnings.push(
          "Extensão do túnel (em metros) não foi informada. A Tabela 6M.1 depende da faixa de extensão " +
          "para determinar as exigências — nenhuma faixa foi presumida. Revisão técnica obrigatória."
        );
        for (const system of ALL_SYSTEMS) {
          allRequirements.push({
            system,
            required: false,
            status: "PENDING",
            severity: "warning",
            reason: `Extensão do túnel (m) não informada — não é possível determinar exigência de "${system}" pela ${entry.table} sem esse dado.`,
            normativeBasis: [entry.table],
            missingData: ["Extensão do túnel em metros"],
          });
        }
      } else {
        const bandLabel = mapExtensionToBand(input.tunnelExtensionM);
        const band = entry.tunnelExtensionBands.find((b) => b.label === bandLabel);
        if (band) {
          for (const system of ALL_SYSTEMS) {
            const cell = band.systems[system];
            allRequirements.push(
              cellToRequirement(system, cell, `${entry.table} (extensão: ${band.label}m)`)
            );
          }
        }
        if (bandLabel === "Acima de 1.000") {
          globalWarnings.push("Túneis acima de 1.000m de extensão devem ser regularizados mediante Comissão Técnica.");
        }
      }
    } else if (entry.systems) {
      const band = entry.specialStructure ? undefined : mapHeightToBand(heightM);
      for (const system of ALL_SYSTEMS) {
        const sysReq = entry.systems[system];
        if (!sysReq) continue;
        const cell = band ? sysReq.requiredByHeight[band] : undefined;
        allRequirements.push(cellToRequirement(system, cell, entry.table));
      }
    } else {
      globalWarnings.push(
        `${entry.table} tem estrutura especial (${entry.specialStructure}); exigências detalhadas constam nas notas gerais e exigem leitura manual da tabela. Não é possível montar lista automática de sistemas para esta divisão.`
      );
    }

    return finalizeResult(allRequirements, globalWarnings, normativeTablesUsed, requiredHumanReview, input);
  }

  // ── 6. Camada 1 — Tabela 5 (área<=750 E altura<=12) ──────────────────────
  if (!usaTabela6) {
    const tabela5 = getTabela5Requirements(divisao);
    if (!tabela5) {
      globalWarnings.push(
        `Divisão "${divisao}" não foi encontrada nas colunas da Tabela 5. Revisão técnica obrigatória.`
      );
      requiredHumanReview = true;
    } else {
      normativeTablesUsed.push("Tabela 5");
      for (const system of ALL_SYSTEMS) {
        const cell = tabela5[system];
        allRequirements.push(cellToRequirement(system, cell, "Tabela 5 (área <=750m² e altura <=12m)"));
      }
    }
    return finalizeResult(allRequirements, globalWarnings, normativeTablesUsed, requiredHumanReview, input);
  }

  // ── 6. Camada 2 — Tabela 6 correspondente (área>750 OU altura>12) ────────
  const entry = findMatrixEntry(grupo, divisao);
  if (!entry) {
    globalWarnings.push(
      `Divisão "${divisao}" (Grupo ${grupo}) com área/altura acima do limite da Tabela 5 não está cadastrada ` +
      `em nenhuma Tabela 6 da matriz normativa. "Não foi possível determinar automaticamente. Revisão técnica obrigatória."`
    );
    return {
      requiredSystems: [],
      notRequiredSystems: [],
      pendingSystems: ALL_SYSTEMS.map((s) => ({
        system: s,
        required: false,
        status: "REVIEW_REQUIRED" as RequirementStatus,
        severity: "warning" as const,
        reason: `Tabela 6 para divisão "${divisao}" não cadastrada na matriz.`,
        normativeBasis: [],
      })),
      nonCompliantSystems: [],
      globalWarnings,
      normativeTablesUsed: [],
      requiredHumanReview: true,
    };
  }

  normativeTablesUsed.push(entry.table);
  const reasonTable6 = areaExcedeTabela5
    ? `área de ${input.areaM2}m² > 750m²`
    : `altura de ${heightM}m > 12m`;
  globalWarnings.push(`Aplicada ${entry.table} pois ${reasonTable6} (fora da faixa da Tabela 5).`);

  if (entry.systems) {
    const band = mapHeightToBand(heightM);
    for (const system of ALL_SYSTEMS) {
      const sysReq = entry.systems[system];
      if (!sysReq) continue;
      const cell = sysReq.requiredByHeight[band];
      allRequirements.push(cellToRequirement(system, cell, `${entry.table} (faixa de altura: ${band})`));
    }
  } else {
    globalWarnings.push(
      `${entry.table} tem estrutura especial; exigências detalhadas exigem leitura manual. Revisão técnica recomendada.`
    );
    requiredHumanReview = true;
  }

  return finalizeResult(allRequirements, globalWarnings, normativeTablesUsed, requiredHumanReview, input);
}

function finalizeResult(
  allRequirements: SystemRequirement[],
  globalWarnings: string[],
  normativeTablesUsed: string[],
  requiredHumanReviewSoFar: boolean,
  input: DetermineRequiredSystemsInput
): DetermineRequiredSystemsResult {
  let requiredHumanReview = requiredHumanReviewSoFar;

  // ── 7. Subsolo ocupado → Tabela 7 é um alerta adicional, não substitui a base ──
  if (input.hasSubsoil && input.subsoilUse && input.subsoilUse.toLowerCase() !== "estacionamento") {
    normativeTablesUsed.push("Tabela 7");
    globalWarnings.push(
      "Edificação possui subsolo ocupado por uso diferente de estacionamento. " +
      "Exigências adicionais da Tabela 7 do Decreto 16.302/2015 devem ser verificadas " +
      "(medidas alternativas por faixa de área do subsolo — ver validateSubsoilRules)."
    );
    requiredHumanReview = true;
  }

  // ── 8. Riscos especiais → alerta para IT específica, nunca cria exigência aqui ──
  if (input.hasSpecialRisks && input.specialRisks && input.specialRisks.length > 0) {
    globalWarnings.push(
      `Riscos especiais declarados (${input.specialRisks.join(", ")}) podem acrescentar exigências além da matriz padrão. ` +
      `Consultar IT específica de cada risco (ver validateSpecialRisks).`
    );
    requiredHumanReview = true;
  }

  // ── 10/11. Separar por status; nunca listar NOT_REQUIRED como não conforme ──
  const requiredSystems = allRequirements.filter((r) => r.status === "REQUIRED");
  const notRequiredSystems = allRequirements.filter(
    (r) => r.status === "NOT_REQUIRED" || r.status === "NOT_APPLICABLE"
  );
  const pendingSystems = allRequirements.filter(
    (r) => r.status === "PENDING" || r.status === "REVIEW_REQUIRED"
  );
  // nonCompliantSystems é deixado vazio aqui: conformidade real (sistema ausente/inadequado no
  // projeto) só é avaliada por quem cruza isso com o que o projeto efetivamente apresenta —
  // este motor apenas determina obrigatoriedade, nunca julga conformidade por si só.
  const nonCompliantSystems: SystemRequirement[] = [];

  return {
    requiredSystems,
    notRequiredSystems,
    pendingSystems,
    nonCompliantSystems,
    globalWarnings,
    normativeTablesUsed,
    requiredHumanReview,
  };
}
