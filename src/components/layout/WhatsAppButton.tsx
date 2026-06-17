"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface WhatsAppButtonProps {
  /** Número no formato internacional sem símbolos. Ex: "5575999998888" */
  number: string;
  /** Mensagem pré-preenchida. */
  defaultMessage?: string;
}

export function WhatsAppButton({
  number,
  defaultMessage = "Olá! Preciso de ajuda com o PPCI Check IA.",
}: WhatsAppButtonProps) {
  const [showTip, setShowTip] = useState(false);

  const url = `https://wa.me/${number}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {showTip && (
        <div className="relative max-w-[260px] rounded-xl border border-navy-100 bg-white p-3 shadow-xl">
          <button
            type="button"
            onClick={() => setShowTip(false)}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded text-navy-400 hover:bg-navy-50 hover:text-navy-700"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="pr-5 text-sm font-semibold text-navy-900">
            Precisa de ajuda?
          </p>
          <p className="mt-0.5 text-xs text-navy-600">
            Fale com nosso time pelo WhatsApp. Respondemos em minutos.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe5a]"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Abrir conversa
          </a>
        </div>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTip(true)}
        onFocus={() => setShowTip(true)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:bg-[#1ebe5a] hover:shadow-xl"
        aria-label="Suporte via WhatsApp"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30 group-hover:opacity-0" />
        <WhatsAppIcon className="relative h-7 w-7" />
      </a>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
