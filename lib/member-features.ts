export const MEMBER_FEATURES = {
  "placas-gaiola-membros": {
    title: "Placas de Gaiola — Membros do Canal",
    description: "Imprima placas personalizadas das gaiolas em folhas A4, mesmo no plano Grátis. Recurso liberado individualmente pelo Owner.",
  },
} as const;

export type MemberFeatureCode = keyof typeof MEMBER_FEATURES;

export function hasExclusiveFeature(features: unknown, code: string): boolean {
  if (!features) return false;
  if (Array.isArray(features)) return features.includes(code);
  if (typeof features === "object") return Boolean((features as Record<string, unknown>)[code]);
  return false;
}
