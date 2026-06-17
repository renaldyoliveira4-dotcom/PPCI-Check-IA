import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "white";
}

export function Logo({ className, variant = "default" }: LogoProps) {
  const isWhite = variant === "white";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
        <Flame className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
      </div>
      <div>
        <p
          className={cn(
            "text-sm font-bold leading-none tracking-wide",
            isWhite ? "text-white" : "text-slate-800"
          )}
        >
          PPCI Check<span className="text-ember-500"> IA</span>
        </p>
        <p
          className={cn(
            "mt-0.5 text-[10px] uppercase leading-none tracking-wider",
            isWhite ? "text-slate-400" : "text-slate-400"
          )}
        >
          CBMBA
        </p>
      </div>
    </div>
  );
}

