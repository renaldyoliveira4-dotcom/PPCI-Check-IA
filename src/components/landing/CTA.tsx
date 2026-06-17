import Link from "next/link";
import { Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-navy-900 px-8 py-14 text-center sm:px-14">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5 text-ember-400" />
            Sem cartão de crédito
          </div>

          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Comece com 10 tokens grátis
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Teste o PPCI Check IA com seus próprios projetos. Você pode usar
            os tokens em análises simples, completas ou até testar projetos
            maiores conforme o consumo de tokens.
          </p>

          <Link href="/cadastro" className="mt-8 inline-block">
            <button className="rounded-lg bg-gradient-to-r from-ember-500 to-ember-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-ember-900/30 transition-colors hover:from-ember-600 hover:to-ember-700">
              Analisar meu primeiro projeto
            </button>
          </Link>

          <p className="mt-4 text-sm text-white/50">
            Depois, continue no plano de lançamento por R$ 29,90/mês com 30
            tokens mensais.
          </p>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-navy-400">
          Esta ferramenta realiza pré-análise automatizada de apoio técnico.
          O resultado não substitui a responsabilidade do profissional
          habilitado nem garante aprovação pelo CBMBA.
        </p>
      </div>
    </section>
  );
}
