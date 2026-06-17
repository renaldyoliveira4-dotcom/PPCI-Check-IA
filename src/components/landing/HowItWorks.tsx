import { FolderPlus, FileUp, Cpu, FileCheck2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FolderPlus,
    title: "Cadastre seu projeto",
    description:
      "Informe os dados básicos do projeto e avance para o envio dos arquivos.",
  },
  {
    number: "02",
    icon: FileUp,
    title: "Envie planta e memorial",
    description:
      "Faça upload das pranchas em PDF e, se tiver, do memorial descritivo.",
  },
  {
    number: "03",
    icon: Cpu,
    title: "A IA faz a pré-análise",
    description:
      "O sistema verifica pendências, divergências e itens do checklist normativo.",
  },
  {
    number: "04",
    icon: FileCheck2,
    title: "Receba o relatório",
    description:
      "Veja o resultado da análise e revise o projeto antes do protocolo.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-navy-100 bg-navy-50/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-md text-navy-900">
            Como funciona
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-bold text-navy-200">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-navy-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-navy-500">
          Cada análise simples consome 1 token. Projetos maiores podem
          consumir mais tokens conforme quantidade de pranchas e complexidade.
        </p>
      </div>
    </section>
  );
}
