// =====================================================
// Tipos do banco de dados
// =====================================================

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "business";
  tokens: number;
  tokens_used: number;
  active_state: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type TokenTransactionReason =
  | "signup_bonus"
  | "purchase"
  | "analysis_consumption"
  | "refund"
  | "manual_adjustment";

export type TokenTransaction = {
  id: string;
  user_id: string;
  amount: number;
  reason: TokenTransactionReason;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};

export type ProjectStatus =
  | "draft"
  | "uploaded"
  | "analyzing"
  | "completed"
  | "archived";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  client_name: string | null;
  city: string | null;
  state: string | null;
  occupancy_type: string | null;
  built_area: number | null;
  floors: number | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  storage_path: string;
  uploaded_at: string;
};

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export type StatusAprovacao =
  | "Apto a protocolar"
  | "Apto com ressalvas"
  | "Requer correções"
  | "Reprovado";

export type ConfiancaNivel = "alta" | "media" | "baixa" | "pendente";

export type Analysis = {
  id: string;
  project_id: string;
  score: number;
  summary: string | null;
  status: AnalysisStatus;
  total_items: number;
  conforming_items: number;
  warning_items: number;
  non_conforming_items: number;
  created_at: string;
  completed_at: string | null;
  // Campos da IA
  nota: number | null;
  status_aprovacao: StatusAprovacao | null;
  confianca_geral: ConfiancaNivel | null;
  grupo_ocupacao: string | null;
  divisao_ocupacao: string | null;
  risco_nivel: string | null;
  tipo_processo: string | null;
  area_total_detectada: string | null;
  numero_pavimentos_detectado: number | null;
  enquadramento_correto: boolean | null;
  divergencias: string[] | null;
  pendencias: string[] | null;
  encontrados: Encontrado[] | null;
  ai_meta: {
    model?: string;
    input_tokens?: number;
    output_tokens?: number;
    arquivos?: string[];
    memorial?: string | null;
  } | null;
};

export type Encontrado = {
  campo: string;
  valor: string;
  confianca?: ConfiancaNivel;
  origem?: string;
  fonte?: string;
};

export type ItemStatus = "conforme" | "atencao" | "nao_conforme";
export type RiskLevel = "baixo" | "medio" | "alto";
export type ItemType = "sistema" | "divergencia" | "pendencia" | "encontrado";

export type AnalysisItem = {
  id: string;
  analysis_id: string;
  category: string;
  status: ItemStatus;
  description: string;
  recommendation: string | null;
  normative_reference: string | null;
  risk_level: RiskLevel;
  order_index: number;
  created_at: string;
  item_type: ItemType;
};

export type Normative = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  scope: string | null;
  state: string | null;
  created_at: string;
};

// =====================================================
// Tipos auxiliares
// =====================================================

export type ProjectFormData = {
  name: string;
  client_name: string;
  city: string;
  state: string;
  occupancy_type: string;
  built_area: number;
  floors: number;
};

export type DashboardStats = {
  total_projects: number;
  total_analyses: number;
  pending_issues: number;
  recent_projects: Project[];
};

// =====================================================
// Constantes
// =====================================================

export const OCCUPANCY_TYPES = [
  { code: "A", label: "A - Residencial" },
  { code: "B", label: "B - Serviços de hospedagem" },
  { code: "C", label: "C - Comercial" },
  { code: "D", label: "D - Serviços profissionais" },
  { code: "E", label: "E - Educacional" },
  { code: "F", label: "F - Reunião de público" },
  { code: "G", label: "G - Serviços automotivos" },
  { code: "H", label: "H - Serviços de saúde" },
  { code: "I", label: "I - Industrial" },
  { code: "J", label: "J - Depósito" },
  { code: "L", label: "L - Explosivos" },
  { code: "M", label: "M - Especial" },
];

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const ANALYSIS_CATEGORIES = [
  "Ocupação",
  "Área construída",
  "Saídas de emergência",
  "Largura de portas",
  "Escadas",
  "Extintores",
  "Sinalização de emergência",
  "Iluminação de emergência",
  "Hidrantes",
  "Alarme de incêndio",
  "Documentação obrigatória",
  "Memorial descritivo",
] as const;
