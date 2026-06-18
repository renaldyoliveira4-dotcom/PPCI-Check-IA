import type { Metadata } from "next";
import { Inter, Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PPCI Check IA — Pré-análise inteligente de PPCI",
  description:
    "Faça uma pré-análise técnica do seu projeto de prevenção e combate a incêndio antes de protocolar no Corpo de Bombeiros.",
  keywords: [
    "PPCI",
    "Corpo de Bombeiros",
    "segurança contra incêndio",
    "análise de projetos",
    "engenharia",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
