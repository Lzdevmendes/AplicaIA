import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Cabinet Grotesk não existe no Google Fonts — arquivos baixados da Fontshare
// e servidos localmente para não depender de CDN externo em produção.
const cabinetGrotesk = localFont({
  variable: "--font-cabinet-grotesk",
  display: "swap",
  src: [
    { path: "../fonts/CabinetGrotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/CabinetGrotesk-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/CabinetGrotesk-800.woff2", weight: "800", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "AplicaAI",
  description: "Transforme a vaga em um e-mail pronto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} ${cabinetGrotesk.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
