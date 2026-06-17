"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

type Mode = "signup" | "login";

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fechar com Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Informe seu nome.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      await onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      // Traduz alguns erros comuns
      if (msg.toLowerCase().includes("invalid login")) {
        setError("E-mail ou senha incorretos.");
      } else if (msg.toLowerCase().includes("already registered")) {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
        },
      });
      if (error) throw error;
      // OAuth redireciona o navegador — não chega aqui em sucesso
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Não foi possível abrir o Google: ${msg}`);
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-50 hover:text-navy-900"
          aria-label="Fechar"
          disabled={loading || googleLoading}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-ember-50 px-2.5 py-1 text-xs font-semibold text-ember-700">
            <Sparkles className="h-3 w-3" />
            10 tokens grátis
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900">
            {mode === "signup"
              ? "Crie sua conta para ver o resultado"
              : "Faça login para continuar"}
          </h2>
          <p className="mt-1 text-sm text-navy-600">
            {mode === "signup"
              ? "Leva 10 segundos com Google. Sem cartão de crédito."
              : "Use suas credenciais para acessar sua conta."}
          </p>
        </div>

        {/* Botão Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || googleLoading}
          className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-50 disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-300 border-t-navy-900" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          {mode === "signup" ? "Continuar com Google" : "Entrar com Google"}
        </button>

        {/* Separador */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-navy-100" />
          <span className="text-xs uppercase tracking-wider text-navy-400">
            ou com e-mail
          </span>
          <div className="h-px flex-1 bg-navy-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <Input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                autoComplete="name"
                className="pl-9"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="pl-9"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <Input
              type="password"
              placeholder={
                mode === "signup"
                  ? "Crie uma senha (mín. 6 caracteres)"
                  : "Sua senha"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="pl-9"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-status-bad/30 bg-status-bad-bg p-3 text-sm text-status-bad">
              {error}
            </div>
          )}

          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            size="lg"
          >
            {mode === "signup" ? "Criar conta e analisar" : "Entrar e continuar"}
          </Button>
        </form>

        <div className="mt-5 border-t border-navy-100 pt-4 text-center text-sm text-navy-600">
          {mode === "signup" ? (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="font-semibold text-ember-600 hover:text-ember-700"
              >
                Faça login
              </button>
            </>
          ) : (
            <>
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-semibold text-ember-600 hover:text-ember-700"
              >
                Criar conta grátis
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-navy-400">
          Ao continuar, você aceita os Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
