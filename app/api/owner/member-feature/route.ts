import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEMBER_FEATURES, type MemberFeatureCode } from "@/lib/member-features";

async function assertOwner() {
  const { user, supabase } = await requireUser();
  const ownerEmail = (process.env.OWNER_EMAIL || "gabrielbzago@gmail.com").trim().toLowerCase();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "owner" && (user.email || "").trim().toLowerCase() !== ownerEmail) throw new Error("Acesso restrito ao owner.");
  return { user };
}

export async function GET() {
  try {
    await assertOwner();
    const admin = createAdminClient();
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
    const ids = (usersData.users || []).map(u => u.id);
    const { data: profiles, error } = ids.length
      ? await admin.from("profiles").select("id,full_name,criatorio_name,plan,exclusive_features").in("id", ids)
      : { data: [], error: null };
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const pmap = new Map((profiles || []).map((p:any) => [p.id, p]));
    const users = (usersData.users || []).map((u:any) => {
      const p: any = pmap.get(u.id) || {};
      return { id: u.id, email: u.email || "", full_name: p.full_name || u.user_metadata?.full_name || "", criatorio_name: p.criatorio_name || "", plan: p.plan || "free", exclusive_features: p.exclusive_features || {} };
    });
    return NextResponse.json({ users, features: MEMBER_FEATURES });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await assertOwner();
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const feature = body?.feature as MemberFeatureCode;
    const enabled = Boolean(body?.enabled);
    if (!email || !email.includes("@")) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    if (!feature || !Object.prototype.hasOwnProperty.call(MEMBER_FEATURES, feature)) return NextResponse.json({ error: "Recurso exclusivo inválido." }, { status: 400 });
    const admin = createAdminClient();
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
    const target = (usersData.users || []).find((u:any) => (u.email || "").trim().toLowerCase() === email);
    if (!target) return NextResponse.json({ error: "Nenhum usuário encontrado com esse e-mail." }, { status: 404 });
    const { data: profile, error: profileError } = await admin.from("profiles").select("exclusive_features").eq("id", target.id).maybeSingle();
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    const current: Record<string, boolean> = (profile?.exclusive_features && typeof profile.exclusive_features === "object" && !Array.isArray(profile.exclusive_features)) ? profile.exclusive_features as Record<string, boolean> : {};
    if (enabled) current[feature] = true; else delete current[feature];
    const { error } = await admin.from("profiles").update({ exclusive_features: current, updated_at: new Date().toISOString() }).eq("id", target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, email: target.email, feature, enabled });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro interno." }, { status: 500 });
  }
}
