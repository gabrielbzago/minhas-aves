import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

// Payment Links da conta Stripe exclusiva do Minhas Aves.
// Os links são públicos; a identidade do usuário é enviada por client_reference_id.
const PAYMENT_LINKS: Record<string, string> = {
  amador: "https://buy.stripe.com/eVqbJ096F9U6aRjdz41B600",
  profissional: "https://buy.stripe.com/cNieVcdmV5DQe3v3Yu1B601",
  lenda: "https://buy.stripe.com/dRm14m1Ed5DQgbD7aG1B602",
};

export async function GET(request: Request) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "veterinarian") {
    return NextResponse.json(
      { error: "O veterinário parceiro já possui acesso completo. Consultas particulares são cobradas fora da assinatura do criador." },
      { status: 403 },
    );
  }

  const requestedPlan = new URL(request.url).searchParams.get("plan");
  if (!requestedPlan || !Object.prototype.hasOwnProperty.call(PAYMENT_LINKS, requestedPlan)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  const paymentUrl = new URL(PAYMENT_LINKS[requestedPlan]);
  // O webhook usa este identificador para vincular a sessão paga ao usuário Supabase
  // e identificar o plano escolhido. O valor não contém credenciais.
  paymentUrl.searchParams.set("client_reference_id", `${user.id}_${requestedPlan}`);
  if (user.email) paymentUrl.searchParams.set("prefilled_email", user.email);

  return NextResponse.redirect(paymentUrl.toString(), 303);
}
