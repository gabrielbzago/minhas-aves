import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const { supabase, user } = await requireUser();
    const { data: profile, error } = await supabase.from("profiles")
      .select("stripe_customer_id").eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (!profile?.stripe_customer_id) {
      return NextResponse.redirect(new URL("/dashboard/assinatura?portal=unavailable", url.origin));
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${url.origin}/dashboard/assinatura`,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      const login = new URL("/login", url.origin);
      login.searchParams.set("next", "/api/stripe/portal");
      return NextResponse.redirect(login, 303);
    }
    console.error("[Stripe portal]", error);
    return NextResponse.redirect(new URL("/dashboard/assinatura?portal=error", url.origin));
  }
}
