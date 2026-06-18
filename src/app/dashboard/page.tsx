import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Plus, ArrowRight, Coins, FolderKanban,
  ClipboardCheck, TrendingUp, Zap, Flame,
  ShieldCheck, AlertTriangle, Building,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

function fmtArea(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("pt-BR") + " m²";
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  draft:     { label: "Rascunho",   dot: "#6b7280", bg: "rgba(107,114,128,0.12)", text: "#9ca3af" },
  uploaded:  { label: "Aguardando", dot: "#f59e0b", bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  analyzing: { label: "Analisando", dot: "#3b82f6", bg: "rgba(59,130,246,0.12)",  text: "#60a5fa" },
  completed: { label: "Concluído",  dot: "#22c55e", bg: "rgba(34,197,94,0.12)",   text: "#4ade80" },
  archived:  { label: "Arquivado",  dot: "#475569", bg: "rgba(71,85,105,0.12)",   text: "#64748b" },
};

export default async function DashboardPage() {
  const { user, profile } = await getUserContext();
  if (!user) redirect("/login");

  const supabase = createClient();

  const { count: totalProjects } = await supabase
    .from("projects").select("*", { count: "exact", head: true }).eq("user_id", user.id);

  const { count: totalAnalyses } = await supabase
    .from("analyses").select("*, projects!inner(user_id)", { count: "exact", head: true }).eq("projects.user_id", user.id);

  const { data: recentProjects } = await supabase
    .from("projects")
    .select("id, name, client_name, status, created_at, occupancy_type, built_area")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: lastAnalyses } = await supabase
    .from("analyses")
    .select("nota, projects!inner(user_id)")
    .eq("projects.user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const notas = (lastAnalyses ?? []).map((a) => a.nota).filter((n): n is number => n !== null && n !== undefined);
  const notaMedia = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  const tokens = profile?.tokens ?? 0;
  const tokensUsed = profile?.tokens_used ?? 0;
  const primeiroNome = profile?.name?.split(" ")[0] || "projetista";

  const stats = [
    { label: "Tokens disponíveis", value: String(tokens), icon: Coins,          accent: "#ef4444", href: "/tokens" },
    { label: "Total de projetos",  value: String(totalProjects ?? 0), icon: Building,       accent: "#3b82f6", href: "/historico" },
    { label: "Análises feitas",    value: String(totalAnalyses ?? 0), icon: ClipboardCheck, accent: "#22c55e" },
    { label: "Nota média (IA)",    value: notaMedia !== null ? notaMedia.toFixed(1) : "—", icon: TrendingUp, accent: "#a855f7" },
  ];

  return (
    <AppShell
      userName={profile?.name}
      userEmail={profile?.email}
      tokens={tokens}
      activeState={profile?.active_state ?? "BA"}
      isAdmin={profile?.is_admin ?? false}
    >

      {/* ── Cabeçalho ── */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-5 w-5 text-red-500" />
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Olá, {primeiroNome}
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Visão geral dos seus projetos PPCI · Conformidade CBMBA/BA
          </p>
        </div>
        <Link href="/projetos/novo">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Novo projeto
          </Button>
        </Link>
      </div>

      {/* ── Alerta de tokens zerados ── */}
      {!profile?.is_admin && tokens === 0 && tokensUsed > 0 && (
        <div
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Tokens esgotados</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Adquira mais tokens para continuar analisando projetos.</p>
            </div>
          </div>
          <Link href="/tokens">
            <Button size="sm">
              <Coins className="h-3.5 w-3.5" />
              Ver pacotes
            </Button>
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const card = (
            <div
              key={s.label}
              className="rounded-xl px-5 py-4 transition-all"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    {s.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {s.value}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${s.accent}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.accent }} />
                </div>
              </div>
            </div>
          );
          return s.href
            ? <Link key={s.label} href={s.href}>{card}</Link>
            : <div key={s.label}>{card}</div>;
        })}
      </div>

      {/* ── Projetos recentes ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Projetos recentes</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {recentProjects?.length ?? 0} projeto(s) cadastrado(s)
            </p>
          </div>
          <Link
            href="/historico"
            className="flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-400 transition-colors"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentProjects && recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="proj-table w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Projeto", "Ocupação", "Área", "Criado em", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => {
                  const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-white/5 dark:hover:bg-white/5"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                        {p.client_name && (
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.client_name}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>
                        {p.occupancy_type || "—"}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>
                        {fmtArea(p.built_area)}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/projetos/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                        >
                          Abrir <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--bg-elevated)" }}
            >
              <FolderKanban className="h-7 w-7" style={{ color: "var(--text-secondary)" }} />
            </div>
            <p className="mt-4 font-semibold" style={{ color: "var(--text-primary)" }}>
              Você ainda não tem projetos
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Crie o seu primeiro e analise em minutos.
            </p>
            <Link href="/projetos/novo" className="mt-6 inline-block">
              <Button>
                <Plus className="h-4 w-4" />
                Criar projeto
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Rodapé de conformidade normativa ── */}
      <div
        className="mt-6 flex items-center gap-3 rounded-xl px-5 py-3.5"
        style={{
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.12)",
        }}
      >
        <ShieldCheck className="h-4 w-4 flex-shrink-0 text-red-500" />
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Base normativa ativa:{" "}
          <span className="font-semibold text-red-400">
            Decreto 16.302/2015 + IT-42/2024 CBMBA/BA
          </span>
          {" "}— Motor de análise atualizado com todas as tabelas de exigências.
        </p>
      </div>

    </AppShell>
  );
}
