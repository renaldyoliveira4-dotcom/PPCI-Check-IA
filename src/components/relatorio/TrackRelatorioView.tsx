"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics";

/**
 * Componente invisível que dispara analytics.relatorioVisualizado() ao
 * montar. Existe porque a página de relatório é um Server Component —
 * isso permite instrumentar sem converter a página inteira para client.
 */
export function TrackRelatorioView({ projetoId }: { projetoId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    analytics.relatorioVisualizado({ projeto_id: projetoId });
  }, [projetoId]);

  return null;
}
