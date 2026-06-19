"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MultiFileUpload } from "@/components/ui/MultiFileUpload";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/types";
import { analytics } from "@/lib/analytics";

export default function UploadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [userName, setUserName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [plantas, setPlantas] = useState<File[]>([]);
  const [memoriais, setMemoriais] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
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

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (projectError || !projectData) {
        router.push("/dashboard");
        return;
      }
      setProject(projectData);
    })();
  }, [projectId, router]);

  const uploadOne = async (
    file: File,
    user_id: string,
    project_id: string
  ): Promise<{ storage_path: string; signed_url: string }> => {
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user_id}/${project_id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 3600);

    return {
      storage_path: storagePath,
      signed_url: urlData?.signedUrl ?? "",
    };
  };

  const handleSubmit = async () => {
    if (plantas.length === 0 || !project) {
      setError("Envie pelo menos uma prancha do projeto.");
      return;
    }
    setUploading(true);
    setError(null);
    analytics.uploadIniciado({ projeto_id: project.id });

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const allFiles = [
        ...plantas.map((f) => ({ file: f, isMemorial: false })),
        ...memoriais.map((f) => ({ file: f, isMemorial: true })),
      ];

      const inserts: Array<Record<string, unknown>> = [];

      for (let i = 0; i < allFiles.length; i++) {
        const { file, isMemorial } = allFiles[i];
        setProgress(`Enviando ${i + 1} de ${allFiles.length}: ${file.name}`);

        const { storage_path, signed_url } = await uploadOne(
          file,
          user.id,
          project.id
        );

        inserts.push({
          project_id: project.id,
          file_name: (isMemorial ? "[MEMORIAL] " : "") + file.name,
          file_url: signed_url,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          storage_path,
        });
      }

      const { error: fileError } = await supabase
        .from("project_files")
        .insert(inserts);
      if (fileError) throw new Error(fileError.message);

      await supabase
        .from("projects")
        .update({ status: "uploaded" })
        .eq("id", project.id);

      setProgress("Iniciando análise…");
      analytics.uploadConcluido({
        projeto_id: project.id,
        tamanho_kb: Math.round(allFiles.reduce((acc, f) => acc + f.file.size, 0) / 1024),
        paginas: allFiles.length,
      });
      router.push(`/projetos/${project.id}/analise`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido";
      analytics.uploadFalhou({ projeto_id: project.id, motivo: message });
      setError(`Não foi possível enviar: ${message}`);
      setUploading(false);
      setProgress(null);
    }
  };

  if (!project) {
    return (
      <AppShell userName={userName} userEmail={userEmail}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-300 border-t-navy-900" />
        </div>
      </AppShell>
    );
  }

  const totalFiles = plantas.length + memoriais.length;

  return (
    <AppShell userName={userName} userEmail={userEmail}>
      <div className="mb-6">
        <Link
          href={`/projetos/${project.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-display text-display-md text-navy-900">
          Envie as plantas
        </h1>
        <p className="mt-1 text-navy-600">
          A IA vai auditar conforme as Instruções Técnicas do CBMBA.
        </p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-navy-200 bg-navy-50 p-4">
        <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy-600" />
        <div className="text-sm">
          <p className="font-medium text-navy-900">{project.name}</p>
          <p className="text-navy-600">
            {project.client_name || "Sem cliente"}
            {project.city ? ` · ${project.city}` : ""}
            {project.state ? `/${project.state}` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Plantas */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                Plantas do projeto
                <span className="rounded bg-status-bad-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-bad">
                  Obrigatório
                </span>
              </span>
            </CardTitle>
            <p className="mt-1 text-sm text-navy-500">
              Envie todas as pranchas (planta baixa, cortes, cobertura, situação)
              do projeto de combate a incêndio. A IA analisa em conjunto.
            </p>
          </CardHeader>
          <CardContent>
            <MultiFileUpload
              files={plantas}
              onChange={setPlantas}
              disabled={uploading}
              label="Arraste as pranchas aqui"
              sublabel="PDF, PNG ou JPG · até 32 MB cada · vários arquivos"
              maxFiles={8}
            />
          </CardContent>
        </Card>

        {/* Memorial */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                Memorial descritivo
                <span className="rounded bg-navy-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-600">
                  Opcional
                </span>
              </span>
            </CardTitle>
            <p className="mt-1 text-sm text-navy-500">
              Se você tem o memorial, a IA cruza com a planta e aponta
              divergências (ex.: memorial cita 4 saídas, planta mostra 3).
            </p>
          </CardHeader>
          <CardContent>
            <MultiFileUpload
              files={memoriais}
              onChange={setMemoriais}
              disabled={uploading}
              label="Arraste o memorial aqui"
              sublabel="PDF preferencialmente · até 32 MB"
              maxFiles={2}
            />
          </CardContent>
        </Card>

        {/* Aviso */}
        <div className="flex items-start gap-2 rounded-lg border border-ember-200 bg-ember-50 p-3 text-xs text-navy-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-600" />
          <p>
            Ferramenta de apoio técnico. A pré-análise não substitui a análise
            oficial do Corpo de Bombeiros nem garante aprovação do projeto. A
            responsabilidade técnica é sempre do profissional habilitado.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-status-bad/30 bg-status-bad-bg p-3 text-sm text-status-bad">
            {error}
          </div>
        )}

        {progress && uploading && (
          <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 p-3 text-sm text-navy-700">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-300 border-t-navy-900" />
            {progress}
          </div>
        )}

        {/* Ação */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4">
          <p className="text-sm text-navy-600">
            {totalFiles === 0
              ? "Nenhum arquivo selecionado"
              : `${totalFiles} arquivo${totalFiles > 1 ? "s" : ""} pronto${totalFiles > 1 ? "s" : ""} para enviar`}
          </p>
          <div className="flex gap-3">
            <Link href={`/projetos/${project.id}`}>
              <Button variant="ghost" type="button" disabled={uploading}>
                Cancelar
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={plantas.length === 0}
              isLoading={uploading}
              size="lg"
            >
              <Sparkles className="h-4 w-4" />
              Enviar e analisar com IA
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
