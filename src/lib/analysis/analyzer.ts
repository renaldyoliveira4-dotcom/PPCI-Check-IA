import type { Project, ItemStatus, RiskLevel } from "@/types";

export type GeneratedItem = {
  category: string;
  status: ItemStatus;
  description: string;
  recommendation: string;
  normative_reference: string;
  risk_level: RiskLevel;
};

export type AnalysisResult = {
  score: number;
  summary: string;
  total_items: number;
  conforming_items: number;
  warning_items: number;
  non_conforming_items: number;
  items: GeneratedItem[];
};

/**
 * Gera uma pré-análise simulada com base nos dados informados pelo usuário.
 *
 * IMPORTANTE: Esta é uma análise de apoio técnico baseada em regras pré-definidas.
 * NÃO substitui a análise oficial do Corpo de Bombeiros e NÃO garante aprovação.
 * Em versões futuras, esta função será substituída por análise via IA do PDF.
 */
export function generateAnalysis(project: Project): AnalysisResult {
  const items: GeneratedItem[] = [];

  // 1. Análise de Ocupação
  if (!project.occupancy_type) {
    items.push({
      category: "Ocupação",
      status: "nao_conforme",
      description: "Tipo de ocupação não informado no cadastro do projeto.",
      recommendation:
        "Informe o grupo e divisão de ocupação conforme classificação aplicável (ex: A-1 residencial, F-8 reunião de público).",
      normative_reference: "IT-42 / Decreto Estadual 16.302/2015",
      risk_level: "alto",
    });
  } else {
    items.push({
      category: "Ocupação",
      status: "conforme",
      description: `Ocupação classificada como ${project.occupancy_type}.`,
      recommendation:
        "Confirme se a classificação está coerente com o uso real da edificação no memorial descritivo.",
      normative_reference: "IT-42",
      risk_level: "baixo",
    });
  }

  // 2. Área construída
  const area = Number(project.built_area || 0);
  if (area <= 0) {
    items.push({
      category: "Área construída",
      status: "nao_conforme",
      description: "Área construída não informada.",
      recommendation:
        "Informar a área construída total. É um dado essencial para definir as exigências mínimas de segurança.",
      normative_reference: "IT-42",
      risk_level: "alto",
    });
  } else if (area > 750) {
    items.push({
      category: "Área construída",
      status: "atencao",
      description: `Área construída de ${area} m² ultrapassa o limite do Projeto Técnico Simplificado.`,
      recommendation:
        "Edificações acima de 750 m² geralmente exigem Projeto Técnico completo, não simplificado. Verifique a IT aplicável e ajuste a documentação.",
      normative_reference: "IT-42, item 5",
      risk_level: "medio",
    });
  } else {
    items.push({
      category: "Área construída",
      status: "conforme",
      description: `Área construída de ${area} m² compatível com Projeto Técnico Simplificado.`,
      recommendation: "Nenhuma correção necessária para este item.",
      normative_reference: "IT-42",
      risk_level: "baixo",
    });
  }

  // 3. Pavimentos e escadas
  const floors = Number(project.floors || 0);
  if (floors <= 0) {
    items.push({
      category: "Escadas",
      status: "nao_conforme",
      description: "Número de pavimentos não informado.",
      recommendation:
        "Informar o número de pavimentos para que se possa avaliar a necessidade de escadas de segurança, enclausuramento e antecâmaras.",
      normative_reference: "IT-11",
      risk_level: "alto",
    });
  } else if (floors >= 3) {
    items.push({
      category: "Escadas",
      status: "atencao",
      description: `Edificação com ${floors} pavimentos pode exigir escada protegida ou enclausurada.`,
      recommendation:
        "Verifique se as escadas atendem aos requisitos de proteção, ventilação, antecâmara e PAF conforme IT-11. Detalhe na prancha de arquitetura.",
      normative_reference: "IT-11, item 5",
      risk_level: "medio",
    });
  } else {
    items.push({
      category: "Escadas",
      status: "conforme",
      description: `Edificação com ${floors} pavimento(s) — exigências mínimas de escadas atendidas em princípio.`,
      recommendation:
        "Confirme dimensões dos degraus, patamares e corrimãos no projeto arquitetônico.",
      normative_reference: "IT-11",
      risk_level: "baixo",
    });
  }

  // 4. Saídas de emergência
  items.push({
    category: "Saídas de emergência",
    status: "atencao",
    description:
      "Verificação automática da lotação e número de saídas exige leitura das pranchas.",
    recommendation:
      "Confirme se a lotação foi calculada conforme tabela 5 da IT-11 e se o número, largura e distância máxima das saídas atendem aos parâmetros.",
    normative_reference: "IT-11, tabela 5",
    risk_level: "medio",
  });

  // 5. Largura de portas
  items.push({
    category: "Largura de portas",
    status: "atencao",
    description:
      "Largura mínima das portas de saída deve ser verificada nas plantas.",
    recommendation:
      "Garantir 0,80 m (uma unidade de passagem) para até 100 pessoas e dimensionar conforme cálculo da população nas demais.",
    normative_reference: "IT-11, item 5.5",
    risk_level: "medio",
  });

  // 6. Extintores
  items.push({
    category: "Extintores",
    status: "atencao",
    description:
      "Distribuição, capacidade extintora e tipo dos extintores precisam estar indicados em planta.",
    recommendation:
      "Indicar na planta o tipo (água, pó ABC, CO2), capacidade extintora (ex: 2-A:20-B:C) e distância máxima de caminhamento de 20 m.",
    normative_reference: "IT-21",
    risk_level: "medio",
  });

  // 7. Sinalização de emergência
  items.push({
    category: "Sinalização de emergência",
    status: "atencao",
    description:
      "Sinalização de orientação, alerta, proibição e equipamentos deve constar no projeto.",
    recommendation:
      "Detalhar placas fotoluminescentes de saída, rotas de fuga e equipamentos conforme tamanhos e cores da IT-20.",
    normative_reference: "IT-20",
    risk_level: "medio",
  });

  // 8. Iluminação de emergência
  if (area >= 200 || floors >= 2) {
    items.push({
      category: "Iluminação de emergência",
      status: "atencao",
      description:
        "Iluminação de emergência obrigatória para esta edificação.",
      recommendation:
        "Apresentar projeto com pontos de luz, autonomia mínima de 1 hora e nível de iluminamento mínimo de 5 lux nas rotas de fuga.",
      normative_reference: "IT-18",
      risk_level: "medio",
    });
  } else {
    items.push({
      category: "Iluminação de emergência",
      status: "conforme",
      description:
        "Edificação de pequeno porte — iluminação de emergência simplificada.",
      recommendation: "Confirmar pontos mínimos no projeto luminotécnico.",
      normative_reference: "IT-18",
      risk_level: "baixo",
    });
  }

  // 9. Hidrantes
  if (area >= 750 || floors >= 3) {
    items.push({
      category: "Hidrantes",
      status: "nao_conforme",
      description:
        "Sistema de hidrantes provavelmente obrigatório, mas não há indicação automática no cadastro.",
      recommendation:
        "Apresentar projeto hidráulico com reserva técnica de incêndio (RTI), pressão e vazão dos hidrantes conforme IT-22.",
      normative_reference: "IT-22",
      risk_level: "alto",
    });
  } else {
    items.push({
      category: "Hidrantes",
      status: "conforme",
      description: "Hidrantes podem não ser exigidos para esta edificação.",
      recommendation:
        "Verifique na tabela 6.A da IT-22 se há dispensa para o porte e ocupação informados.",
      normative_reference: "IT-22",
      risk_level: "baixo",
    });
  }

  // 10. Alarme de incêndio
  if (floors >= 2 || area >= 500) {
    items.push({
      category: "Alarme de incêndio",
      status: "atencao",
      description:
        "Sistema de detecção e alarme pode ser exigido para o porte da edificação.",
      recommendation:
        "Verificar exigência conforme tabela 6.A da IT-22 e apresentar projeto com central, acionadores manuais e avisadores sonoros.",
      normative_reference: "IT-22 / NBR 17240",
      risk_level: "medio",
    });
  } else {
    items.push({
      category: "Alarme de incêndio",
      status: "conforme",
      description: "Edificação possivelmente dispensada de alarme.",
      recommendation: "Confirmar dispensa na norma específica.",
      normative_reference: "IT-22",
      risk_level: "baixo",
    });
  }

  // 11. Documentação obrigatória
  items.push({
    category: "Documentação obrigatória",
    status: "atencao",
    description:
      "Documentação completa do projeto técnico deve ser verificada.",
    recommendation:
      "Anexar: ART/RRT do responsável técnico, memorial descritivo, plantas baixas com simbologia padrão, planta de situação e cortes.",
    normative_reference: "Decreto Estadual 16.302/2015",
    risk_level: "medio",
  });

  // 12. Memorial descritivo
  items.push({
    category: "Memorial descritivo",
    status: "atencao",
    description:
      "Memorial descritivo deve detalhar o sistema de segurança contra incêndio.",
    recommendation:
      "Incluir descrição da edificação, cálculo da população, sistemas instalados, normas adotadas e responsável técnico.",
    normative_reference: "IT-42",
    risk_level: "medio",
  });

  // Estatísticas
  const total = items.length;
  const conforming = items.filter((i) => i.status === "conforme").length;
  const warning = items.filter((i) => i.status === "atencao").length;
  const nonConforming = items.filter((i) => i.status === "nao_conforme").length;

  // Score: conforme = 100%, atenção = 50%, não conforme = 0%
  const score = Math.round(
    ((conforming * 100 + warning * 50) / (total * 100)) * 100
  );

  const summary = generateSummary(project, score, conforming, warning, nonConforming);

  return {
    score,
    summary,
    total_items: total,
    conforming_items: conforming,
    warning_items: warning,
    non_conforming_items: nonConforming,
    items,
  };
}

function generateSummary(
  project: Project,
  score: number,
  conforming: number,
  warning: number,
  nonConforming: number
): string {
  const parts: string[] = [];

  parts.push(
    `Pré-análise técnica do projeto "${project.name}"${
      project.client_name ? ` — cliente ${project.client_name}` : ""
    }.`
  );

  if (score >= 80) {
    parts.push(
      `O projeto apresenta ${score}% de conformidade preliminar, com boa aderência às normas analisadas.`
    );
  } else if (score >= 60) {
    parts.push(
      `O projeto apresenta ${score}% de conformidade preliminar. Há pontos relevantes a revisar antes do protocolo.`
    );
  } else {
    parts.push(
      `O projeto apresenta ${score}% de conformidade preliminar. Há diversas pendências críticas que devem ser corrigidas antes do protocolo no Corpo de Bombeiros.`
    );
  }

  parts.push(
    `Foram identificados ${conforming} itens conformes, ${warning} itens de atenção e ${nonConforming} possíveis não conformidades.`
  );

  parts.push(
    "Esta análise é uma ferramenta de apoio técnico e não substitui a avaliação oficial do Corpo de Bombeiros nem garante aprovação do projeto."
  );

  return parts.join(" ");
}
