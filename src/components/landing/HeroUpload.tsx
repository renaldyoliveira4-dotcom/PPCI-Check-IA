"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MultiFileUpload } from "@/components/ui/MultiFileUpload";
import { Button } from "@/components/ui/Button";
import { AuthModal } from "@/components/auth/AuthModal";
import { createClient } from "@/lib/supabase/client";

export function HeroUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Adicione pelo menos uma prancha para analisar.");
      return;
    }
    setError(null);

    // Verifica se já está logado
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Não logado → abre modal de cadastro
      setAuthOpen(true);
      return;
    }

    // Logado → processa direto
    await processUpload();
  };

  const processUpload = async () => {
    setProcessing(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão expirada. Tente novamente.");
      setProcessing(false);
      return;
    }

    try {
      // Verifica saldo de tokens
      const { data: profile } = await supabase
        .from("users")
        .select("tokens")
        .eq("id", user.id)
        .single();

      if (!profile || profile.tokens < 1) {
        setProcessing(false);
        setError(
          "Você não tem tokens disponíveis. Adquira mais para continuar."
        );
        router.push("/tokens");
        return;
      }

      // Cria projeto auto
      setProgress("Criando projeto…");
      const now = new Date();
      const projectName = `Análise rápida ${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

      const { data: project, error: pErr } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: projectName,
          status: "draft",
        })
        .select()
        .single();
      if (pErr || !project) throw new Error(pErr?.message || "Falha ao criar projeto");

      // Upload de cada arquivo
      const inserts: Array<Record<string, unknown>> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Enviando ${i + 1} de ${files.length}: ${file.name}`);

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${user.id}/${project.id}/${Date.now()}-${i}-${safeName}`;

        const { error: upErr } = await supabase.storage
          .from("project-files")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
          });
        if (upErr) throw new Error(upErr.message);

        const { data: urlData } = await supabase.storage
          .from("project-files")
          .createSignedUrl(storagePath, 3600);

        inserts.push({
          project_id: project.id,
          file_name: file.name,
          file_url: urlData?.signedUrl ?? "",
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          storage_path: storagePath,
        });
      }

      await supabase.from("project_files").insert(inserts);
      await supabase
        .from("projects")
        .update({ status: "uploaded" })
        .eq("id", project.id);

      setProgress("Iniciando análise com IA…");
      router.push(`/projetos/${project.id}/analise`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(`Não foi possível processar: ${msg}`);
      setProcessing(false);
      setProgress(null);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-navy-50/40 to-white pt-16 pb-16 sm:pt-20">
        {/* Grid decorativo */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.04]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr]">
            {/* Texto */}
            <div>
              <Badge variant="ember" className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                Pré-análise inteligente de PPCI para projetos na Bahia
              </Badge>

              <h1 className="font-display text-3xl font-bold leading-[1.15] text-navy-900 sm:text-4xl lg:text-display-lg">
                Analise seu projeto PPCI{" "}
                <span className="relative sm:whitespace-nowrap">
                  <span className="relative z-10">antes de protocolar</span>
                  <span className="absolute bottom-1 left-0 right-0 -z-0 h-3 bg-ember-300/60" />
                </span>{" "}
                no Corpo de Bombeiros.
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-600">
                O PPCI Check IA faz uma pré-análise da sua planta e memorial,
                apontando pendências, divergências e itens que precisam de
                revisão conforme as ITs do CBMBA.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <FeatureChip
                  icon={Zap}
                  label="10 tokens grátis"
                  description="Para começar"
                />
                <FeatureChip
                  icon={Shield}
                  label="Checklist normativo"
                  description="Baseado nas ITs CBMBA"
                />
                <FeatureChip
                  icon={CheckCircle2}
                  label="A partir de R$ 24,90"
                  description="Pacotes avulsos ou assinatura"
                />
              </div>

              <p className="mt-6 text-xs text-navy-500">
                Ferramenta de apoio técnico. Não substitui o responsável
                técnico nem garante aprovação oficial pelo CBMBA.
              </p>

              <a
                href="#como-funciona"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900"
              >
                Ver como funciona →
              </a>
            </div>

            {/* Card de upload */}
            <div className="lg:pl-8 lg:pt-1">
              <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-xl shadow-navy-900/5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-navy-900">
                      Analisar meu projeto agora
                    </h2>
                    <p className="text-sm text-navy-500">
                      Envie as pranchas e o memorial descritivo
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-status-ok-bg px-2.5 py-1 text-xs font-semibold text-status-ok">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-ok" />
                    10 tokens grátis
                  </div>
                </div>

                <MultiFileUpload
                  files={files}
                  onChange={setFiles}
                  disabled={processing}
                  maxFiles={5}
                  label="Arraste as pranchas + memorial aqui"
                  sublabel="PDF, PNG ou JPG · até 32 MB cada · pranchas e memorial juntos"
                />

                {error && (
                  <div className="mt-3 rounded-lg border border-status-bad/30 bg-status-bad-bg p-2.5 text-sm text-status-bad">
                    {error}
                  </div>
                )}

                {progress && processing && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 p-2.5 text-sm text-navy-700">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-300 border-t-navy-900" />
                    {progress}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={files.length === 0}
                  isLoading={processing}
                  className="mt-4 w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  {files.length === 0
                    ? "Adicione as pranchas + memorial"
                    : "Analisar meu projeto agora"}
                </Button>

                <p className="mt-3 text-center text-xs text-navy-500">
                  Cada análise consome 2 tokens · Sem cartão de crédito
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={async () => {
          setAuthOpen(false);
          await processUpload();
        }}
      />
    </>
  );
}

function FeatureChip({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-navy-100 bg-white p-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-ember-50">
        <Icon className="h-4 w-4 text-ember-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy-900">{label}</p>
        <p className="text-xs text-navy-500">{description}</p>
      </div>
    </div>
  );
}
