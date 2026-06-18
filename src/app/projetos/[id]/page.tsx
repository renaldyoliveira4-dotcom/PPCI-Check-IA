import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Maximize,
  Layers,
  User,
  FileText,
  Upload,
  Sparkles,
  ClipboardCheck,
  Calendar,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  projectStatusLabel,
} from "@/lib/utils";
import { OCCUPANCY_TYPES } from "@/types";

export default async function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", project.id)
    .order("uploaded_at", { ascending: false });

  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const latestAnalysis = analyses?.[0] ?? null;

  const occupancyLabel = project.occupancy_type
    ? OCCUPANCY_TYPES.find((o) => o.code === project.occupancy_type)?.label ??
      project.occupancy_type
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

      {/* Cabeçalho */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="neutral">{projectStatusLabel(project.status)}</Badge>
            <span className="text-sm text-navy-500">
              Criado em {formatDate(project.created_at)}
            </span>
          </div>
          <h1 className="font-display text-display-md text-navy-900">
            {project.name}
          </h1>
          {project.client_name && (
            <p className="mt-1 text-navy-600">Cliente: {project.client_name}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/projetos/${project.id}/editar`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          {project.status === "draft" && (
            <Link href={`/projetos/${project.id}/upload`}>
              <Button>
                <Upload className="h-4 w-4" />
                Enviar PDF
              </Button>
            </Link>
          )}
          {project.status === "uploaded" && (
            <Link href={`/projetos/${project.id}/analise`}>
              <Button>
                <Sparkles className="h-4 w-4" />
                Analisar agora
              </Button>
            </Link>
          )}
          {latestAnalysis && (
            <Link href={`/projetos/${project.id}/relatorio`}>
              <Button variant={project.status === "completed" ? "primary" : "outline"}>
                <ClipboardCheck className="h-4 w-4" />
                Ver relatório
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Dados do projeto */}
          <Card>
            <div className="border-b border-navy-100 px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-navy-900">
                Dados do projeto
              </h2>
            </div>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoRow
                  icon={Building2}
                  label="Ocupação"
                  value={occupancyLabel || "Não informada"}
                />
                <InfoRow
                  icon={MapPin}
                  label="Localização"
                  value={
                    project.city && project.state
                      ? `${project.city} / ${project.state}`
                      : project.city || project.state || "Não informada"
                  }
                />
                <InfoRow
                  icon={Maximize}
                  label="Área construída"
                  value={
                    project.built_area
                      ? `${project.built_area.toLocaleString("pt-BR")} m²`
                      : "Não informada"
                  }
                />
                <InfoRow
                  icon={Layers}
                  label="Pavimentos"
                  value={project.floors ? `${project.floors}` : "Não informado"}
                />
                <InfoRow
                  icon={User}
                  label="Cliente"
                  value={project.client_name || "Não informado"}
                />
                <InfoRow
                  icon={Calendar}
                  label="Última atualização"
                  value={formatDateTime(project.updated_at)}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Arquivos */}
          <Card>
            <div className="border-b border-navy-100 px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-navy-900">
                Arquivos enviados
              </h2>
            </div>
            {files && files.length > 0 ? (
              <div className="divide-y divide-navy-100">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
                      <FileText className="h-5 w-5 text-navy-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy-900">
                        {file.file_name}
                      </p>
                      <p className="text-sm text-navy-500">
                        {formatFileSize(file.file_size)} ·{" "}
                        {formatDate(file.uploaded_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CardContent>
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-50">
                    <FileText className="h-6 w-6 text-navy-400" />
                  </div>
                  <p className="mt-3 text-sm text-navy-600">
                    Nenhum arquivo enviado ainda.
                  </p>
                  <Link
                    href={`/projetos/${project.id}/upload`}
                    className="mt-4 inline-block"
                  >
                    <Button size="sm">
                      <Upload className="h-3.5 w-3.5" />
                      Enviar PDF
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {latestAnalysis ? (
            <Card>
              <div className="border-b border-navy-100 px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-navy-900">
                  Última análise
                </h2>
              </div>
              <CardContent>
                <div className="text-center">
                  <p className="font-display text-5xl font-semibold text-navy-900">
                    {latestAnalysis.score}%
                  </p>
                  <p className="mt-1 text-sm text-navy-500">conformidade</p>
                </div>
                <div className="mt-4">
                  <ProgressBar value={latestAnalysis.score} />
                </div>
                <dl className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-navy-600">Conformes</dt>
                    <dd className="font-semibold text-status-ok">
                      {latestAnalysis.conforming_items}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-navy-600">Atenção</dt>
                    <dd className="font-semibold text-status-warn">
                      {latestAnalysis.warning_items}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-navy-600">Não conformes</dt>
                    <dd className="font-semibold text-status-bad">
                      {latestAnalysis.non_conforming_items}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/projetos/${project.id}/relatorio`}
                  className="mt-6 block"
                >
                  <Button variant="outline" className="w-full">
                    Ver relatório completo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <p className="mt-3 text-xs text-navy-500">
                  Análise gerada em {formatDateTime(latestAnalysis.created_at)}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ember-50">
                    <Sparkles className="h-6 w-6 text-ember-600" />
                  </div>
                  <h3 className="mt-3 font-display font-semibold text-navy-900">
                    Pronto para analisar?
                  </h3>
                  <p className="mt-1 text-sm text-navy-600">
                    {project.status === "draft"
                      ? "Envie o PDF do projeto para iniciar a pré-análise."
                      : "Inicie a pré-análise técnica do projeto."}
                  </p>
                  <Link
                    href={
                      project.status === "draft"
                        ? `/projetos/${project.id}/upload`
                        : `/projetos/${project.id}/analise`
                    }
                    className="mt-5 block"
                  >
                    <Button className="w-full">
                      {project.status === "draft" ? (
                        <>
                          <Upload className="h-4 w-4" />
                          Enviar PDF
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Analisar agora
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {analyses && analyses.length > 1 && (
            <Card>
              <div className="border-b border-navy-100 px-6 py-4">
                <h2 className="font-display text-sm font-semibold text-navy-900">
                  Histórico de análises
                </h2>
              </div>
              <div className="divide-y divide-navy-100">
                {analyses.slice(1).map((a) => (
                  <div key={a.id} className="px-6 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-navy-600">
                        {formatDate(a.created_at)}
                      </span>
                      <span className="font-semibold text-navy-900">
                        {a.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-xs text-navy-600">
            Ferramenta de apoio técnico. Não substitui a análise oficial do
            Corpo de Bombeiros e não garante aprovação do projeto.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50">
        <Icon className="h-4 w-4 text-navy-600" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-navy-500">{label}</dt>
        <dd className="text-sm font-medium text-navy-900">{value}</dd>
      </div>
    </div>
  );
}
