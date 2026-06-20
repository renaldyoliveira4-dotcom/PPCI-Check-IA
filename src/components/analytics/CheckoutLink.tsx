"use client";

import { analytics } from "@/lib/analytics";
import { metaPixel } from "@/lib/metaPixel";

interface CheckoutLinkProps {
  href: string;
  pacote: string;
  valor: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Link de checkout instrumentado. Existe como componente client separado
 * porque as páginas que o usam (/tokens, /planos) são Server Components —
 * isso permite disparar eventos de analytics/Pixel no clique sem converter
 * a página inteira para client.
 */
export function CheckoutLink({ href, pacote, valor, className, children }: CheckoutLinkProps) {
  const handleClick = () => {
    analytics.pacoteTokensSelecionado({ pacote, valor });
    metaPixel.iniciouCheckout({ pacote, valor });
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
