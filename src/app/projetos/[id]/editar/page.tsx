"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { OCCUPANCY_TYPES, BRAZILIAN_STATES } from "@/types";

export default function EditarProjetoPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [userName, setUserName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    name: "",
    client_name: "",
    city: "",
    state: "BA",
    occupancy_type: "",
    built_area: "",
    floors: "",
  });

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

      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (!project) {
        setNotFound(true);
        return;
      }

      setForm({
        name: project.name ?? "",
        client_name: project.client_name ?? "",
        city: project.city ?? "",
        state: project.state ?? "BA",
        occupancy_type: project.occupancy_type ?? "",
        built_area: project.built_area?.toString() ?? "",
        floors: project.floors?.toString() ?? "",
      });
    })();
  }, [router, params.id]);

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        name: form.name,
        client_name: form.client_name || null,
        city: form.city || null,
        state: form.state || null,
        occupancy_type: form.occupancy_type || null,
        built_area: form.built_area ? Number(form.built_area) : null,
        floors: form.floors ? Number(form.floors) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError("Não foi possível salvar as alterações. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push(`/projetos/${params.id}`);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Exclui análise_items, analyses, project_files e project em cascata
    // (ou deixa o banco lidar via foreign key cascade se configurado)
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError("Não foi possível excluir o projeto. Tente novamente.");
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }

    router.push("/dashboard");
  };

  if (notFound) {
    return (
      <AppShell userName={userName} userEmail={userEmail}>
        <div className="py-12 text-center">
          <p className="font-medium text-navy-900">Projeto não encontrado.</p>
          <Link href="/dashboard" className="mt-4 inline-block">
            <Button variant="outline">Voltar ao dashboard</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell userName={userName} userEmail={userEmail}>
      <div className="mb-6">
        <Link
          href={`/projetos/${params.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o projeto
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-display text-display-md text-navy-900">
          Editar projeto
        </h1>
        <p className="mt-1 text-navy-600">
          Atualize os dados cadastrais da edificação.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="border-b border-navy-100 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-navy-900">Dados do projeto</h2>
          </div>
          <CardContent className="space-y-6">
            <Input
              label="Nome do projeto"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ex: Edificação Comercial Centro"
              required
            />

            <Input
              label="Cliente"
              value={form.client_name}
              onChange={(e) => update("client_name", e.target.value)}
              placeholder="Nome do cliente ou empresa"
              hint="Opcional"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input
                  label="Cidade"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Ex: Salvador"
                />
              </div>
              <Select
                label="Estado"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
              >
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </div>

            <Select
              label="Tipo de ocupação"
              value={form.occupancy_type}
              onChange={(e) => update("occupancy_type", e.target.value)}
              hint="Classificação conforme a IT-42"
            >
              <option value="">Selecione…</option>
              {OCCUPANCY_TYPES.map((occ) => (
                <option key={occ.code} value={occ.code}>
                  {occ.label}
                </option>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Área construída (m²)"
                type="number"
                step="0.01"
                min="0"
                value={form.built_area}
                onChange={(e) => update("built_area", e.target.value)}
                placeholder="Ex: 450"
              />
              <Input
                label="Número de pavimentos"
                type="number"
                min="1"
                value={form.floors}
                onChange={(e) => update("floors", e.target.value)}
                placeholder="Ex: 2"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-status-bad/30 bg-status-bad-bg p-3 text-sm text-status-bad">
                {error}
              </div>
            )}
          </CardContent>

          <div className="flex items-center justify-between gap-3 border-t border-navy-100 p-6">
            {/* Botão apagar */}
            <Button
              type="button"
              variant="ghost"
              className={confirmDelete ? "text-status-bad hover:bg-status-bad-bg" : "text-navy-500 hover:text-status-bad"}
              onClick={handleDelete}
              isLoading={deleting}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? "Clique novamente para confirmar exclusão" : "Apagar projeto"}
            </Button>

            <div className="flex gap-3">
              {confirmDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar exclusão
                </Button>
              )}
              <Link href={`/projetos/${params.id}`}>
                <Button variant="ghost" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" isLoading={loading}>
                Salvar alterações
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </AppShell>
  );
}
