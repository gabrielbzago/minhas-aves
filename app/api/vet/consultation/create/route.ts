import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["veterinarian", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Acesso restrito ao veterinário parceiro e ao owner." }, { status: 403 });
    }
    const body = await request.json();
    const birdId = String(body?.bird_id || "");
    if (!birdId) return NextResponse.json({ error: "Selecione uma ave." }, { status: 400 });

    const admin = createAdminClient();
    const { data: bird, error: birdError } = await admin.from("birds").select("id,user_id,name").eq("id", birdId).maybeSingle();
    if (birdError) return NextResponse.json({ error: birdError.message }, { status: 500 });
    if (!bird) return NextResponse.json({ error: "Ave não encontrada." }, { status: 404 });

    const { data: creator } = await admin.from("profiles").select("id,plan,role,subscription_status").eq("id", bird.user_id).maybeSingle();
    if (!creator) {
      return NextResponse.json({ error: "O responsável pela ave não foi encontrado." }, { status: 403 });
    }
    // O veterinário parceiro pode atender qualquer criador ativo.
    // A consulta é particular por padrão; a regra de benefício Lenda só é
    // aplicada quando a solicitação parte do criador pelo fluxo próprio.
    if (profile.role === "veterinarian") {
      const status = String(creator.subscription_status || "").toLowerCase();
      if (["canceled", "cancelled", "suspended", "blocked"].includes(status)) {
        return NextResponse.json({ error: "O criador está inativo e não pode receber atendimento." }, { status: 403 });
      }
    }

    let vetId = user.id;
    if (profile.role !== "veterinarian") {
      const { data: vet } = await admin.from("vet_profiles").select("id").eq("is_active", true).order("created_at").limit(1).maybeSingle();
      if (!vet) return NextResponse.json({ error: "Nenhum veterinário parceiro ativo foi configurado." }, { status: 409 });
      vetId = vet.id;
    }

    const { data: consultation, error } = await admin.from("vet_consultations").insert({
      creator_id: bird.user_id,
      bird_id: bird.id,
      vet_id: vetId,
      status: "requested",
      modality: "a_combinar",
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, consultation_id: consultation.id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro interno." }, { status: 500 });
  }
}
