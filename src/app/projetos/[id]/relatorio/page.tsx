import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Lightbulb,
  Download,
  Calendar,
  AlertOctagon,
  Building2,
  Sparkles,
  Award,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { ScoreCircle } from "@/components/ui/ProgressBar";
import { formatDateTime, projectStatusLabel } from "@/lib/utils";
import { DownloadRelatorio } from "@/components/relatorio/DownloadRelatorio";
import type { AnalysisItem, ItemStatus } from "@/types";

export default async function RelatorioPage({
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

  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!analysis) {
    return (
      <AppShell userName={profile?.name} userEmail={profile?.email}>
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-warn-bg">
            <AlertOctagon className="h-6 w-6 text-status-warn" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold text-navy-900">
            Nenhuma análise disponível
          </h1>
          <p className="mt-2 text-sm text-navy-600">
            Este projeto ainda não foi analisado.
          </p>
          <Link href={`/projetos/${project.id}`} className="mt-6 inline-block">
            <Button variant="outline">Voltar para o projeto</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const { data: items } = await supabase
    .from("analysis_items")
    .select("*")
    .eq("analysis_id", analysis.id)
    .order("order_index", { ascending: true });

  const typedItems: AnalysisItem[] = items ?? [];

  // Separa por tipo
  const sistemas = typedItems.filter((i) => i.item_type === "sistema");
  const divergencias = typedItems.filter((i) => i.item_type === "divergencia");
  const pendencias = typedItems.filter((i) => i.item_type === "pendencia");

  // Sistemas agrupados por status para a seção principal
  const sistemasPorStatus: Record<ItemStatus, AnalysisItem[]> = {
    nao_conforme: sistemas.filter((i) => i.status === "nao_conforme"),
    atencao: sistemas.filter((i) => i.status === "atencao"),
    conforme: sistemas.filter((i) => i.status === "conforme"),
  };

  // Status do projeto
  const statusAprovacao = analysis.status_aprovacao;
  const statusStyle: Record<
    string,
    { bg: string; text: string; ring: string }
  > = {
    "Apto a protocolar": {
      bg: "bg-status-ok-bg",
      text: "text-status-ok",
      ring: "ring-status-ok/30",
    },
    "Apto com ressalvas": {
      bg: "bg-status-warn-bg",
      text: "text-status-warn",
      ring: "ring-status-warn/30",
    },
    "Requer correções": {
      bg: "bg-status-warn-bg",
      text: "text-status-warn",
      ring: "ring-status-warn/30",
    },
    Reprovado: {
      bg: "bg-status-bad-bg",
      text: "text-status-bad",
      ring: "ring-status-bad/30",
    },
  };
  const styleStatus =
    statusAprovacao && statusStyle[statusAprovacao]
      ? statusStyle[statusAprovacao]
      : { bg: "bg-navy-50", text: "text-navy-700", ring: "ring-navy-200" };

  return (
    <AppShell userName={profile?.name} userEmail={profile?.email}>
      <Link
        href={`/projetos/${project.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o projeto
      </Link>

      {/* Cabeçalho */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="ember" className="mb-2">
            <Sparkles className="mr-1 h-3 w-3" />
            Auditoria com IA · {analysis.ai_meta?.model ?? "Claude"}
          </Badge>
          <h1 className="font-display text-display-md text-navy-900">
            {project.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-navy-600">
            {project.client_name && <span>{project.client_name}</span>}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(analysis.created_at)}
            </span>
            <Badge variant="neutral">{projectStatusLabel(project.status)}</Badge>
          </p>
        </div>

        <DownloadRelatorio dados={{
          projetoNome: project.name,
          clienteNome: project.client_name ?? undefined,
          cidade: project.city ?? undefined,
          estado: project.state ?? undefined,
          areaM2: project.built_area ?? undefined,
          pavimentos: project.floors ?? undefined,
          ocupacao: project.occupancy_type ?? undefined,
          analiseData: analysis.created_at,
          nota: analysis.nota ?? undefined,
          statusAprovacao: analysis.status_aprovacao ?? undefined,
          score: analysis.score ?? 0,
          conformes: analysis.conforming_items ?? 0,
          atencao: analysis.warning_items ?? 0,
          naoConformes: analysis.non_conforming_items ?? 0,
          sistemas: typedItems.filter(i => i.item_type === "sistema").map(i => ({
            sistema: i.category ?? "",
            norma: i.normative_reference ?? undefined,
            status: i.status as "conforme" | "nao_conforme" | "atencao",
            item_type: i.item_type,
            description: i.description ?? "",
            normative_reference: i.normative_reference ?? undefined,
            recommendation: i.recommendation ?? undefined,
          })),
          divergencias: typedItems.filter(i => i.item_type === "divergencia").map(i => ({
            sistema: "",
            status: i.status as "conforme" | "nao_conforme" | "atencao",
            item_type: i.item_type,
            description: i.description ?? "",
          })),
          pendencias: typedItems.filter(i => i.item_type === "pendencia").map(i => ({
            sistema: "",
            status: i.status as "conforme" | "nao_conforme" | "atencao",
            item_type: i.item_type,
            description: i.description ?? "",
          })),
          aiModel: analysis.ai_meta?.model ?? undefined,
        }} />
      </div>

      {/* Painel principal: nota + status + sumário */}
      <div id="relatorio-content">
      <Card className="mb-8 overflow-hidden">
        <div className="grid lg:grid-cols-[280px_1fr]">
          {/* Lado esquerdo: nota técnica */}
          <div
            className={`flex flex-col items-center justify-center border-b border-navy-100 p-8 lg:border-b-0 lg:border-r ${styleStatus.bg}`}
          >
            {analysis.nota !== null && analysis.nota !== undefined ? (
              <ScoreCircle
                value={Math.round(analysis.nota * 10)}
                size={180}
                strokeWidth={14}
                colorClassName={styleStatus.text}
              >
                <span className={`font-display text-5xl font-bold leading-none ${styleStatus.text}`}>
                  {Number(analysis.nota).toFixed(1)}
                </span>
                <span className="mt-1 text-xs font-medium uppercase tracking-wider text-navy-500">
                  de 10
                </span>
              </ScoreCircle>
            ) : (
              <ScoreCircle value={analysis.score} size={180} strokeWidth={14} />
            )}

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-navy-500">
              Nota técnica
            </p>

            {statusAprovacao && (
              <div
                className={`mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ${styleStatus.text} ${styleStatus.ring}`}
              >
                <Award className="h-4 w-4" />
                {statusAprovacao}
              </div>
            )}

            {analysis.confianca_geral && (
              <p className="mt-4 text-xs text-navy-500">
                Confiança da análise:{" "}
                <span className="font-semibold capitalize text-navy-900">
                  {analysis.confianca_geral}
                </span>
              </p>
            )}
          </div>

          {/* Lado direito: sumário e contadores */}
          <div className="p-8">
            <h2 className="font-display text-lg font-semibold text-navy-900">
              Sumário da auditoria
            </h2>
            <p className="mt-1 text-sm text-navy-500">
              {analysis.total_items} {analysis.total_items === 1 ? "sistema auditado" : "sistemas auditados"} conforme as ITs do CBMBA
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <SummaryStat
                count={analysis.conforming_items}
                label="Conformes"
                icon={CheckCircle2}
                colorBg="bg-status-ok-bg"
                colorText="text-status-ok"
              />
              <SummaryStat
                count={analysis.warning_items}
                label="Pendentes"
                icon={AlertTriangle}
                colorBg="bg-status-warn-bg"
                colorText="text-status-warn"
              />
              <SummaryStat
                count={analysis.non_conforming_items}
                label="Não conformes"
                icon={XCircle}
                colorBg="bg-status-bad-bg"
                colorText="text-status-bad"
              />
            </div>

            {analysis.summary && (
              <div className="mt-6 rounded-lg border border-navy-100 bg-navy-50/50 p-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-navy-500">
                  Resumo executivo
                </p>
                <p className="text-sm leading-relaxed text-navy-800">
                  {analysis.summary}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 text-xs text-navy-500">
              <AlertOctagon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <p>
                Auditoria gerada por IA. Ferramenta de apoio técnico — não
                substitui a análise oficial do Corpo de Bombeiros nem garante
                aprovação do projeto.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Enquadramento */}
      {(analysis.grupo_ocupacao ||
        analysis.divisao_ocupacao ||
        analysis.risco_nivel ||
        analysis.tipo_processo ||
        analysis.area_total_detectada ||
        analysis.numero_pavimentos_detectado) && (
        <Card className="mb-8">
          <div className="border-b border-navy-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-navy-700" />
              <h2 className="font-display text-lg font-semibold text-navy-900">
                Enquadramento detectado pela IA
              </h2>
            </div>
          </div>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {analysis.grupo_ocupacao && (
                <EnqRow
                  label="Grupo"
                  value={`${analysis.grupo_ocupacao}${analysis.divisao_ocupacao ? ` / ${analysis.divisao_ocupacao}` : ""}`}
                />
              )}
              {analysis.risco_nivel && (
                <EnqRow label="Risco" value={analysis.risco_nivel} />
              )}
              {analysis.tipo_processo && (
                <EnqRow label="Processo" value={analysis.tipo_processo} />
              )}
              {analysis.area_total_detectada && (
                <EnqRow
                  label="Área total"
                  value={analysis.area_total_detectada}
                />
              )}
              {analysis.numero_pavimentos_detectado !== null &&
                analysis.numero_pavimentos_detectado !== undefined && (
                  <EnqRow
                    label="Pavimentos"
                    value={String(analysis.numero_pavimentos_detectado)}
                  />
                )}
              {analysis.enquadramento_correto !== null &&
                analysis.enquadramento_correto !== undefined && (
                  <EnqRow
                    label="Enquadramento"
                    value={
                      analysis.enquadramento_correto
                        ? "Correto"
                        : "Revisar"
                    }
                  />
                )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Sistemas auditados */}
      {sistemas.length > 0 && (
        <div className="space-y-8">
          <ItemsSection
            title="Sistemas não conformes"
            subtitle="Sistemas obrigatórios ausentes ou inadequados — corrigir antes de protocolar."
            icon={XCircle}
            accent="bad"
            items={sistemasPorStatus.nao_conforme}
          />
          <ItemsSection
            title="Sistemas pendentes"
            subtitle="Não foi possível confirmar pela planta ou memorial — revise e complemente."
            icon={AlertTriangle}
            accent="warn"
            items={sistemasPorStatus.atencao}
          />
          <ItemsSection
            title="Sistemas conformes"
            subtitle="Sistemas adequadamente representados conforme as ITs."
            icon={CheckCircle2}
            accent="ok"
            items={sistemasPorStatus.conforme}
          />
        </div>
      )}

      {/* Divergências planta × memorial */}
      {divergencias.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 bg-white text-status-warn">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy-900">
                Divergências planta × memorial{" "}
                <span className="font-normal text-navy-500">
                  ({divergencias.length})
                </span>
              </h2>
              <p className="text-sm text-navy-500">
                Inconsistências entre o que está na planta e o que descreve o memorial.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {divergencias.map((item) => (
              <Card key={item.id}>
                <CardContent>
                  <p className="text-sm text-navy-800">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Pendências gerais */}
      {pendencias.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 bg-white text-navy-700">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy-900">
                Pendências para revisão{" "}
                <span className="font-normal text-navy-500">
                  ({pendencias.length})
                </span>
              </h2>
            </div>
          </div>
          <Card>
            <CardContent>
              <ul className="space-y-2 text-sm text-navy-800">
                {pendencias.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ember-500" />
                    {item.description}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Dados encontrados */}
      {analysis.encontrados && analysis.encontrados.length > 0 && (
        <Card className="mt-8">
          <div className="border-b border-navy-100 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-navy-900">
              Dados extraídos pela IA
            </h2>
          </div>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-xs uppercase tracking-wider text-navy-500">
                    <th className="py-2 pr-4 text-left font-medium">Campo</th>
                    <th className="py-2 pr-4 text-left font-medium">Valor</th>
                    <th className="py-2 pr-4 text-left font-medium">Origem</th>
                    <th className="py-2 text-left font-medium">Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.encontrados.map((e: import("@/types").Encontrado, idx: number) => (
                    <tr key={idx} className="border-b border-navy-50">
                      <td className="py-2 pr-4 font-medium text-navy-900">
                        {e.campo}
                      </td>
                      <td className="py-2 pr-4 text-navy-700">{e.valor}</td>
                      <td className="py-2 pr-4 text-xs text-navy-500">
                        {e.fonte ?? e.origem ?? "—"}
                      </td>
                      <td className="py-2">
                        {e.confianca && (
                          <Badge variant="neutral" className="capitalize">
                            {e.confianca}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aviso final */}
      <div className="mt-8 rounded-xl border border-ember-200 bg-ember-50/60 p-6">
        <div className="flex items-start gap-3">
          <AlertOctagon className="mt-0.5 h-5 w-5 flex-shrink-0 text-ember-600" />
          <div>
            <p className="font-display font-semibold text-navy-900">
              Aviso importante
            </p>
            <p className="mt-1 text-sm leading-relaxed text-navy-700">
              Este relatório é uma <strong>pré-análise técnica de apoio</strong>{" "}
              gerada por IA. <strong>Não substitui</strong> a análise oficial do
              Corpo de Bombeiros, o trabalho do projetista responsável, nem
              garante a aprovação do projeto. A responsabilidade técnica final
              é sempre do profissional habilitado.
            </p>
          </div>
        </div>
      </div>

      </div>{/* fim #relatorio-content */}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/projetos/${project.id}`}>
          <Button variant="outline">Voltar para o projeto</Button>
        </Link>
        <Link href="/projetos/novo">
          <Button variant="ghost">Iniciar novo projeto</Button>
        </Link>
      </div>
    </AppShell>
  );
}

function SummaryStat({
  count,
  label,
  icon: Icon,
  colorBg,
  colorText,
}: {
  count: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorBg: string;
  colorText: string;
}) {
  return (
    <div className={`rounded-lg p-4 ${colorBg}`}>
      <Icon className={`h-5 w-5 ${colorText}`} />
      <p className={`mt-2 font-display text-2xl font-semibold ${colorText}`}>
        {count}
      </p>
      <p className="text-xs font-medium text-navy-700">{label}</p>
    </div>
  );
}

function EnqRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-navy-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-navy-900">{value}</dd>
    </div>
  );
}

function ItemsSection({
  title,
  subtitle,
  icon: Icon,
  accent,
  items,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "ok" | "warn" | "bad";
  items: AnalysisItem[];
}) {
  if (items.length === 0) return null;

  const accentMap = {
    ok: "text-status-ok",
    warn: "text-status-warn",
    bad: "text-status-bad",
  };

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-navy-100 bg-white ${accentMap[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-navy-900">
            {title}{" "}
            <span className="font-normal text-navy-500">({items.length})</span>
          </h2>
          <p className="text-sm text-navy-500">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy-500">
                    {item.category}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={item.status} />
                  {item.status !== "conforme" && (
                    <RiskBadge level={item.risk_level} />
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-navy-800">
                {item.description}
              </p>

              {item.recommendation && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-navy-100 bg-navy-50/40 p-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-navy-900">Recomendação</p>
                    <p className="mt-0.5 text-navy-700">
                      {item.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {item.normative_reference && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-navy-500">
                  <BookOpen className="h-3.5 w-3.5" />
                  Referência:{" "}
                  <span className="font-medium text-navy-700">
                    {item.normative_reference}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
