import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Coins } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pricing } from "@/components/landing/Pricing";
import { TOKEN_PACKAGES } from "@/lib/billing/packages";

export default async function PlanosPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, tokens, subscription_status, subscription_plan_id, subscription_renews_at")
    .eq("id", user.id)
    .single();

  const assinaturaAtiva = profile?.subscription_status === "active";
  const pacoteAtivo = assinaturaAtiva
    ? TOKEN_PACKAGES.find((p) => p.id === profile?.subscription_plan_id)
    : null;

  const dataRenovacao = profile?.subscription_renews_at
    ? new Date(profile.subscription_renews_at).toLocaleDateString("pt-BR")
    : null;

  return (
    <AppShell userName={profile?.name} userEmail={profile?.email}>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o dashboard
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-display-md text-navy-900">
          Planos e assinatura
        </h1>
        <p className="mt-1 text-navy-600">
          Escolha o plano que melhor se adapta ao seu fluxo de trabalho.
        </p>
      </div>

      {/* Situação atual da conta */}
      <Card className="mb-10">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ember-50">
                {assinaturaAtiva ? (
                  <Sparkles className="h-5 w-5 text-ember-600" />
                ) : (
                  <Coins className="h-5 w-5 text-ember-600" />
                )}
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-display font-semibold text-navy-900">
                    {assinaturaAtiva && pacoteAtivo
                      ? `Assinatura: ${pacoteAtivo.label}`
                      : "Sem assinatura ativa"}
                  </p>
                  <Badge variant={assinaturaAtiva ? "ember" : "default"}>
                    {assinaturaAtiva ? "Ativa" : `${profile?.tokens ?? 0} tokens`}
                  </Badge>
                </div>
                <p className="text-sm text-navy-600">
                  {assinaturaAtiva
                    ? `Renovação automática${dataRenovacao ? ` em ${dataRenovacao}` : ""}. Cancele quando quiser.`
                    : `Você tem ${profile?.tokens ?? 0} tokens disponíveis. Compre um pacote avulso ou assine para receber tokens todo mês.`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos disponíveis - reusando componente da landing */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <Pricing />
      </div>
    </AppShell>
  );
}
