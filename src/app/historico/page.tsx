"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  FileText,
  FolderKanban,
  Filter,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { formatDate, projectStatusLabel, cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

const STATUS_FILTERS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "uploaded", label: "Aguardando análise" },
  { value: "analyzing", label: "Em análise" },
  { value: "completed", label: "Concluído" },
  { value: "archived", label: "Arquivado" },
];

export default function HistoricoPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

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

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setProjects(data ?? []);
      setLoading(false);
    })();
  }, [router]);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.client_name?.toLowerCase().includes(q) ?? false) ||
          (p.city?.toLowerCase().includes(q) ?? false)
      );
    }
    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return list;
  }, [projects, search, statusFilter, sortBy]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <AppShell userName={userName} userEmail={userEmail}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-navy-900">
            Histórico de projetos
          </h1>
          <p className="mt-1 text-navy-600">
            Todos os projetos cadastrados na sua conta.
          </p>
        </div>
        <Link href="/projetos/novo">
          <Button size="lg">
            <Plus className="h-4 w-4" />
            Novo projeto
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <Input
                placeholder="Buscar por nome, cliente ou cidade…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ProjectStatus | "all")
              }
              className="min-w-[180px]"
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
              className="min-w-[160px]"
            >
              <option value="recent">Mais recentes</option>
              <option value="name">Por nome (A-Z)</option>
            </Select>
          </div>

          {hasFilters && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Filter className="h-3.5 w-3.5 text-navy-500" />
              <span className="text-navy-600">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "projeto encontrado"
                  : "projetos encontrados"}
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ember-600 hover:text-ember-700"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista */}
      {loading ? (
        <Card>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-navy-50"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filtered.length > 0 ? (
        <Card>
          <div className="divide-y divide-navy-100">
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={`/projetos/${project.id}`}
                className={cn(
                  "flex items-center justify-between gap-4 p-5",
                  "transition-colors hover:bg-navy-50/50"
                )}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50">
                    <FileText className="h-5 w-5 text-navy-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-900">
                      {project.name}
                    </p>
                    <p className="truncate text-sm text-navy-500">
                      {project.client_name || "Sem cliente"}
                      {project.city && project.state
                        ? ` · ${project.city}/${project.state}`
                        : ""}
                      {" · "}
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant="neutral" className="flex-shrink-0">
                  {projectStatusLabel(project.status)}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-50">
                <FolderKanban className="h-6 w-6 text-navy-400" />
              </div>
              <p className="mt-4 font-medium text-navy-900">
                {hasFilters
                  ? "Nenhum projeto corresponde aos filtros"
                  : "Você ainda não tem projetos"}
              </p>
              <p className="mt-1 text-sm text-navy-500">
                {hasFilters
                  ? "Tente ajustar os critérios de busca."
                  : "Crie seu primeiro projeto e faça uma pré-análise em minutos."}
              </p>
              {!hasFilters && (
                <Link href="/projetos/novo" className="mt-6 inline-block">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Criar projeto
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
