import Link from "next/link";
import { ArrowRight, ShieldCheck, FileSearch, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background grid sutil */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-light bg-[size:64px_64px] opacity-40"
        aria-hidden="true"
      />
      {/* Gradiente sutil no topo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-navy-50/60 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 lg:pt-24 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Texto */}
          <div className="animate-fade-in">
            <Badge variant="ember" className="mb-6">
              Pré-análise técnica · Apoio ao projetista
            </Badge>

            <h1 className="font-display text-display-xl text-balance text-navy-900">
              Analisador inteligente de{" "}
              <span className="relative inline-block">
                <span className="relative z-10">PPCI</span>
                <span
                  className="absolute inset-x-0 bottom-2 -z-0 h-3 bg-ember-200"
                  aria-hidden="true"
                />
              </span>{" "}
              com IA
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-lg text-navy-600">
              Faça uma pré-análise técnica do seu projeto de prevenção e
              combate a incêndio antes de protocolar no Corpo de Bombeiros.
              Reduza retrabalho, evite pendências e revise seu PPCI com apoio
              de Inteligência Artificial.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar análise gratuita
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver como funciona
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-start gap-2 rounded-lg border border-navy-100 bg-navy-50 p-3 text-xs text-navy-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-ember-500" />
              <p>
                Ferramenta de apoio técnico para projetistas. Não substitui a
                análise oficial do Corpo de Bombeiros nem garante aprovação do
                projeto.
              </p>
            </div>
          </div>

          {/* Mockup do relatório — peça signature */}
          <div className="relative animate-slide-up">
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-ember-100 via-transparent to-navy-100 blur-2xl opacity-60" />
            <div className="scan-effect rounded-2xl border border-navy-200 bg-white p-1 shadow-xl">
              <div className="rounded-xl bg-navy-900 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-status-bad" />
                  <div className="h-2.5 w-2.5 rounded-full bg-status-warn" />
                  <div className="h-2.5 w-2.5 rounded-full bg-status-ok" />
                  <span className="ml-3 font-mono text-xs text-navy-300">
                    relatorio.ppcicheck
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-navy-500">
                      Projeto
                    </p>
                    <p className="font-display text-base font-semibold text-navy-900">
                      Edificação Comercial · F-8
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-navy-500">
                      Conformidade
                    </p>
                    <p className="font-display text-2xl font-semibold text-navy-900">
                      78%
                    </p>
                  </div>
                </div>

                <ProgressBar value={78} />

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-3 rounded-lg border border-navy-100 p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-ok" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-navy-900">
                          Ocupação F-8
                        </p>
                        <StatusBadge status="conforme" />
                      </div>
                      <p className="mt-0.5 text-xs text-navy-500">
                        Classificação coerente com o uso declarado.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-status-warn/20 bg-status-warn-bg p-3">
                    <FileSearch className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-warn" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-navy-900">
                          Lotação não informada
                        </p>
                        <StatusBadge status="atencao" />
                      </div>
                      <p className="mt-0.5 text-xs text-navy-600">
                        Inserir cálculo de população (IT-11).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-status-bad/20 bg-status-bad-bg p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-bad" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-navy-900">
                          Extintores sem capacidade
                        </p>
                        <StatusBadge status="nao_conforme" />
                      </div>
                      <p className="mt-0.5 text-xs text-navy-600">
                        Informar capacidade extintora e distribuição.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
