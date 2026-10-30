import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

const PRICE_ENV: Record<string, string> = {
  amador: "STRIPE_PRICE_AMADOR",
  profissional: "STRIPE_PRICE_PROFISSIONAL",
  lenda: "STRIPE_PRICE_LENDA",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") || "";
  const envName = PRICE_ENV[plan];
  if (!envName) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

  try {
    const { supabase, user } = await requireUser();
    const { data: profile, error } = await supabase.from("profiles")
      .select("role,stripe_customer_id,stripe_subscription_id,plan")
      .eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (profile?.role === "veterinarian") {
      return NextResponse.json({ error: "O veterinário parceiro já possui acesso completo." }, { status: 403 });
    }
    const price = process.env[envName];
    if (!price || !price.startsWith("price_")) {
      return NextResponse.json({ error: `${envName} não configurada com um Price ID válido (price_...).` }, { status: 500 });
    }
    const stripe = getStripe();
    // Assinaturas existentes devem ser alteradas no Portal, evitando duplicidade.
    if (profile?.stripe_subscription_id && profile.stripe_customer_id) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id!,
        return_url: `${url.origin}/dashboard/assinatura`,
      });
      return NextResponse.redirect(portal.url, 303);
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : (user.email || undefined),
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      success_url: `${url.origin}/dashboard/assinatura?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/dashboard/assinatura?checkout=cancelled`,
      allow_promotion_codes: true,
    });
    if (!session.url) throw new Error("Stripe não retornou a URL do checkout.");
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHENTICATED") {
      const login = new URL("/login", url.origin);
      login.searchParams.set("next", `/api/stripe/checkout?plan=${encodeURIComponent(plan)}`);
      return NextResponse.redirect(login, 303);
    }
    console.error("[Stripe checkout]", err);
    return NextResponse.json({ error: "Não foi possível iniciar a assinatura." }, { status: 500 });
  }
}
