"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { OCCUPANCY_TYPES, BRAZILIAN_STATES } from "@/types";
import { analytics } from "@/lib/analytics";

export default function NovoProjetoPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    analytics.novoProjetoIniciado();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      supabase
        .from("users")
        .select("name, email")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setUserName(data?.name);
          setUserEmail(data?.email);
        });
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: form.name,
        client_name: form.client_name || null,
        city: form.city || null,
        state: form.state || null,
        occupancy_type: form.occupancy_type || null,
        built_area: form.built_area ? Number(form.built_area) : null,
        floors: form.floors ? Number(form.floors) : null,
        status: "draft",
      })
      .select()
      .single();

    if (insertError || !data) {
      setError("Não foi possível criar o projeto. Tente novamente.");
      setLoading(false);
      return;
    }

    analytics.novoProjetoCriado({
      projeto_id: data.id,
      area_m2: data.built_area,
    });

    router.push(`/projetos/${data.id}/upload`);
  };

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppShell userName={userName} userEmail={userEmail}>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-display text-display-md text-navy-900">
          Novo projeto
        </h1>
        <p className="mt-1 text-navy-600">
          Informe os dados básicos da edificação. Em seguida você fará o upload
          do PDF.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do projeto</CardTitle>
          </CardHeader>
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
          <div className="flex items-center justify-end gap-3 border-t border-navy-100 p-6">
            <Link href="/dashboard">
              <Button variant="ghost" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={loading}>
              Continuar para o upload
            </Button>
          </div>
        </Card>
      </form>
    </AppShell>
  );
}
