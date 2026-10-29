import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PLANS = {
  free: { label: "Grátis" },
  amador: { label: "Criatório Amador" },
  profissional: { label: "Criatório Profissional" },
  lenda: { label: "Criador Lenda" },
} as const;
type Plan = keyof typeof PLANS;

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const ownerEmail = (process.env.OWNER_EMAIL || "gabrielzago@gmail.com").trim().toLowerCase();
    if ((user.email || "").trim().toLowerCase() !== ownerEmail) return NextResponse.json({ error: "Acesso restrito ao owner." }, { status: 403 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "owner") {
      const { error: promoteError } = await createAdminClient().from("profiles").update({ role: "owner" }).eq("id", user.id);
      if (promoteError) return NextResponse.json({ error: "Não foi possível confirmar o perfil Owner no banco: " + promoteError.message }, { status: 500 });
    }
    const body = await request.json().catch(() => ({}));
    const plan = body?.plan as Plan;
    if (!plan || !Object.prototype.hasOwnProperty.call(PLANS, plan)) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

    const admin = createAdminClient();
    const now = new Date();
    const end = new Date(now); end.setFullYear(end.getFullYear() + 1);
    const { error } = await admin.from("profiles").update({
      plan,
      subscription_status: plan === "free" ? "inactive" : "active",
      current_period_start: plan === "free" ? null : now.toISOString(),
      current_period_end: plan === "free" ? null : end.toISOString(),
      lenda_consultation_used: false,
      lenda_consultation_used_at: null,
      updated_at: now.toISOString(),
    }).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, plan, label: PLANS[plan].label });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro interno." }, { status: 500 });
  }
}
