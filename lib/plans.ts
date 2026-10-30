export const PLAN_INFO = {
  free: { label: "Grátis", maxBirds: 5, annualPrice: 0 },
  amador: { label: "Criatório Amador", maxBirds: null, annualPrice: 149.90 },
  profissional: { label: "Criatório Profissional", maxBirds: null, annualPrice: 249.90 },
  lenda: { label: "Criador Lenda", maxBirds: null, annualPrice: 349.90 },
} as const;

export type PlanCode = keyof typeof PLAN_INFO;

const commonPaid = [
  "importacao-anilha", "gestao-anilhas", "gestao-ave", "galeria-fotos", "gestao-documentos",
  "gestao-gaiola", "historico-ave", "comportamento", "genealogia", "painel", "cartao-gaiola",
  "imprimir-ficha", "imprimir-plantel", "certificado-genealogia",
];

export const PLAN_FEATURES: Record<PlanCode, Set<string>> = {
  free: new Set(["gestao-ave", "historico-ave", "genealogia", "painel", "especies", "cartao-gaiola", "agendar-veterinario"]),
  amador: new Set([...commonPaid, "agendar-veterinario"]),
  profissional: new Set([...commonPaid, "sms", "reproducao", "doencas", "medicamentos", "genotipagem", "sexagem", "agendar-veterinario", "modulo-veterinario"]),
  lenda: new Set([...commonPaid, "sms", "reproducao", "doencas", "medicamentos", "genotipagem", "sexagem", "agendar-veterinario", "consulta-veterinaria-inclusa", "modulo-veterinario"]),
};

export const PLAN_ORDER: PlanCode[] = ["free", "amador", "profissional", "lenda"];

export const PLAN_BENEFITS: Record<PlanCode, string[]> = {
  free: [
    "Até 5 aves", "Cadastro e gestão das aves", "Histórico e genealogia",
    "Pré-visualização do cartão de gaiola", "Agendamento veterinário", "Controle pelo celular",
  ],
  amador: [
    "Tudo do Grátis", "Plantel ilimitado", "Gestão de anilhas", "Fotos, documentos e gaiolas",
    "Comportamento e registros avançados", "Cartões e impressões", "Impressão de ficha, plantel e genealogia", "Certificado genealógico individual com árvore até trisavós",
  ],
  profissional: [
    "Tudo do Criatório Amador", "Gestão de reprodução", "Doenças e acompanhamento", "Medicamentos",
    "Genotipagem", "Sexagem", "Notificações por SMS", "Módulo Veterinário completo",
  ],
  lenda: [
    "Tudo do Criatório Profissional", "1 consulta veterinária inclusa por período anual pago",
    "1 ave por consulta inclusa", "Histórico veterinário permanente", "Prontuário + receita em PDF",
    "Novo benefício a cada renovação", "Módulo Veterinário completo",
  ],
};

export function effectivePlan(plan?: string | null, role?: string | null): PlanCode {
  if (role === "veterinarian") return "lenda";
  return normalizePlan(plan);
}
export function normalizePlan(plan?: string | null): PlanCode {
  if (plan === "amador" || plan === "profissional" || plan === "lenda") return plan;
  return "free";
}
export function hasFeature(plan: string | null | undefined, feature: string) {
  return PLAN_FEATURES[normalizePlan(plan)].has(feature);
}

export function isAmadorTrialActive(args: {
  plan?: string | null;
  role?: string | null;
  eligible?: boolean | null;
  startedAt?: string | Date | null;
  endsAt?: string | Date | null;
  now?: Date;
}) {
  const p = normalizePlan(args.plan);
  if (p !== "free" || args.role === "veterinarian" || args.role === "owner" || !args.eligible) return false;
  if (!args.startedAt || !args.endsAt) return false;
  const now = args.now ?? new Date();
  return new Date(args.startedAt).getTime() <= now.getTime() && now.getTime() < new Date(args.endsAt).getTime();
}

export function hasFeatureAccess(plan: string | null | undefined, feature: string, trial?: {
  role?: string | null;
  eligible?: boolean | null;
  startedAt?: string | Date | null;
  endsAt?: string | Date | null;
}) {
  if (hasFeature(plan, feature)) return true;
  const featureIsAmador = PLAN_FEATURES.amador.has(feature) && !PLAN_FEATURES.free.has(feature);
  if (featureIsAmador) {
    return isAmadorTrialActive({
      plan, role: trial?.role, eligible: trial?.eligible,
      startedAt: trial?.startedAt, endsAt: trial?.endsAt,
    });
  }
  return false;
}

export function planRank(plan?: string | null) { return PLAN_ORDER.indexOf(normalizePlan(plan)); }
export function isPlanAtLeast(plan: string | null | undefined, required: PlanCode) { return planRank(plan) >= PLAN_ORDER.indexOf(required); }
export function planLabel(plan?: string | null) { return PLAN_INFO[normalizePlan(plan)].label; }
export function requiredPlanForFeature(feature: string): PlanCode {
  for (const plan of PLAN_ORDER) if (PLAN_FEATURES[plan].has(feature)) return plan;
  return "lenda";
}
