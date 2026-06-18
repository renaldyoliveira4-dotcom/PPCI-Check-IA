"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DownloadRelatorioProps {
  projetoNome: string;
  conteudoHtmlId?: string;
}

export function DownloadRelatorio({ projetoNome, conteudoHtmlId = "relatorio-content" }: DownloadRelatorioProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);

    try {
      // Captura o conteúdo da página renderizada
      const conteudo = document.getElementById(conteudoHtmlId);
      if (!conteudo) {
        setLoading(false);
        return;
      }

      // Estilos inline para o PDF/HTML ficar legível sem os CSS do Next.js
      const estilos = `
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a2033; background: #fff; padding: 32px; max-width: 960px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
          h1 { font-size: 24px; font-weight: 700; color: #1a2033; margin-bottom: 8px; }
          h2 { font-size: 18px; font-weight: 600; color: #1a2033; margin-bottom: 12px; }
          h3 { font-size: 15px; font-weight: 600; color: #1a2033; margin-bottom: 8px; }
          p { color: #4a5568; margin-bottom: 8px; }
          .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 20px; background: #fff; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; }
          .badge-ok { background: #dcfce7; color: #166534; }
          .badge-warn { background: #fef9c3; color: #854d0e; }
          .badge-bad { background: #fee2e2; color: #991b1b; }
          .sistema-row { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
          .sistema-row.conforme { border-left: 4px solid #22c55e; }
          .sistema-row.atencao { border-left: 4px solid #f59e0b; }
          .sistema-row.nao_conforme { border-left: 4px solid #ef4444; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .nota { font-size: 48px; font-weight: 700; }
          .nota-ok { color: #22c55e; }
          .nota-warn { color: #f59e0b; }
          .nota-bad { color: #ef4444; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          th { background: #f8fafc; font-weight: 600; color: #475569; }
          .header-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
          .rodape { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #9ca3af; text-align: center; }
        </style>
      `;

      // Clona o conteúdo e limpa atributos de classe Tailwind para o HTML exportado
      const clone = conteudo.cloneNode(true) as HTMLElement;

      // Remove botões de ação do relatório exportado (imprimir, download, etc)
      clone.querySelectorAll("[data-no-print]").forEach((el) => el.remove());

      const nomeSafe = projetoNome.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const dataHoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");

      const htmlCompleto = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório PPCI – ${projetoNome}</title>
  ${estilos}
</head>
<body>
  <div class="header-info">
    <div>
      <div class="badge" style="margin-bottom:8px">PPCI Check IA</div>
      <h1>${projetoNome}</h1>
      <p class="meta">Relatório gerado em ${new Date().toLocaleString("pt-BR")}</p>
    </div>
  </div>
  <hr>
  ${clone.innerHTML}
  <div class="rodape">
    Relatório gerado pelo PPCI Check IA · Ferramenta de apoio técnico. Não substitui a análise oficial do Corpo de Bombeiros e não garante aprovação do projeto.
  </div>
</body>
</html>`;

      const blob = new Blob([htmlCompleto], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio_ppci_${nomeSafe}_${dataHoje}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} isLoading={loading} data-no-print>
      <Download className="h-4 w-4" />
      Baixar relatório
    </Button>
  );
}
