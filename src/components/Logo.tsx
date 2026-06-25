import Link from "next/link";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "white";
  /**
   * Para onde a logo navega ao ser clicada. Padrão: home pública (`/`).
   * Passe `href={null}` para desabilitar o link (ex: quando a logo já está
   * dentro de um <Link> externo, evitando link aninhado).
   */
  href?: string | null;
}

function LogoMark({ className, variant = "default" }: LogoProps) {
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

export function Logo({ className, variant = "default", href = "/" }: LogoProps) {
  if (href === null) {
    return <LogoMark className={className} variant={variant} />;
  }
  return (
    <Link href={href} aria-label="Ir para a página inicial">
      <LogoMark className={className} variant={variant} />
    </Link>
  );
}

