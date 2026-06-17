import Link from "next/link";
import { Check, Sparkles, Coins } from "lucide-react";

export function Pricing() {
  return (
    <section id="planos" className="bg-navy-50/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-md text-navy-900">
            Planos e tokens
          </h2>
          <p className="mt-3 text-navy-600">
            Comece grátis e continue no plano de lançamento quando precisar
            de mais análises.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Plano Gratuito */}
          <div className="rounded-2xl border border-navy-100 bg-white p-7 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-navy-900">
              Plano Gratuito
            </h3>
            <p className="mt-1 text-sm text-navy-500">
              Teste o PPCI Check IA com seus próprios projetos antes de
              assinar.
            </p>

            <div className="my-6">
              <span className="font-display text-4xl font-bold text-navy-900">
                R$ 0,00
              </span>
            </div>

            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-status-ok-bg px-3 py-1 text-xs font-semibold text-status-ok">
              <Coins className="h-3.5 w-3.5" />
              10 tokens grátis
            </div>

            <ul className="space-y-2.5 text-sm text-navy-700">
              {[
                "10 tokens grátis",
                "Equivalente a até 10 análises simples",
                "Permite testar até 2 projetos grandes, dependendo da complexidade",
                "Sem cartão de crédito",
                "Upload de plantas em PDF",
                "Até 3 pranchas por análise simples",
                "Relatório básico de pré-análise",
                "Ideal para testar a plataforma",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-ok" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/cadastro" className="mt-7 block">
              <button className="w-full rounded-lg border border-navy-200 bg-white py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-50">
                Testar grátis
              </button>
            </Link>

            <div className="mt-4 space-y-1 text-xs text-navy-400">
              <p>Cada análise simples consome 1 token.</p>
              <p>
                Projetos maiores podem consumir mais tokens conforme
                quantidade de pranchas e complexidade.
              </p>
              <p>Os 10 tokens gratuitos são liberados uma única vez por conta.</p>
            </div>
          </div>

          {/* Plano de Lançamento */}
          <div className="relative rounded-2xl border-2 border-ember-500 bg-white p-7 shadow-xl shadow-ember-900/5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ember-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
              Valor de lançamento
            </div>

            <h3 className="font-display text-lg font-semibold text-navy-900">
              Plano de Lançamento
            </h3>
            <p className="mt-1 text-sm text-navy-500">
              Valor promocional para os primeiros usuários validarem a
              plataforma.
            </p>

            <div className="my-6">
              <span className="font-display text-4xl font-bold text-navy-900">
                R$ 29,90
              </span>
              <span className="text-navy-500">/mês</span>
            </div>

            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-ember-50 px-3 py-1 text-xs font-semibold text-ember-700">
              <Sparkles className="h-3.5 w-3.5" />
              30 tokens mensais
            </div>

            <ul className="space-y-2.5 text-sm text-navy-700">
              {[
                "30 tokens por mês",
                "Cada análise simples consome 1 token",
                "Upload de plantas em PDF",
                "Até 8 pranchas por análise completa",
                "Upload de memorial descritivo",
                "Checklist normativo",
                "Relatório completo de pré-análise",
                "Histórico de projetos",
                "Suporte inicial para usuários de lançamento",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-500" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/cadastro" className="mt-7 block">
              <button className="w-full rounded-lg bg-gradient-to-r from-ember-500 to-ember-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-ember-600 hover:to-ember-700">
                Começar agora
              </button>
            </Link>

            <div className="mt-4 space-y-1 text-xs text-navy-400">
              <p>
                Preço promocional por tempo limitado. O valor poderá ser
                reajustado conforme evolução da plataforma.
              </p>
              <p>
                Análises maiores ou com muitas pranchas poderão consumir mais
                tokens conforme a complexidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
