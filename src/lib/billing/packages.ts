/**
 * Catálogo de pacotes de tokens do PPCI Check IA.
 *
 * ÚNICA fonte de verdade para preços/quantidades — usada pela página de
 * tokens (exibição) e pela rota de webhook da Kiwify (validação do que foi
 * de fato pago, nunca confiando em valores que viessem do request).
 *
 * ESTADO ATUAL (ver nota): por ora existe um único produto cadastrado na
 * Kiwify ("PPCI Check IA", id 3f195000-6c6b-11f1-b19e-e748c9b07ac1) sem
 * ofertas/planos diferenciados ainda. Por isso o casamento pacote↔venda no
 * webhook usa o VALOR PAGO (em centavos) como critério primário — funciona
 * tanto nesse cenário atual (1 produto, preços diferentes por compra)
 * quanto se no futuro você criar ofertas/planos separados dentro do mesmo
 * produto ou produtos distintos (nesse caso, preencha kiwifyProductId e o
 * webhook passará a usar `product_id` como critério mais específico).
 */

export type PackageKind = "avulso" | "assinatura";

export interface TokenPackage {
  id: string;
  kind: PackageKind;
  tokens: number;
  priceBRL: number;
  /** Mesmo valor de priceBRL, em centavos — usado para casar com o valor pago no webhook */
  priceCents: number;
  /** Preço por token, só para exibição/comparação na UI */
  pricePerTokenBRL: number;
  label: string;
  description: string;
  highlight?: boolean;
  /**
   * ID do produto correspondente na Kiwify. Enquanto todos os pacotes
   * compartilharem o mesmo produto único, este campo fica igual para os
   * três — o webhook usa o valor pago (priceCents) para diferenciá-los.
   * Se no futuro forem criados produtos/ofertas separados, atualizar aqui.
   */
  kiwifyProductId: string | null;
  /**
   * Link de checkout direto da Kiwify para este pacote. O cliente clica e
   * vai direto para a tela de pagamento, sem passar por carrinho.
   */
  checkoutUrl: string;
}

export const KIWIFY_PRODUCT_ID_UNICO = "3f195000-6c6b-11f1-b19e-e748c9b07ac1";

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: "avulso_10",
    kind: "avulso",
    tokens: 10,
    priceBRL: 24.9,
    priceCents: 2490,
    pricePerTokenBRL: 2.49,
    label: "Pacote avulso — 10 tokens",
    description: "Compra única, sem recorrência. Ideal para quem analisa poucos projetos por mês.",
    kiwifyProductId: KIWIFY_PRODUCT_ID_UNICO,
    checkoutUrl: "https://pay.kiwify.com.br/E5FllSG",
  },
  {
    id: "assinatura_30",
    kind: "assinatura",
    tokens: 30,
    priceBRL: 69.9,
    priceCents: 6990,
    pricePerTokenBRL: 2.33,
    label: "Assinatura mensal — 30 tokens/mês",
    description: "Renovação automática mensal. Cancele quando quiser.",
    highlight: true,
    kiwifyProductId: KIWIFY_PRODUCT_ID_UNICO,
    checkoutUrl: "https://pay.kiwify.com.br/Y9Ar0Ls",
  },
  {
    id: "assinatura_pro_60",
    kind: "assinatura",
    tokens: 60,
    priceBRL: 119.9,
    priceCents: 11990,
    pricePerTokenBRL: 2.0,
    label: "Assinatura Pro — 60 tokens/mês",
    description: "Para quem analisa projetos com frequência. Melhor preço por token.",
    kiwifyProductId: KIWIFY_PRODUCT_ID_UNICO,
    checkoutUrl: "https://pay.kiwify.com.br/loDe4yq",
  },
];

export function findPackageById(id: string): TokenPackage | undefined {
  return TOKEN_PACKAGES.find((p) => p.id === id);
}

export function findPackageByKiwifyProductId(kiwifyProductId: string): TokenPackage | undefined {
  return TOKEN_PACKAGES.find((p) => p.kiwifyProductId === kiwifyProductId);
}

/**
 * Casa um pacote pelo valor efetivamente pago (em centavos). É o critério
 * primário enquanto houver um único produto Kiwify para os três pacotes.
 * Aceita pequena tolerância (1 centavo) para evitar problemas de
 * arredondamento vindos do gateway.
 */
export function findPackageByAmountCents(amountCents: number): TokenPackage | undefined {
  return TOKEN_PACKAGES.find((p) => Math.abs(p.priceCents - amountCents) <= 1);
}

