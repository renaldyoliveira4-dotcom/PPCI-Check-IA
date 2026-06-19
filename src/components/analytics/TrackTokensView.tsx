"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics";

export function TrackTokensView({ tokensRestantes }: { tokensRestantes: number }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    analytics.paginaTokensVisualizada({ tokens_restantes: tokensRestantes });
  }, [tokensRestantes]);

  return null;
}
