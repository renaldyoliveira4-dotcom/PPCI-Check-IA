import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ItemStatus, RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function statusLabel(status: ItemStatus): string {
  const map: Record<ItemStatus, string> = {
    conforme: "Conforme",
    atencao: "Atenção",
    nao_conforme: "Não Conforme",
  };
  return map[status];
}

export function riskLabel(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
  };
  return map[risk];
}

export function statusColor(status: ItemStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const map = {
    conforme: {
      bg: "bg-status-ok-bg",
      text: "text-status-ok",
      border: "border-status-ok/30",
      dot: "bg-status-ok",
    },
    atencao: {
      bg: "bg-status-warn-bg",
      text: "text-status-warn",
      border: "border-status-warn/30",
      dot: "bg-status-warn",
    },
    nao_conforme: {
      bg: "bg-status-bad-bg",
      text: "text-status-bad",
      border: "border-status-bad/30",
      dot: "bg-status-bad",
    },
  } as const;
  return map[status];
}

export function projectStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Rascunho",
    uploaded: "Aguardando análise",
    analyzing: "Em análise",
    completed: "Concluído",
    archived: "Arquivado",
  };
  return map[status] || status;
}
