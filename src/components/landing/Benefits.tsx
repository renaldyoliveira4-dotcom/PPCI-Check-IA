import {
  ListChecks,
  FileSearch,
  AlertTriangle,
  ClipboardList,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const benefits = [
  {
    icon: ListChecks,
    title: "Checklist baseado nas ITs da Bahia",
    description:
      "O sistema ajuda a organizar os principais itens exigidos nas normas do CBMBA.",
  },
  {
    icon: FileSearch,
    title: "Análise de planta e memorial",
    description:
      "A IA confronta informações do projeto, memorial descritivo e pranchas enviadas.",
  },
  {
    icon: AlertTriangle,
    title: "Pendências e divergências",
    description:
      "Receba alertas sobre informações ausentes, inconsistentes ou que precisam de revisão.",
  },
  {
    icon: ClipboardList,
    title: "Relatório de pré-análise",
    description:
      "Gere um relatório objetivo para revisar o projeto antes de protocolar.",
  },
  {
    icon: MapPin,
    title: "Foco em PPCI na Bahia",
    description:
      "Pensado para arquitetos, engenheiros, técnicos e projetistas que atuam com PPCI no estado da Bahia.",
  },
  {
    icon: ShieldCheck,
    title: "Mais segurança na conferência",
    description:
      "Reduza o risco de esquecer itens importantes antes do envio ao Corpo de Bombeiros.",
  },
];

export function Benefits() {
  return (
    <section className="bg-navy-900 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-md text-white">
            Evite retrabalho antes do protocolo
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/[0.08]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-ember-500/15 text-ember-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-white">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
