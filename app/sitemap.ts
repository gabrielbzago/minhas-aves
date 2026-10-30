import type { MetadataRoute } from "next";

const base = "https://minhasaves.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/politica-privacidade`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/cancelamento`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/excluir-conta`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/veterinario`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/criatorio-zago`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
