import type { Metadata } from "next";
import { Inter, Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PPCI Check IA",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="font-sans">
        <ServiceWorkerRegister />
        <MetaPixel />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
