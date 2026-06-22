"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TipoFeedback = "sugestao" | "melhoria" | "bug" | "outro";

const TIPOS: { value: TipoFeedback; label: string }[] = [
  { value: "sugestao", label: "Sugestão" },
  { value: "melhoria", label: "Melhoria" },
  { value: "bug", label: "Encontrei um problema" },
  { value: "outro", label: "Outro" },
];

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoFeedback>("sugestao");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleClose = () => {
    setOpen(false);
    // Reseta o estado depois de fechar, com um pequeno delay para não
    // "piscar" o formulário vazio antes da animação de fechar.
    setTimeout(() => {
      setEnviado(false);
      setMensagem("");
      setTipo("sugestao");
      setErro(null);
    }, 200);
  };

  const handleSubmit = async () => {
    if (!mensagem.trim()) {
      setErro("Escreva sua mensagem antes de enviar.");
      return;
    }
    setErro(null);
    setEnviando(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setErro("Você precisa estar logado para enviar feedback.");
      setEnviando(false);
      return;
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: userData.user.id,
      tipo,
      mensagem: mensagem.trim(),
      pagina_origem: pathname,
    });

    setEnviando(false);

    if (error) {
      setErro("Não foi possível enviar agora. Tente novamente em alguns instantes.");
      return;
    }

    setEnviado(true);
  };

  return (
    <>
      {/* Botão flutuante — posicionado acima do botão de WhatsApp para não sobrepor */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-white shadow-lg shadow-navy-900/30 transition-all hover:scale-105 hover:bg-navy-800"
        aria-label="Enviar sugestão ou melhoria"
        title="Sugestões e melhorias"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {enviado ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-status-ok-bg">
                  <CheckCircle2 className="h-7 w-7 text-status-ok" />
                </div>
                <h3 className="font-display text-lg font-semibold text-navy-900">
                  Recebemos sua mensagem!
                </h3>
                <p className="mt-1.5 text-sm text-navy-600">
                  Obrigado por ajudar a melhorar o PPCI Check IA. Vamos analisar
                  com atenção.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-5 w-full rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy-900">
                      Sugestão ou melhoria
                    </h3>
                    <p className="mt-0.5 text-sm text-navy-500">
                      Conte o que podemos fazer melhor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {TIPOS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipo(t.value)}
                      className={
                        tipo === t.value
                          ? "rounded-full bg-ember-500 px-3 py-1.5 text-xs font-semibold text-white"
                          : "rounded-full border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50"
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Escreva aqui sua sugestão, melhoria ou o problema que encontrou..."
                  rows={5}
                  className="w-full resize-none rounded-lg border border-navy-200 p-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-ember-400 focus:outline-none focus:ring-2 focus:ring-ember-100"
                />

                {erro && (
                  <p className="mt-2 text-xs font-medium text-status-bad">{erro}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={enviando}
                  className="mt-4 w-full rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
