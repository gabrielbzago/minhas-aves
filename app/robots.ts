import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/politica-privacidade", "/termos", "/cancelamento", "/excluir-conta", "/veterinario", "/criatorio-zago"],
      disallow: ["/dashboard/", "/api/", "/login", "/cadastro", "/auth/"],
    },
    sitemap: "https://minhasaves.com.br/sitemap.xml",
    host: "https://minhasaves.com.br",
  };
}
