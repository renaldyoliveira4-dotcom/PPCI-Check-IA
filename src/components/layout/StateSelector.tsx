"use client";

import { useState, useRef, useEffect } from "react";
import { Check, MapPin, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Estados do Brasil com info de cobertura.
 * Bahia ativa (CBMBA). Outros: "em breve" — UI mostra mas não permite trocar.
 */
const STATES = [
  { code: "BA", name: "Bahia", corpsName: "CBMBA", active: true },
  { code: "SP", name: "São Paulo", corpsName: "CBPMSP", active: false },
  { code: "RJ", name: "Rio de Janeiro", corpsName: "CBMERJ", active: false },
  { code: "MG", name: "Minas Gerais", corpsName: "CBMMG", active: false },
  { code: "PR", name: "Paraná", corpsName: "CBPR", active: false },
  { code: "RS", name: "Rio Grande do Sul", corpsName: "CBMRS", active: false },
  { code: "SC", name: "Santa Catarina", corpsName: "CBMSC", active: false },
  { code: "PE", name: "Pernambuco", corpsName: "CBMPE", active: false },
  { code: "CE", name: "Ceará", corpsName: "CBMCE", active: false },
  { code: "DF", name: "Distrito Federal", corpsName: "CBMDF", active: false },
  { code: "GO", name: "Goiás", corpsName: "CBMGO", active: false },
  { code: "ES", name: "Espírito Santo", corpsName: "CBMES", active: false },
] as const;

interface StateSelectorProps {
  currentState: string;
}

export function StateSelector({ currentState }: StateSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current =
    STATES.find((s) => s.code === currentState.toUpperCase()) ?? STATES[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-2.5 py-1.5 text-sm font-medium text-navy-900 transition-colors hover:border-navy-200 hover:bg-navy-50"
        aria-label={`Estado atual: ${current.name}. Clique para trocar.`}
        title={`Análise baseada nas ITs do ${current.corpsName}`}
      >
        <FlagPill code={current.code} />
        <span className="hidden sm:inline">{current.name}</span>
        <span className="sm:hidden">{current.code}</span>
        <svg
          className={cn(
            "h-3 w-3 text-navy-500 transition-transform",
            open && "rotate-180"
          )}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50/50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">
                Estado da análise
              </p>
              <p className="text-xs text-navy-500">
                A IA aplicará as ITs do estado selecionado
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-navy-400 hover:bg-white hover:text-navy-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {STATES.map((s) => {
              const isActive = s.code === current.code;
              const isAvailable = s.active;
              return (
                <button
                  key={s.code}
                  type="button"
                  disabled={!isAvailable}
                  onClick={async () => {
                    if (!isAvailable || isActive) return;
                    const supabase = createClient();
                    await supabase
                      .from("users")
                      .update({ active_state: s.code })
                      .eq(
                        "id",
                        (await supabase.auth.getUser()).data.user?.id ?? ""
                      );
                    setOpen(false);
                    window.location.reload();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isAvailable && !isActive && "hover:bg-navy-50",
                    isActive && "bg-ember-50",
                    !isAvailable && "cursor-not-allowed opacity-60"
                  )}
                >
                  <FlagPill code={s.code} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900">
                      {s.name}
                    </p>
                    <p className="text-xs text-navy-500">{s.corpsName}</p>
                  </div>
                  {isActive ? (
                    <Check className="h-4 w-4 text-ember-600" />
                  ) : !isAvailable ? (
                    <span className="rounded-md bg-navy-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                      Em breve
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="border-t border-navy-100 bg-navy-50/50 px-4 py-2.5 text-xs text-navy-500">
            <MapPin className="mr-1 inline h-3 w-3" />
            Estamos expandindo para outros estados. Em breve!
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * "Bandeira" estilizada — bloco com a sigla do estado em cor temática.
 * Visualmente lembra uma bandeira sem precisar carregar imagens.
 */
function FlagPill({ code }: { code: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    BA: { bg: "bg-red-500", text: "text-white" },
    SP: { bg: "bg-black", text: "text-white" },
    RJ: { bg: "bg-blue-700", text: "text-white" },
    MG: { bg: "bg-red-700", text: "text-yellow-300" },
    PR: { bg: "bg-green-700", text: "text-white" },
    RS: { bg: "bg-yellow-400", text: "text-red-700" },
    SC: { bg: "bg-red-600", text: "text-white" },
    PE: { bg: "bg-blue-600", text: "text-yellow-300" },
    CE: { bg: "bg-green-600", text: "text-white" },
    DF: { bg: "bg-blue-900", text: "text-white" },
    GO: { bg: "bg-green-500", text: "text-white" },
    ES: { bg: "bg-blue-500", text: "text-white" },
  };
  const c = colors[code] ?? { bg: "bg-navy-700", text: "text-white" };
  return (
    <span
      className={cn(
        "inline-flex h-5 w-7 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold leading-none tracking-wider shadow-sm",
        c.bg,
        c.text
      )}
      aria-hidden
    >
      {code}
    </span>
  );
}
