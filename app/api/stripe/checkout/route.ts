import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

// Payment Links da conta Stripe exclusiva do Minhas Aves.
const PAYMENT_LINKS: Record<string, string> = {
  amador: "https://buy.stripe.com/eVqbJ096F9U6aRjdz41B600",
  profissional: "https://buy.stripe.com/cNieVcdmV5DQe3v3Yu1B601",
  lenda: "https://buy.stripe.com/dRm14m1Ed5DQgbD7aG1B602",
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedPlan = requestUrl.searchParams.get("plan");

  if (!requestedPlan || !Object.prototype.hasOwnProperty.call(PAYMENT_LINKS, requestedPlan)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  let auth: Awaited<ReturnType<typeof requireUser>>;
  try {
    auth = await requireUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      // Visitante precisa entrar primeiro; após login, volta exatamente para este plano.
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("next", `/api/stripe/checkout?plan=${encodeURIComponent(requestedPlan)}`);
      return NextResponse.redirect(loginUrl, 303);
    }
    console.error("[Apollo] erro ao validar sessão antes do checkout:", error);
    return NextResponse.json({ error: "Não foi possível validar sua sessão. Entre novamente e tente outra vez." }, { status: 500 });
  }

  const { supabase, user } = auth;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[Apollo] erro ao consultar perfil para checkout:", profileError.message);
    return NextResponse.json({ error: "Não foi possível consultar seu perfil. Tente novamente." }, { status: 500 });
  }

  if (profile?.role === "veterinarian") {
    return NextResponse.json(
      { error: "O veterinário parceiro já possui acesso completo. Consultas particulares são cobradas fora da assinatura do criador." },
      { status: 403 },
    );
  }

  const paymentUrl = new URL(PAYMENT_LINKS[requestedPlan]);
  paymentUrl.searchParams.set("client_reference_id", `${user.id}_${requestedPlan}`);
  if (user.email) paymentUrl.searchParams.set("prefilled_email", user.email);

  return NextResponse.redirect(paymentUrl.toString(), 303);
}
