import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  const getColor = () => {
    if (clampedValue >= 80) return "bg-status-ok";
    if (clampedValue >= 60) return "bg-status-warn";
    return "bg-status-bad";
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-navy-100",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            getColor()
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex justify-between text-xs">
          <span className="text-navy-500">Conformidade</span>
          <span className="font-semibold text-navy-900">{clampedValue}%</span>
        </div>
      )}
    </div>
  );
}

interface ScoreCircleProps {
  value: number;
  size?: number; // diameter in px
  strokeWidth?: number;
  /** Conteúdo customizado para o centro. Se omitido, mostra "{value}%" + "conformidade". */
  children?: React.ReactNode;
  /** Override de cor (sobrescreve a cor por threshold do value). */
  colorClassName?: string;
}

export function ScoreCircle({
  value,
  size = 160,
  strokeWidth = 12,
  children,
  colorClassName,
}: ScoreCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  const autoColor =
    clamped >= 80
      ? "text-status-ok"
      : clamped >= 60
        ? "text-status-warn"
        : "text-status-bad";
  const color = colorClassName ?? autoColor;

  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="-rotate-90 transform" width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-navy-100"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-1000 ease-out", color)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <>
            <span className="font-display text-3xl font-semibold text-navy-900">
              {clamped}%
            </span>
            <span className="text-xs text-navy-500">conformidade</span>
          </>
        )}
      </div>
    </div>
  );
}
