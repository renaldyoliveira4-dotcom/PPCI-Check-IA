import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Sparkles,
  Check,
  TrendingUp,
  Crown,
  Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrackTokensView } from "@/components/analytics/TrackTokensView";
import { CheckoutLink } from "@/components/analytics/CheckoutLink";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { TokenTransaction } from "@/types";
import { TOKEN_PACKAGES, tokensParaAnalises } from "@/lib/billing/packages";

const reasonLabels: Record<string, string> = {
  signup_bonus: "Bônus de boas-vindas",
  purchase: "Compra de pacote",
  analysis_consumption: "Análise realizada",
  refund: "Estorno",
  manual_adjustment: "Ajuste manual",
};

export default async function TokensPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, tokens, tokens_used")
    .eq("id", user.id)
    .single();

  const { data: transactions } = await supabase
    .from("token_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const tokensAtual = profile?.tokens ?? 0;
  const tokensUsados = profile?.tokens_used ?? 0;
  const totalRecebido = tokensAtual + tokensUsados;

  return (
    <AppShell userName={profile?.name} userEmail={profile?.email}>
      <TrackTokensView tokensRestantes={tokensAtual} />
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o dashboard
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-display-md text-navy-900">
          Tokens de análise
        </h1>
        <p className="mt-1 text-navy-600">
          Cada análise consome 2 tokens. Compre pacotes para analisar mais
          projetos.
        </p>
      </div>

      {/* Saldo */}
      <Card className="mb-10 overflow-hidden">
        <div className="grid sm:grid-cols-3">
          <div className="border-b border-navy-100 bg-gradient-to-br from-ember-50 to-ember-100/50 p-6 sm:border-b-0 sm:border-r">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ember-600 shadow-sm">
              <Coins className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-navy-500">
              Saldo atual
            </p>
            <p className="font-display text-4xl font-bold text-navy-900">
              {tokensAtual}
            </p>
            <p className="text-xs text-navy-600">
              {tokensAtual === 1 ? "token disponível" : "tokens disponíveis"}
            </p>
          </div>

          <div className="border-b border-navy-100 p-6 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wider text-navy-500">
              Análises feitas
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-navy-900">
              {tokensUsados}
            </p>
            <p className="text-xs text-navy-600">tokens consumidos</p>
          </div>

          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-navy-500">
              Total recebido
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-navy-900">
              {totalRecebido}
            </p>
            <p className="text-xs text-navy-600">desde o cadastro</p>
          </div>
        </div>
      </Card>

      {/* Pacotes */}
      <div className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold text-navy-900">
            Pacotes de tokens
          </h2>
          <p className="text-xs text-navy-500">
            Pagamento via Kiwify · Pix, cartão e boleto
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TOKEN_PACKAGES.map((p) => {
            const checkoutUrl = profile?.email
              ? `${p.checkoutUrl}?email=${encodeURIComponent(profile.email)}`
              : p.checkoutUrl;

            return (
              <Card
                key={p.id}
                className={p.highlight ? "relative ring-2 ring-ember-500 ring-offset-2" : ""}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ember-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
                    Mais popular
                  </div>
                )}
                <CardContent>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ember-50 text-ember-600">
                    <Coins className="h-5 w-5" />
                  </div>

                  <h3 className="font-display text-2xl font-bold text-navy-900">
                    {p.tokens} tokens
                    {p.kind === "assinatura" && <span className="text-base font-normal text-navy-500">/mês</span>}
                  </h3>
                  <p className="text-sm font-medium text-ember-700">
                    = {tokensParaAnalises(p.tokens)} análises{p.kind === "assinatura" ? "/mês" : ""}
                  </p>

                  <p className="mt-1 text-sm text-navy-500">{p.description}</p>

                  <div className="my-5">
                    <p className="font-display text-3xl font-bold text-navy-900">
                      R$ {p.priceBRL.toFixed(2).replace(".", ",")}
                      {p.kind === "assinatura" && (
                        <span className="text-base font-normal text-navy-500">/mês</span>
                      )}
                    </p>
                    <p className="text-xs text-navy-500">
                      R$ {p.pricePerTokenBRL.toFixed(2).replace(".", ",")} por token
                    </p>
                  </div>

                  <ul className="mb-6 space-y-2 text-sm text-navy-700">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-ok" />
                      {p.kind === "assinatura" ? "Renovação automática mensal" : "Sem recorrência"}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-ok" />
                      Análise completa com checklist normativo
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-ok" />
                      Relatório em PDF
                    </li>
                    {p.kind === "assinatura" && (
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-ok" />
                        Cancele quando quiser
                      </li>
                    )}
                  </ul>

                  <CheckoutLink href={checkoutUrl} pacote={p.label} valor={p.priceBRL}>
                    <Button variant={p.highlight ? "primary" : "outline"} className="w-full">
                      {p.kind === "assinatura" ? "Assinar agora" : "Comprar agora"}
                    </Button>
                  </CheckoutLink>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-navy-400">
          Pagamento processado de forma segura pela Kiwify. Os tokens são liberados
          automaticamente após a confirmação do pagamento.
        </p>
      </div>

      {/* Extrato */}
      {transactions && transactions.length > 0 && (
        <Card>
          <div className="border-b border-navy-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-navy-700" />
              <h2 className="font-display text-lg font-semibold text-navy-900">
                Extrato de tokens
              </h2>
            </div>
          </div>
          <div className="divide-y divide-navy-100">
            {(transactions as TokenTransaction[]).map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    t.amount > 0
                      ? "bg-status-ok-bg text-status-ok"
                      : "bg-status-bad-bg text-status-bad"
                  }`}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy-900">
                    {reasonLabels[t.reason] ?? t.reason}
                  </p>
                  {t.description && (
                    <p className="truncate text-xs text-navy-500">
                      {t.description}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs text-navy-500">
                  {formatDate(t.created_at)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="mt-8 text-xs text-navy-500">
        Tokens são adquiridos uma única vez e não expiram. Cada análise com IA
        consome 2 tokens, independente do número de pranchas enviadas.
      </p>
    </AppShell>
  );
}
