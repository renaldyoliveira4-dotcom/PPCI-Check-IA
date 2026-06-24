import { Coins, FileText, Layers, Boxes } from "lucide-react";

const planosToken = [
  {
    icon: FileText,
    title: "Análise simples",
    consumo: "Consome 2 tokens",
    items: [
      "Indicada para projeto pequeno",
      "Até 3 pranchas",
      "Relatório básico",
    ],
  },
  {
    icon: Layers,
    title: "Análise completa",
    consumo: "Consome 2 tokens",
    items: [
      "Indicada para projeto com mais pranchas e memorial",
      "Até 8 pranchas",
      "Relatório completo",
    ],
  },
  {
    icon: Boxes,
    title: "Análise grande",
    consumo: "Consome 2 tokens",
    items: [
      "Indicada para projetos maiores",
      "Muitos arquivos",
      "Alta complexidade",
    ],
  },
];

export function Problems() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-ember-50 px-3 py-1 text-xs font-semibold text-ember-700">
            <Coins className="h-3.5 w-3.5" />
            Como funcionam os tokens
          </div>
          <h2 className="font-display text-display-md text-navy-900">
            Você confere seu projeto antes de enviar para análise oficial
          </h2>
          <p className="mt-4 text-navy-600">
            Tokens são créditos usados para realizar pré-análises. Cada
            análise consome 2 tokens, independente do tamanho do projeto.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {planosToken.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-xl border border-navy-100 bg-navy-50/40 p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-navy-900">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-ember-600">
                  {p.consumo}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-navy-600">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-navy-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-navy-500">
          Com o PPCI Check IA, você antecipa possíveis pendências, identifica
          divergências entre planta e memorial e organiza um checklist de
          revisão antes do protocolo. Ideal para reduzir retrabalho e ganhar
          mais segurança na entrega.
        </p>
      </div>
    </section>
  );
}
