import type { PlanCode } from "@/lib/plans";

export const CONVERSION_COPY = {
  freeDashboard: {
    eyebrow: "SEU CRIATÓRIO PODE IR MAIS LONGE",
    title: "Criadores que se destacam cuidam de cada detalhe.",
    description: "Dê o próximo passo na gestão do seu plantel: tenha mais capacidade, controle de anilhas, organização avançada e ferramentas inteligentes para ganhar tempo.",
    cta: "Conhecer os planos",
  },
  lockedFeature: {
    eyebrow: "UM NOVO NÍVEL DE GESTÃO",
    title: "Desbloqueie todo o potencial do Apollo.",
    description: "Este recurso faz parte de um plano superior. Faça upgrade para trabalhar com mais organização, produtividade e controle do seu criatório.",
    cta: "Desbloquear este recurso",
  },
  aiLimit: {
    title: "Sua experiência gratuita foi concluída neste mês.",
    description: "Continue evoluindo com o Apollo Criatório Amador: até 15 análises por mês, com fotos da frente e do verso da plaquinha. Seu cadastro manual continua disponível no plano Grátis.",
    cta: "Quero evoluir para o Profissional",
  },
} as const;

export const PLAN_MARKETING: Record<PlanCode, {headline:string; highlights:string[]}> = {
  free: { headline: "Comece a organizar seu criatório", highlights: ["Até 5 aves", "Gestão essencial do plantel", "1 análise de plaquinha por mês com IA"] },
  amador: { headline: "Mais organização para o seu criatório", highlights: ["Plantel ilimitado", "Gestão de anilhas, fotos e documentos", "15 análises de plaquinha por foto com IA por mês", "Cartões, fichas e impressões"] },
  profissional: { headline: "Mais inteligência e controle para crescer", highlights: ["Gestão de reprodução e saúde", "Até 30 análises de IA por mês", "Foto do verso e genealogia por IA"] },
  lenda: { headline: "A experiência mais completa do Apollo", highlights: ["Tudo do Profissional", "Análises de IA ilimitadas", "Benefício veterinário anual incluso"] },
};

export function planCheckoutHref(plan: string) {
  return `/api/stripe/checkout?plan=${encodeURIComponent(plan)}`;
}
