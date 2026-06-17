import { cn } from "@/lib/utils";
import type { ItemStatus, RiskLevel } from "@/types";

type BadgeVariant = "default" | "orange" | "ember" | "emerald" | "amber" | "red" | "blue" | "violet" | "slate" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:  "bg-slate-100 text-slate-600",
  neutral:  "bg-slate-100 text-slate-600",
  slate:    "bg-slate-100 text-slate-600",
  orange:   "bg-orange-100 text-orange-700",
  ember:    "bg-orange-100 text-orange-700",
  emerald:  "bg-emerald-100 text-emerald-700",
  amber:    "bg-amber-100 text-amber-700",
  red:      "bg-red-100 text-red-700",
  blue:     "bg-blue-100 text-blue-700",
  violet:   "bg-violet-100 text-violet-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const statusConfig: Record<ItemStatus, { label: string; cls: string }> = {
  conforme: { label: "Conforme", cls: "bg-emerald-100 text-emerald-700" },
  atencao: { label: "Atenção", cls: "bg-amber-100 text-amber-700" },
  nao_conforme: { label: "Não conforme", cls: "bg-red-100 text-red-700" },
};

const riskConfig: Record<RiskLevel, { label: string; cls: string }> = {
  baixo: { label: "Risco baixo", cls: "bg-slate-100 text-slate-600" },
  medio: { label: "Risco médio", cls: "bg-amber-100 text-amber-700" },
  alto: { label: "Risco alto", cls: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.atencao;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = riskConfig[level] ?? riskConfig.medio;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}
