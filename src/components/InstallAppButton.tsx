"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, SquarePlus } from "lucide-react";

// O TypeScript do DOM não inclui nativamente o tipo deste evento --
// ele é específico do Chrome/Edge/Android (parte da spec de Web App
// Manifest, ainda não padronizada em todos os navegadores).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS expõe isso como propriedade não padrão do navigator
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

interface InstallAppButtonProps {
  /** Estilo visual: "button" (botão sólido) ou "link" (texto simples, para menus) */
  variant?: "button" | "link";
  className?: string;
}

export function InstallAppButton({ variant = "button", className }: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    setAlreadyInstalled(isInStandaloneMode());

    const handler = (event: Event) => {
      // Impede o navegador de mostrar seu mini-banner automático --
      // queremos controlar quando o prompt aparece, via nosso botão.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Já instalado: não mostra nada (não há motivo para oferecer
  // instalar de novo).
  if (alreadyInstalled) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isIos()) {
      setShowIosHelp(true);
      return;
    }

    // Navegador não suporta instalação automática (ex: Firefox desktop)
    // e não é iOS -- não há ação útil a fazer além de informar.
    setShowIosHelp(true);
  };

  // Nada para oferecer: não é iOS e o navegador não disparou o evento
  // de instalação (provavelmente já rodando em app instalado, ou
  // navegador sem suporte). Evita mostrar um botão que não faz nada.
  if (!deferredPrompt && !isIos()) return null;

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={handleClick}
          className={
            className ??
            "inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          }
        >
          <Download className="h-4 w-4" />
          Baixar app
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={className ?? "inline-flex items-center gap-2 text-sm font-medium text-navy-600 hover:text-navy-900"}
        >
          <Download className="h-4 w-4" />
          Baixar app
        </button>
      )}

      {showIosHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-display text-lg font-semibold text-navy-900">
                Instalar o app
              </h3>
              <button
                type="button"
                onClick={() => setShowIosHelp(false)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIos() ? (
              <ol className="space-y-3 text-sm text-navy-700">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ember-100 text-xs font-bold text-ember-700">1</span>
                  <span className="flex items-center gap-1.5">
                    Toque no ícone de compartilhar
                    <Share className="h-4 w-4 text-navy-500" />
                    na barra do navegador.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ember-100 text-xs font-bold text-ember-700">2</span>
                  <span className="flex items-center gap-1.5">
                    Toque em "Adicionar à Tela de Início"
                    <SquarePlus className="h-4 w-4 text-navy-500" />
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ember-100 text-xs font-bold text-ember-700">3</span>
                  <span>Toque em "Adicionar" para confirmar.</span>
                </li>
              </ol>
            ) : (
              <p className="text-sm text-navy-700">
                Seu navegador não oferece instalação automática. Procure por uma
                opção como "Instalar app" ou "Adicionar à tela inicial" no menu
                do navegador (geralmente representado por três pontos ⋮).
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
