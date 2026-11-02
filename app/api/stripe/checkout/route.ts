import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

const CARD_PRICE_ENV: Record<string, string> = {
  amador: "STRIPE_PRICE_AMADOR",
  profissional: "STRIPE_PRICE_PROFISSIONAL",
  lenda: "STRIPE_PRICE_LENDA",
};
const PIX_PRICE_ENV: Record<string, string> = {
  amador: "STRIPE_PRICE_AMADOR_PIX",
  profissional: "STRIPE_PRICE_PROFISSIONAL_PIX",
  lenda: "STRIPE_PRICE_LENDA_PIX",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") || "";
  const method = url.searchParams.get("method") || "card";
  const envName = method === "pix" ? PIX_PRICE_ENV[plan] : CARD_PRICE_ENV[plan];
  if (!envName || !["card", "pix"].includes(method)) {
    return NextResponse.json({ error: "Plano ou forma de pagamento inválida." }, { status: 400 });
  }

  try {
    const { supabase, user } = await requireUser();
    const { data: profile, error } = await supabase.from("profiles")
      .select("role,stripe_customer_id,stripe_subscription_id,plan")
      .eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (profile?.role === "veterinarian") {
      return NextResponse.json({ error: "O veterinário parceiro já possui acesso completo." }, { status: 403 });
    }

    // Uma assinatura recorrente ativa deve ser gerenciada no Portal, não substituída por um Pix paralelo.
    if (method === "card" && profile?.stripe_subscription_id && profile.stripe_customer_id) {
      const portal = await getStripe().billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${url.origin}/dashboard/assinatura`,
      });
      return NextResponse.redirect(portal.url, 303);
    }
    if (method === "pix" && profile?.stripe_subscription_id) {
      return NextResponse.redirect(new URL("/dashboard/assinatura?checkout=manage_subscription_first", url.origin), 303);
    }

    const price = process.env[envName];
    if (!price || !price.startsWith("price_")) {
      return NextResponse.json({ error: `${envName} não configurada com um Price ID válido (price_...).` }, { status: 500 });
    }

    const stripe = getStripe();
    const common = {
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : (user.email || undefined),
      metadata: { user_id: user.id, plan, payment_method: method },
      success_url: `${url.origin}/dashboard/assinatura?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/dashboard/assinatura?checkout=cancelled`,
    };

    const session = method === "pix"
      ? await stripe.checkout.sessions.create({
          ...common,
          mode: "payment",
          payment_method_types: ["pix"],
          payment_intent_data: { metadata: { user_id: user.id, plan, payment_method: "pix" } },
        })
      : await stripe.checkout.sessions.create({
          ...common,
          mode: "subscription",
          subscription_data: { metadata: { user_id: user.id, plan, payment_method: "card" } },
          allow_promotion_codes: true,
        });

    if (!session.url) throw new Error("Stripe não retornou a URL do checkout.");
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHENTICATED") {
      const login = new URL("/login", url.origin);
      login.searchParams.set("next", `/api/stripe/checkout?plan=${encodeURIComponent(plan)}&method=${encodeURIComponent(method)}`);
      return NextResponse.redirect(login, 303);
    }
    console.error("[Stripe checkout]", err);
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 });
  }
}
