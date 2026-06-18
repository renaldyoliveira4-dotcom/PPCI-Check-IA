"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ItemRelatorio {
  sistema: string;
  norma?: string;
  status: "conforme" | "nao_conforme" | "atencao";
  item_type: string;
  description: string;
  normative_reference?: string;
  recommendation?: string;
}

export interface DadosRelatorio {
  projetoNome: string;
  clienteNome?: string;
  cidade?: string;
  estado?: string;
  areaM2?: number;
  pavimentos?: number;
  ocupacao?: string;
  analiseData: string;
  nota?: number;
  statusAprovacao?: string;
  score: number;
  conformes: number;
  atencao: number;
  naoConformes: number;
  sistemas: ItemRelatorio[];
  divergencias: ItemRelatorio[];
  pendencias: ItemRelatorio[];
  aiModel?: string;
}

function gerarHtmlImpressao(d: DadosRelatorio): string {
  const dataGeracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const corStatus = (s?: string) => {
    if (s === "Apto a protocolar") return "#166534";
    if (s === "Apto com ressalvas") return "#854d0e";
    if (s === "Requer correções") return "#854d0e";
    return "#991b1b";
  };
  const bgStatus = (s?: string) => {
    if (s === "Apto a protocolar") return "#dcfce7";
    if (s === "Apto com ressalvas") return "#fef9c3";
    if (s === "Requer correções") return "#fef9c3";
    return "#fee2e2";
  };
  const corNota = (n: number) => n >= 8 ? "#166534" : n >= 6 ? "#854d0e" : "#991b1b";

  const notaNum = d.nota != null ? Number(d.nota) : d.score / 10;
  const notaDisplay = notaNum.toFixed(1);

  const renderSistema = (item: ItemRelatorio) => {
    const borda = item.status === "conforme" ? "#22c55e" : item.status === "atencao" ? "#f59e0b" : "#ef4444";
    const bg    = item.status === "conforme" ? "#f0fdf4" : item.status === "atencao" ? "#fffbeb" : "#fff5f5";
    const cor   = item.status === "conforme" ? "#166534" : item.status === "atencao" ? "#854d0e" : "#991b1b";
    const label = item.status === "conforme" ? "CONFORME" : item.status === "atencao" ? "ATENÇÃO" : "NÃO CONFORME";
    const icone = item.status === "conforme" ? "✓" : item.status === "atencao" ? "⚠" : "✕";

    return `<div style="border:1px solid #e2e8f0;border-left:4px solid ${borda};border-radius:6px;margin-bottom:10px;overflow:hidden;page-break-inside:avoid;">
      <div style="background:${bg};padding:12px 16px;display:flex;gap:12px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-size:11px;font-weight:800;color:#1e293b;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px;">${item.sistema || ""}</div>
          ${item.norma ? `<div style="font-size:10px;color:#64748b;margin-bottom:5px;">${item.norma}${item.normative_reference ? " · " + item.normative_reference : ""}</div>` : ""}
          <div style="font-size:11.5px;color:#374151;line-height:1.55;">${item.description}</div>
          ${item.recommendation ? `<div style="margin-top:8px;padding:8px 10px;background:rgba(255,255,255,0.75);border-radius:4px;border:1px solid #e2e8f0;font-size:10.5px;color:#1e293b;"><span style="font-weight:700;color:#64748b;text-transform:uppercase;font-size:9px;letter-spacing:0.05em;">Recomendação: </span>${item.recommendation}</div>` : ""}
        </div>
        <div style="flex-shrink:0;text-align:center;min-width:64px;">
          <div style="width:28px;height:28px;border-radius:50%;background:${cor};color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 3px;">${icone}</div>
          <div style="font-size:9px;font-weight:700;color:${cor};text-transform:uppercase;letter-spacing:0.04em;">${label}</div>
        </div>
      </div>
    </div>`;
  };

  const sistemasSorted = [
    ...d.sistemas.filter(i => i.status === "nao_conforme"),
    ...d.sistemas.filter(i => i.status === "atencao"),
    ...d.sistemas.filter(i => i.status === "conforme"),
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório PPCI – ${d.projetoNome}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      font-size: 11.5px;
      line-height: 1.5;
      color: #1e293b;
      background: #fff;
    }

    /* ── LAYOUT GERAL ── */
    .page { max-width: 800px; margin: 0 auto; padding: 0; }

    /* ── CABEÇALHO ── */
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: #fff;
      padding: 28px 36px 24px;
    }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon {
      width: 38px; height: 38px; border-radius: 8px;
      background: #ef4444;
      font-size: 18px; font-weight: 800; color: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-name { font-size: 15px; font-weight: 700; }
    .logo-sub  { font-size: 9.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
    .doc-ref   { text-align: right; font-size: 9.5px; color: #94a3b8; }
    .doc-ref strong { display: block; font-size: 11px; color: #cbd5e1; margin-bottom: 2px; }
    .header-div { border-top: 1px solid rgba(255,255,255,0.12); margin: 0 0 18px; }
    .header-bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .proj-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 3px; }
    .proj-sub   { font-size: 10.5px; color: #94a3b8; }
    .badges     { display: flex; gap: 8px; flex-shrink: 0; }
    .badge-item {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18);
      border-radius: 6px; padding: 6px 12px; text-align: center;
    }
    .badge-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; }
    .badge-value { font-size: 11px; font-weight: 700; color: #e2e8f0; margin-top: 1px; }

    /* ── RESULTADO ── */
    .result-strip {
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      padding: 20px 36px;
      display: flex; gap: 24px; align-items: center;
    }
    .score-ring {
      width: 90px; height: 90px; border-radius: 50%;
      border: 5px solid #e2e8f0; background: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: 0 1px 6px rgba(0,0,0,0.07); flex-shrink: 0;
    }
    .score-num   { font-size: 26px; font-weight: 800; line-height: 1; }
    .score-label { font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 1px; }
    .score-title { font-size: 9.5px; color: #64748b; font-weight: 600; text-align: center; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
    .status-col  { flex: 1; }
    .status-pill {
      display: inline-block; padding: 6px 14px; border-radius: 6px;
      font-size: 12px; font-weight: 700; margin-bottom: 12px;
    }
    .counters { display: flex; gap: 10px; }
    .counter  {
      flex: 1; background: #fff; border: 1px solid #e2e8f0;
      border-radius: 6px; padding: 10px 12px; text-align: center;
    }
    .counter-n { font-size: 22px; font-weight: 800; line-height: 1; }
    .counter-l { font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 3px; }

    /* ── SEÇÕES ── */
    .section { padding: 20px 36px; border-bottom: 1px solid #e2e8f0; }
    .section:last-child { border-bottom: none; }
    .section-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: #64748b;
      display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
    }
    .section-title::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

    /* ── TABELA DE DADOS ── */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .info-cell { padding: 9px 13px; border-bottom: 1px solid #e2e8f0; }
    .info-cell:nth-child(odd)  { background: #f8fafc; border-right: 1px solid #e2e8f0; }
    .info-cell:nth-child(even) { background: #fff; }
    .info-cell:nth-last-child(-n+2) { border-bottom: none; }
    .info-lbl { font-size: 9.5px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-val { font-size: 11.5px; color: #1e293b; font-weight: 600; margin-top: 1px; }

    /* ── LISTAS SIMPLES (DIVERGÊNCIAS / PENDÊNCIAS) ── */
    .simple-item { display: flex; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #374151; line-height: 1.5; }
    .simple-item:last-child { border-bottom: none; }
    .dot { width: 18px; height: 18px; border-radius: 50%; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }

    /* ── AVISO TÉCNICO ── */
    .aviso {
      margin: 0 36px 28px;
      padding: 14px 16px;
      background: #fffbeb; border: 1px solid #f59e0b; border-radius: 6px;
      display: flex; gap: 12px; page-break-inside: avoid;
    }
    .aviso-icon { font-size: 16px; flex-shrink: 0; }
    .aviso-title { font-size: 11px; font-weight: 700; color: #92400e; margin-bottom: 3px; }
    .aviso-text  { font-size: 10.5px; color: #78350f; line-height: 1.55; }

    /* ── RODAPÉ ── */
    .footer {
      background: #0f172a; color: #64748b;
      padding: 16px 36px;
      font-size: 10px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer strong { color: #94a3b8; }

    /* ── IMPRESSÃO ── */
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- CABEÇALHO -->
  <div class="header">
    <div class="header-top">
      <div class="logo">
        <div class="logo-icon">P</div>
        <div>
          <div class="logo-name">PPCI Check IA</div>
          <div class="logo-sub">Pré-análise Técnica de Conformidade</div>
        </div>
      </div>
      <div class="doc-ref">
        <strong>Relatório de Pré-Análise</strong>
        Gerado em ${dataGeracao}
      </div>
    </div>
    <div class="header-div"></div>
    <div class="header-bottom">
      <div>
        <div class="proj-title">${d.projetoNome}</div>
        <div class="proj-sub">
          ${[d.clienteNome, d.cidade && d.estado ? `${d.cidade}/${d.estado}` : (d.cidade || d.estado)].filter(Boolean).join("  ·  ")}
        </div>
      </div>
      <div class="badges">
        ${d.areaM2     ? `<div class="badge-item"><div class="badge-label">Área</div><div class="badge-value">${d.areaM2.toLocaleString("pt-BR")} m²</div></div>` : ""}
        ${d.pavimentos ? `<div class="badge-item"><div class="badge-label">Pavimentos</div><div class="badge-value">${d.pavimentos}</div></div>` : ""}
        ${d.ocupacao   ? `<div class="badge-item"><div class="badge-label">Ocupação</div><div class="badge-value">${d.ocupacao}</div></div>` : ""}
      </div>
    </div>
  </div>

  <!-- RESULTADO -->
  <div class="result-strip">
    <div>
      <div class="score-ring">
        <div class="score-num" style="color:${corNota(notaNum)};">${notaDisplay}</div>
        <div class="score-label">de 10</div>
      </div>
      <div class="score-title">Nota Técnica</div>
    </div>
    <div class="status-col">
      ${d.statusAprovacao ? `<div class="status-pill" style="background:${bgStatus(d.statusAprovacao)};color:${corStatus(d.statusAprovacao)};">${d.statusAprovacao}</div>` : ""}
      <div class="counters">
        <div class="counter"><div class="counter-n" style="color:#166534;">${d.conformes}</div><div class="counter-l">Conformes</div></div>
        <div class="counter"><div class="counter-n" style="color:#854d0e;">${d.atencao}</div><div class="counter-l">Atenção</div></div>
        <div class="counter"><div class="counter-n" style="color:#991b1b;">${d.naoConformes}</div><div class="counter-l">Não conformes</div></div>
      </div>
    </div>
  </div>

  <!-- DADOS DO PROJETO -->
  <div class="section">
    <div class="section-title">Dados do Projeto</div>
    <div class="info-grid">
      <div class="info-cell"><div class="info-lbl">Projeto</div><div class="info-val">${d.projetoNome}</div></div>
      <div class="info-cell"><div class="info-lbl">Cliente</div><div class="info-val">${d.clienteNome || "—"}</div></div>
      <div class="info-cell"><div class="info-lbl">Localização</div><div class="info-val">${d.cidade && d.estado ? `${d.cidade}/${d.estado}` : d.cidade || d.estado || "—"}</div></div>
      <div class="info-cell"><div class="info-lbl">Ocupação</div><div class="info-val">${d.ocupacao || "—"}</div></div>
      <div class="info-cell"><div class="info-lbl">Área construída</div><div class="info-val">${d.areaM2 ? d.areaM2.toLocaleString("pt-BR") + " m²" : "—"}</div></div>
      <div class="info-cell"><div class="info-lbl">Pavimentos</div><div class="info-val">${d.pavimentos || "—"}</div></div>
      <div class="info-cell"><div class="info-lbl">Data da análise</div><div class="info-val">${new Date(d.analiseData).toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"})}</div></div>
      <div class="info-cell"><div class="info-lbl">Modelo de IA</div><div class="info-val">${d.aiModel || "Claude (Anthropic)"}</div></div>
    </div>
  </div>

  <!-- SISTEMAS AUDITADOS -->
  ${sistemasSorted.length > 0 ? `
  <div class="section">
    <div class="section-title">Sistemas Auditados (${sistemasSorted.length})</div>
    ${sistemasSorted.map(renderSistema).join("")}
  </div>` : ""}

  <!-- DIVERGÊNCIAS -->
  ${d.divergencias.length > 0 ? `
  <div class="section">
    <div class="section-title">Divergências Identificadas (${d.divergencias.length})</div>
    ${d.divergencias.map(i => `<div class="simple-item"><div class="dot" style="background:#f59e0b;">!</div><span>${i.description}</span></div>`).join("")}
  </div>` : ""}

  <!-- PENDÊNCIAS -->
  ${d.pendencias.length > 0 ? `
  <div class="section">
    <div class="section-title">Pendências para Revisão (${d.pendencias.length})</div>
    ${d.pendencias.map(i => `<div class="simple-item"><div class="dot" style="background:#f97316;">→</div><span>${i.description}</span></div>`).join("")}
  </div>` : ""}

  <!-- AVISO TÉCNICO -->
  <div class="aviso">
    <div class="aviso-icon">⚠️</div>
    <div>
      <div class="aviso-title">Aviso importante</div>
      <div class="aviso-text">Este relatório é uma <strong>pré-análise técnica de apoio</strong> gerada por Inteligência Artificial com base nos documentos fornecidos. <strong>Não substitui</strong> a análise oficial do Corpo de Bombeiros Militar da Bahia (CBMBA), o trabalho do projetista responsável, nem garante aprovação do projeto. A responsabilidade técnica final é sempre do profissional habilitado.</div>
    </div>
  </div>

  <!-- RODAPÉ -->
  <div class="footer">
    <div><strong>PPCI Check IA</strong> &nbsp;·&nbsp; Ferramenta de pré-análise técnica</div>
    <div>Relatório gerado em ${dataGeracao}</div>
  </div>

</div>

<script>
  // Abre o diálogo de impressão automaticamente ao carregar a página
  window.onload = function() {
    window.print();
  };
<\/script>
</body>
</html>`;
}

export function DownloadRelatorio({ dados }: { dados: DadosRelatorio }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = () => {
    setLoading(true);
    try {
      const html = gerarHtmlImpressao(dados);
      const janela = window.open("", "_blank");
      if (!janela) {
        // Fallback: se o popup foi bloqueado, baixa como HTML
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const nomeSafe = dados.projetoNome.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        a.href = url;
        a.download = `relatorio_ppci_${nomeSafe}.html`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      janela.document.write(html);
      janela.document.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handlePrint} isLoading={loading}>
      <Download className="h-4 w-4" />
      Baixar PDF
    </Button>
  );
}
