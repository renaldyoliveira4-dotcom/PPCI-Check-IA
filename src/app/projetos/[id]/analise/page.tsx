"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Cpu, FileSearch, Sparkles, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { analytics } from "@/lib/analytics";

const STEPS = [
  { icon: FileSearch, label: "Enviando plantas para análise" },
  { icon: Sparkles, label: "Auditoria com IA (Claude)" },
  { icon: ShieldCheck, label: "Gerando relatório técnico" },
];

export default function AnalisePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [userName, setUserName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (started.current) return;
    started.current = true;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", user.id)
      .single();
    setUserName(profile?.name);
    setUserEmail(profile?.email);

    // Etapa 1: enviar
    setStep(1);
    analytics.analiseIniciada({ projeto_id: projectId });
    const inicioMs = Date.now();

    // Chama o endpoint de análise (que faz tudo no servidor)
    let resp: Response;
    try {
      resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
    } catch (e) {
      analytics.analiseFalhou({ projeto_id: projectId, motivo: "erro_conexao" });
      setError(
        "Não foi possível conectar à API de análise. Verifique sua conexão."
      );
      return;
    }

    setStep(2);

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 402 || data.error?.toLowerCase().includes("token")) {
        analytics.tokensEsgotados({ projeto_id: projectId });
      }
      analytics.analiseFalhou({
        projeto_id: projectId,
        motivo: data.error || `http_${resp.status}`,
      });
      setError(
        data.error ||
          `A API retornou erro ${resp.status}. Verifique se a chave ANTHROPIC_API_KEY está configurada no .env.local.`
      );
      return;
    }

    const respData = await resp.json().catch(() => ({}));

    setStep(3);
    analytics.analiseConcluida({
      projeto_id: projectId,
      nota: respData?.analysis?.nota ?? null,
      status_aprovacao: respData?.analysis?.status_aprovacao ?? null,
      duracao_segundos: Math.round((Date.now() - inicioMs) / 1000),
      tokens_restantes: respData?.tokens_restantes,
    });
    await new Promise((r) => setTimeout(r, 600));

    router.push(`/projetos/${projectId}/relatorio`);
  }, [projectId, router]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  return (
    <AppShell userName={userName} userEmail={userEmail}>
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="relative mx-auto inline-flex">
              <div className="h-20 w-20 animate-pulse rounded-full bg-ember-100" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="h-9 w-9 text-ember-600" />
              </div>
            </div>

            <h1 className="mt-8 font-display text-2xl font-semibold text-navy-900">
              {error ? "Não foi possível analisar" : "Analisando seu projeto…"}
            </h1>
            <p className="mt-2 text-navy-600">
              {error
                ? "Veja o erro abaixo para mais detalhes."
                : "A IA está lendo as plantas e auditando conforme as ITs do CBMBA. Pode levar de 30s a 2 minutos."}
            </p>

            {error && (
              <>
                <div className="mt-6 rounded-lg border border-status-bad/30 bg-status-bad-bg p-3 text-left text-sm text-status-bad">
                  {error}
                </div>
                <div className="mt-6 flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/projetos/${projectId}`)}
                  >
                    Voltar ao projeto
                  </Button>
                  <Button
                    onClick={() => {
                      started.current = false;
                      setError(null);
                      setStep(0);
                      runAnalysis();
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </>
            )}

            {!error && (
              <div className="mx-auto mt-10 max-w-sm space-y-3">
                {STEPS.map((s, idx) => {
                  const stepNum = idx + 1;
                  const Icon = s.icon;
                  const isDone = step > stepNum;
                  const isCurrent = step === stepNum;
                  return (
                    <div
                      key={s.label}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        isDone
                          ? "border-status-ok/30 bg-status-ok-bg"
                          : isCurrent
                            ? "border-navy-300 bg-white"
                            : "border-navy-100 bg-navy-50/40"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isDone
                            ? "bg-status-ok text-white"
                            : isCurrent
                              ? "bg-navy-900 text-white"
                              : "bg-navy-100 text-navy-400"
                        }`}
                      >
                        {isDone ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isCurrent || isDone ? "text-navy-900" : "text-navy-500"
                        }`}
                      >
                        {s.label}
                      </span>
                      {isCurrent && (
                        <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-navy-300 border-t-navy-900" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {!error && (
          <p className="mt-6 text-center text-xs text-navy-500">
            Não feche esta página. Você será redirecionado para o relatório quando terminar.
          </p>
        )}
      </div>
    </AppShell>
  );
}
