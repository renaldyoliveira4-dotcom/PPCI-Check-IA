import Link from "next/link";
import { Check, Sparkles, Coins, Crown } from "lucide-react";
import { TOKEN_PACKAGES } from "@/lib/billing/packages";

const BENEFICIOS_COMUNS = [
  "Análise completa com checklist normativo",
  "Conferência com Decreto 16.302/2015 e normas CBMBA/BA",
  "Upload de plantas em PDF e memorial descritivo",
  "Relatório completo de pré-análise em PDF",
];

export function Pricing() {
  return (
    <section id="planos" className="bg-navy-50/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-md text-navy-900">
            Planos e tokens
          </h2>
          <p className="mt-3 text-navy-600">
            Comece grátis e escolha um pacote quando precisar de mais
            análises.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-4">
          {/* Plano Gratuito */}
          <div className="rounded-2xl border border-navy-100 bg-white p-7 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-navy-900">
              Plano Gratuito
            </h3>
            <p className="mt-1 text-sm text-navy-500">
              Teste o PPCI Check IA antes de comprar.
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
                "10 tokens grátis, uma vez por conta",
                "Equivalente a até 10 análises simples",
                "Sem cartão de crédito",
                "Upload de plantas em PDF",
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
              <p>Projetos maiores podem consumir mais tokens.</p>
            </div>
          </div>

          {/* Pacotes reais (avulso + 2 assinaturas) */}
          {TOKEN_PACKAGES.map((p) => {
            const checkoutUrl = p.checkoutUrl;
            const isPro = p.id === "assinatura_pro_60";

            return (
              <div
                key={p.id}
                className={
                  p.highlight
                    ? "relative rounded-2xl border-2 border-ember-500 bg-white p-7 shadow-xl shadow-ember-900/5"
                    : "relative rounded-2xl border border-navy-100 bg-white p-7 shadow-sm"
                }
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ember-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
                    Mais popular
                  </div>
                )}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-ember-500 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-ember-600 shadow">
                    Melhor preço
                  </div>
                )}

                <h3 className="font-display text-lg font-semibold text-navy-900">
                  {p.kind === "assinatura" ? "Assinatura" : "Pacote Avulso"}
                </h3>
                <p className="mt-1 text-sm text-navy-500">{p.description}</p>

                <div className="my-6">
                  <span className="font-display text-4xl font-bold text-navy-900">
                    R$ {p.priceBRL.toFixed(2).replace(".", ",")}
                  </span>
                  {p.kind === "assinatura" && (
                    <span className="text-navy-500">/mês</span>
                  )}
                </div>

                <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-ember-50 px-3 py-1 text-xs font-semibold text-ember-700">
                  {isPro ? (
                    <Crown className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {p.tokens} tokens{p.kind === "assinatura" ? "/mês" : ""}
                </div>

                <ul className="space-y-2.5 text-sm text-navy-700">
                  {BENEFICIOS_COMUNS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-500" />
                      {item}
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-500" />
                    {p.kind === "assinatura"
                      ? "Renovação automática mensal · cancele quando quiser"
                      : "Compra única, sem recorrência"}
                  </li>
                </ul>

                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-7 block">
                  <button
                    className={
                      p.highlight
                        ? "w-full rounded-lg bg-gradient-to-r from-ember-500 to-ember-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:from-ember-600 hover:to-ember-700"
                        : "w-full rounded-lg border border-navy-200 bg-white py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-50"
                    }
                  >
                    {p.kind === "assinatura" ? "Assinar agora" : "Comprar agora"}
                  </button>
                </a>

                <p className="mt-4 text-xs text-navy-400">
                  R$ {p.pricePerTokenBRL.toFixed(2).replace(".", ",")} por token.
                </p>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-navy-400">
          Pagamento processado de forma segura pela Kiwify. Tokens liberados
          automaticamente após confirmação do pagamento. Garantia de 7 dias.
        </p>
      </div>
    </section>
  );
}
