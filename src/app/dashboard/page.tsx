import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Plus, ArrowRight, FileText, Coins, Sparkles, TrendingUp, FolderKanban,
  ClipboardCheck, AlertCircle, Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/user-context";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const STATUS_GESTAO: Record<string, { label: string; cls: string }> = {
  draft:      { label: "Rascunho",    cls: "bg-slate-100 text-slate-600" },
  uploaded:   { label: "Aguardando",  cls: "bg-amber-100 text-amber-700" },
  analyzing:  { label: "Analisando",  cls: "bg-sky-100 text-sky-700" },
  completed:  { label: "Concluído",   cls: "bg-emerald-100 text-emerald-700" },
  archived:   { label: "Arquivado",   cls: "bg-slate-100 text-slate-500" },
};

function fmtArea(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("pt-BR") + " m²";
}

export default async function DashboardPage() {
  const { user, profile } = await getUserContext();
  if (!user) redirect("/login");

  const supabase = createClient();

  const { count: totalProjects } = await supabase
    .from("projects").select("*", { count: "exact", head: true }).eq("user_id", user.id);

  const { count: totalAnalyses } = await supabase
    .from("analyses").select("*, projects!inner(user_id)", { count: "exact", head: true }).eq("projects.user_id", user.id);

  const { data: projectsWithIssues } = await supabase
    .from("projects").select("id").eq("user_id", user.id).in("status", ["uploaded", "analyzing"]);

  const { data: recentProjects } = await supabase
    .from("projects")
    .select("id, name, client_name, status, created_at, occupancy_type, built_area")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: lastAnalyses } = await supabase
    .from("analyses")
    .select("nota, score, projects!inner(user_id)")
    .eq("projects.user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const notas = (lastAnalyses ?? []).map((a) => a.nota).filter((n): n is number => n !== null && n !== undefined);
  const notaMedia = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  const tokens = profile?.tokens ?? 0;
  const tokensUsed = profile?.tokens_used ?? 0;

  const stats = [
    { label: "Saldo de tokens", value: String(tokens), icon: Coins, color: "from-orange-500 to-red-500", href: "/tokens" },
    { label: "Total de projetos", value: String(totalProjects ?? 0), icon: FolderKanban, color: "from-blue-500 to-indigo-500", href: "/historico" },
    { label: "Análises realizadas", value: String(totalAnalyses ?? 0), icon: ClipboardCheck, color: "from-emerald-500 to-teal-500" },
    { label: "Nota média (IA)", value: notaMedia !== null ? notaMedia.toFixed(1) : "—", icon: TrendingUp, color: "from-violet-500 to-purple-500" },
  ];

  return (
    <AppShell
      userName={profile?.name}
      userEmail={profile?.email}
      tokens={tokens}
      activeState={profile?.active_state ?? "BA"}
      isAdmin={profile?.is_admin ?? false}
    >
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Olá, {profile?.name?.split(" ")[0] || "projetista"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visão geral e gestão dos seus projetos PPCI
          </p>
        </div>
        <Link href="/projetos/novo">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Novo projeto
          </Button>
        </Link>
      </div>

      {/* Tokens zerados */}
      {!profile?.is_admin && tokens === 0 && tokensUsed > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50/60">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Seus tokens acabaram</p>
                  <p className="text-sm text-slate-600">Adquira mais para continuar analisando projetos.</p>
                </div>
              </div>
              <Link href="/tokens"><Button size="sm"><Coins className="h-3.5 w-3.5" />Ver pacote</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const inner = (
            <Card className={s.href ? "hover:shadow-md transition-shadow" : ""}>
              <CardContent className="py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-800">{s.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return s.href ? <Link key={s.label} href={s.href}>{inner}</Link> : <div key={s.label}>{inner}</div>;
        })}
      </div>

      {/* Tabela de projetos recentes */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Projetos recentes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Os {recentProjects?.length ?? 0} projetos mais recentes
            </p>
          </div>
          <Link href="/historico" className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentProjects && recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Cliente / Projeto", "Ocupação", "Área", "Criado em", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p, i) => {
                  const sc = STATUS_GESTAO[p.status] ?? STATUS_GESTAO.draft;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${i % 2 === 1 ? "bg-slate-50/30" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        {p.client_name && (
                          <p className="text-xs text-slate-500">{p.client_name}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {p.occupancy_type || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {fmtArea(p.built_area)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sc.cls}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/projetos/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
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
          <CardContent>
            <div className="py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FolderKanban className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 font-semibold text-slate-800">Você ainda não tem projetos</p>
              <p className="mt-1 text-sm text-slate-500">Crie seu primeiro projeto e analise em minutos.</p>
              <Link href="/projetos/novo" className="mt-6 inline-block">
                <Button><Plus className="h-4 w-4" />Criar projeto</Button>
              </Link>
            </div>
          </CardContent>
        )}
      </Card>
    </AppShell>
  );
}
