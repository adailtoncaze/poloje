import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoloJE | Gestão de Polos de Contingência e Transmissão",
  description: "Gestão e Monitoramento de Polos de Contingência e Transmissão",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-pct-bg text-pct-text antialiased">{children}</body>
    </html>
  );
}
