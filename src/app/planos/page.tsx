import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pricing } from "@/components/landing/Pricing";

const planLabels: Record<string, { label: string; description: string }> = {
  free: {
    label: "Inicial",
    description: "Plano gratuito — 1 projeto ativo por mês.",
  },
  pro: {
    label: "Profissional",
    description: "Projetos ilimitados e recursos avançados.",
  },
  business: {
    label: "Escritório",
    description: "Para equipes e múltiplos usuários.",
  },
};

export default async function PlanosPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, plan")
    .eq("id", user.id)
    .single();

  const currentPlan = profile?.plan ?? "free";
  const planInfo = planLabels[currentPlan] ?? planLabels.free;

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

      {/* Plano atual */}
      <Card className="mb-10">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ember-50">
                <Sparkles className="h-5 w-5 text-ember-600" />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-display font-semibold text-navy-900">
                    Plano atual: {planInfo.label}
                  </p>
                  <Badge variant="ember">Ativo</Badge>
                </div>
                <p className="text-sm text-navy-600">{planInfo.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos disponíveis - reusando componente da landing */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <Pricing />
      </div>

      <div className="mt-8 rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-xs text-navy-600">
        Pagamentos e cobrança serão habilitados em breve. Por enquanto, todos os
        usuários têm acesso ao plano Inicial.
      </div>
    </AppShell>
  );
}
