import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = "https://minhasaves.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Minhas Aves | Gestão de Criatórios",
    template: "%s | Minhas Aves",
  },
  description:
    "Organize seu criatório em um só lugar. Gerencie aves, anilhas, genealogia, reprodução, documentos e histórico veterinário com o Minhas Aves.",
  applicationName: "Minhas Aves",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Minhas Aves",
    images: ["/branding/apollo-logo.png"],
    title: "Minhas Aves | Gestão de Criatórios",
    description:
      "Gestão inteligente de aves, anilhas, genealogia, reprodução e histórico veterinário.",
  },
  twitter: {
    card: "summary",
    title: "Minhas Aves | Gestão de Criatórios",
    description: "Organize seu criatório em um só lugar.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
