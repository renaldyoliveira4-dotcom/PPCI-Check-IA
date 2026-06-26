"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { analytics, identifyUser } from "@/lib/analytics";
import { metaPixel } from "@/lib/metaPixel";

export default function CadastroPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        // Este valor é usado pelo template de e-mail como {{ .RedirectTo }}
        // -- o destino final, DEPOIS que /auth/confirm já trocou o token
        // pela sessão. Ver src/app/auth/confirm/route.ts.
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Este e-mail já está cadastrado."
          : "Não foi possível criar a conta. Tente novamente."
      );
      setLoading(false);
      return;
    }

    // Se confirmação de e-mail estiver habilitada, mostrar mensagem.
    // Caso contrário, redirecionar diretamente.
    if (data.session) {
      if (data.user) {
        identifyUser(data.user.id, { email, name });
      }
      analytics.cadastroConcluido({ metodo: "email" });
      metaPixel.cadastroConcluido();
      router.push("/dashboard");
      router.refresh();
    } else {
      if (data.user) {
        identifyUser(data.user.id, { email, name });
      }
      analytics.cadastroConcluido({ metodo: "email" });
      metaPixel.cadastroConcluido();
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-ok-bg">
            <svg className="h-6 w-6 text-status-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-navy-900">
            Confira seu e-mail
          </h2>
          <p className="mt-2 text-sm text-navy-600">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="outline">Ir para o login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Criar conta gratuita</CardTitle>
        <p className="mt-1 text-sm text-navy-500">
          Faça sua primeira pré-análise em minutos.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome completo"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="João da Silva"
            required
            autoComplete="name"
          />
          <Input
            label="E-mail profissional"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            autoComplete="new-password"
          />

          {error && (
            <div className="rounded-lg border border-status-bad/30 bg-status-bad-bg p-3 text-sm text-status-bad">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Criar conta
          </Button>

          <p className="text-center text-xs text-navy-500">
            Ao criar sua conta você concorda com os termos de uso e a política
            de privacidade.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-navy-600">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-ember-600 hover:text-ember-700"
          >
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
