"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { metaPixel } from "@/lib/metaPixel";

export default function ObrigadoPage() {
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setLogado(!!data.user);
    });
    // Disparado aqui porque esta página só é alcançada após a Kiwify
    // confirmar o pagamento e redirecionar o cliente — não temos o valor
    // exato/pacote neste ponto (a Kiwify não passa esses dados na URL de
    // redirecionamento), então registramos a conversão sem valor
    // específico. O crédito real de tokens já acontece via webhook,
    // independente deste evento de analytics.
    metaPixel.compraConcluida({ pacote: "desconhecido", valor: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-navy-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Logo />
      </div>

      <main className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 pb-16 sm:px-6">
        <Card className="w-full">
          <CardContent className="pt-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-status-ok-bg">
              <CheckCircle2 className="h-9 w-9 text-status-ok" />
            </div>

            <h1 className="font-display text-2xl font-bold text-navy-900">
              Pagamento confirmado!
            </h1>
            <p className="mt-2 text-navy-600">
              Seus tokens já estão sendo liberados na sua conta. Isso costuma
              levar só alguns segundos.
            </p>

            <div className="mt-6 rounded-lg border border-ember-200 bg-ember-50 p-4 text-left">
              <div className="flex items-start gap-2.5">
                <Flame className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-600" />
                <p className="text-sm text-navy-700">
                  {logado === false ? (
                    <>
                      Ainda não tem conta no PPCI Check IA? Você precisa criar
                      uma com o <strong>mesmo e-mail usado na compra</strong>{" "}
                      para que seus tokens sejam vinculados automaticamente.
                    </>
                  ) : (
                    <>
                      Faça login (ou crie sua conta, se ainda não tiver uma)
                      usando o <strong>mesmo e-mail usado na compra</strong> —
                      é assim que seus tokens são vinculados automaticamente.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">
                  Entrar na minha conta
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cadastro" className="flex-1">
                <Button variant="outline" className="w-full">
                  Criar conta nova
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-navy-400">
              Algum problema com seus tokens? Fale com a gente pelo WhatsApp
              no canto da tela — resolvemos rapidinho.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
