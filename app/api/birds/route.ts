import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { friendlySupabaseError } from "@/lib/error-messages";
import { effectivePlan } from "@/lib/plans";

function cleanBirdPayload(input: any, userId: string) {
  const payload = { ...(input || {}) };
  // Nunca aceitamos user_id enviado pelo navegador. O vínculo é definido pelo usuário autenticado.
  delete payload.user_id;
  return {
    ...payload,
    user_id: userId,
    birth_date: payload.birth_date || null,
    death_date: payload.death_date || null,
    transfer_date: payload.transfer_date || null,
    species_id: payload.species_id || null,
    father_id: payload.father_id || null,
    mother_id: payload.mother_id || null,
    ring_number: payload.ring_number || null,
    ibama_registration_number: payload.ibama_registration_number || null,
    ibama_record_type: payload.ibama_record_type || null,
    genetic_line: payload.genetic_line || null,
    notes: payload.notes || null,
    genetics: payload.genetics ?? {},
    // Registros criados pelo usuário são aves reais do plantel.
    // As referências genealógicas são criadas exclusivamente pelo fluxo de transferência.
    is_genealogy_reference: false,
  };
}

export async function GET(request: Request) {
  const { supabase, user } = await requireUser();
  const url = new URL(request.url);
  const ring = String(url.searchParams.get("ring") || "").trim();
  const exclude = String(url.searchParams.get("exclude") || "");

  if (ring) {
    const { data: available, error } = await supabase.rpc("is_bird_ring_available", { p_ring: ring, p_exclude: exclude || null });
    if (error) {
      console.error("[Minhas Aves] GET /api/birds ring", error);
      return NextResponse.json({ available: null, error: friendlySupabaseError(error, "Não foi possível verificar o número da anilha.") }, { status: 400 });
    }
    return NextResponse.json({ available: available !== false, error: available === false ? "Este número de anilha já está cadastrado no sistema. Cada anilha é única e não pode ser reutilizada, mesmo se a ave estiver arquivada, falecida ou transferida." : null });
  }

  const { data, error } = await supabase.from("birds").select("*").or("is_genealogy_reference.eq.false,is_genealogy_reference.is.null").order("created_at", { ascending: false });
  if (error) {
    console.error("[Minhas Aves] GET /api/birds", error);
    return NextResponse.json({ data: null, error: friendlySupabaseError(error) }, { status: 400 });
  }
  return NextResponse.json({ data, error: null });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  const body = await request.json();
  const isBulk = Array.isArray(body);
  const rows = (isBulk ? body : [body]).map((item: any) => cleanBirdPayload(item, user.id));

  // O downgrade nunca apaga aves. No plano grátis, apenas impede novos cadastros
  // acima do limite; os registros já existentes continuam preservados.
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan,role,bonus_birds")
    .eq("id", user.id)
    .maybeSingle();
  const plan = effectivePlan(profile?.plan, profile?.role);
  if (plan === "free" && profile?.role !== "owner" && profile?.role !== "veterinarian") {
    const { count, error: countError } = await supabase
      .from("birds")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .or("is_genealogy_reference.eq.false,is_genealogy_reference.is.null");
    if (countError) {
      return NextResponse.json({ data: null, error: "Não foi possível verificar o limite do plantel. Tente novamente." }, { status: 500 });
    }
    const limit = 5 + Math.max(0, Number(profile?.bonus_birds || 0));
    if ((count || 0) + rows.length > limit) {
      return NextResponse.json({
        data: null,
        code: "FREE_PLAN_BIRD_LIMIT",
        error: `O plano Grátis permite até ${limit} aves. Seus dados existentes foram preservados. Para cadastrar mais aves, assine um plano pago.`,
      }, { status: 403 });
    }
  }

  for (const row of rows) {
    if (row.ring_number) {
      const { data: available, error: ringError } = await supabase.rpc("is_bird_ring_available", { p_ring: row.ring_number, p_exclude: null });
      if (ringError) {
        console.error("[Minhas Aves] verificação de anilha", ringError);
        return NextResponse.json({ data: null, error: friendlySupabaseError(ringError, "Não foi possível verificar o número da anilha. Tente novamente.") }, { status: 400 });
      }
      if (available === false) {
        return NextResponse.json({ data: null, error: "Este número de anilha já está cadastrado no sistema. Cada anilha é única e não pode ser reutilizada, mesmo se a ave estiver arquivada, falecida ou transferida." }, { status: 409 });
      }
    }
  }

  const invalid = rows.find((row: any) => !String(row.name || "").trim());
  if (invalid) {
    return NextResponse.json({ data: null, error: "O campo Nome da ave é obrigatório." }, { status: 400 });
  }

  const result = await supabase.from("birds").insert(rows).select();
  if (result.error) {
    console.error("[Minhas Aves] POST /api/birds", result.error);
    return NextResponse.json({ data: null, error: friendlySupabaseError(result.error) }, { status: 400 });
  }

  return NextResponse.json({ data: isBulk ? result.data : result.data?.[0], error: null }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireUser();
  const body = await request.json();
  const id = String(body?.id || "");
  if (!id) {
    return NextResponse.json({ data: null, error: "Não foi possível identificar a ave que será alterada." }, { status: 400 });
  }

  const payload = cleanBirdPayload(body, user.id);
  if (payload.ring_number) {
    const { data: available, error: ringError } = await supabase.rpc("is_bird_ring_available", { p_ring: payload.ring_number, p_exclude: id });
    if (ringError) return NextResponse.json({ data: null, error: friendlySupabaseError(ringError, "Não foi possível verificar o número da anilha.") }, { status: 400 });
    if (available === false) return NextResponse.json({ data: null, error: "Este número de anilha já está cadastrado no sistema. Cada anilha é única e não pode ser reutilizada, mesmo se a ave estiver arquivada, falecida ou transferida." }, { status: 409 });
  }
  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;

  const { data, error } = await supabase.from("birds").update(payload).eq("id", id).eq("user_id", user.id).select().single();
  if (error) {
    console.error("[Minhas Aves] PATCH /api/birds", error);
    return NextResponse.json({ data: null, error: friendlySupabaseError(error) }, { status: 400 });
  }
  return NextResponse.json({ data, error: null });
}
