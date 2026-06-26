"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do PWA. Renderiza null -- não tem UI
 * própria, só executa o efeito de registro assim que o app carrega.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      // Falha no registro do service worker não deve travar o app --
      // o site continua funcionando normalmente, só sem a opção de
      // instalação. Apenas registramos no console para diagnóstico.
      console.error("Falha ao registrar service worker:", error);
    });
  }, []);

  return null;
}
