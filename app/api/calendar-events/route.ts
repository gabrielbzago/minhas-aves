import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

const types = new Set(["postura", "gala", "nascimento", "anilhamento", "torneio"]);
const clean = (v: any) => v === "" || v === undefined ? null : v;
const datePlusDays = (value: string, days: number) => {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

async function findBirthForBird(supabase: any, userId: string, birdId: string, date: string) {
  const { data } = await supabase.from("calendar_events").select("id,event_date")
    .eq("user_id", userId).eq("bird_id", birdId).eq("event_type", "nascimento")
    .lte("event_date", date).order("event_date", { ascending: false }).limit(1).maybeSingle();
  return data?.id || null;
}

async function validateEvent(supabase: any, userId: string, body: any) {
  if (!body.bird_id || !types.has(body.event_type) || !body.event_date || !String(body.title || "").trim()) {
    return { error: "Informe a ave, o tipo, a data e o título do evento." };
  }
  const { data: bird } = await supabase.from("birds").select("id,sex").eq("id", body.bird_id).eq("user_id", userId).maybeSingle();
  if (!bird) return { error: "Ave não encontrada no seu plantel." };
  const femaleTypes = new Set(["postura", "gala", "nascimento", "anilhamento"]);
  if (femaleTypes.has(body.event_type) && bird.sex !== "femea") return { error: "Este evento reprodutivo deve ser vinculado a uma fêmea." };
  if (body.event_type === "torneio" && bird.sex !== "macho") return { error: "O calendário de torneios deve ser vinculado a um macho." };
  let partnerBirdId: string | null = null;
  if (body.event_type === "gala") {
    if (!body.partner_bird_id) return { error: "Selecione o macho que participou da gala." };
    const { data: partner } = await supabase.from("birds").select("id,sex").eq("id", body.partner_bird_id).eq("user_id", userId).maybeSingle();
    if (!partner || partner.sex !== "macho") return { error: "O parceiro selecionado precisa ser um macho do seu plantel." };
    partnerBirdId = partner.id;
  }
  return { bird, partnerBirdId };
}

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("calendar_events")
      .select("*, bird:birds!calendar_events_bird_id_fkey(id,name,sex,ring_number,species:species(common_name)), partner_bird:birds!calendar_events_partner_bird_id_fkey(id,name,sex,ring_number)")
      .eq("user_id", user.id).order("event_date", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error("[Apollo] GET calendar-events", error);
    return NextResponse.json({ error: error?.message === "UNAUTHENTICATED" ? "Faça login novamente." : "Não foi possível carregar o calendário. Verifique se as migrações SQL foram executadas." }, { status: error?.message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json();
    const valid = await validateEvent(supabase, user.id, body);
    if (valid.error) return NextResponse.json({ error: valid.error }, { status: 400 });
    const bird = valid.bird;
    let sourceEventId: string | null = null;
    if (body.event_type === "anilhamento") sourceEventId = await findBirthForBird(supabase, user.id, bird.id, body.event_date);
    let incubationStart = clean(body.incubation_start_date);
    if (body.event_type === "postura" && !incubationStart && [2,3].includes(Number(body.egg_count))) {
      incubationStart = datePlusDays(body.event_date, Number(body.egg_count) - 1);
    }
    const payload = {
      user_id: user.id, bird_id: bird.id, partner_bird_id: valid.partnerBirdId || null,
      event_type: body.event_type, event_date: body.event_date, title: String(body.title).trim(),
      location: clean(body.location), egg_count: clean(body.egg_count), chick_count: clean(body.chick_count),
      song_count: clean(body.song_count), ring_days_after: clean(body.ring_days_after),
      incubation_start_date: body.event_type === "postura" ? incubationStart : null,
      source_event_id: sourceEventId, result: clean(body.result), notes: clean(body.notes),
    };
    const { data, error } = await supabase.from("calendar_events").insert(payload)
      .select("*, bird:birds!calendar_events_bird_id_fkey(id,name,sex,ring_number), partner_bird:birds!calendar_events_partner_bird_id_fkey(id,name,sex,ring_number)").single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("[Apollo] POST calendar-events", error);
    return NextResponse.json({ error: error?.message === "UNAUTHENTICATED" ? "Faça login novamente." : "Não foi possível salvar o evento. Confira se a migração SQL foi executada." }, { status: error?.message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    const valid = await validateEvent(supabase, user.id, body);
    if (valid.error) return NextResponse.json({ error: valid.error }, { status: 400 });
    const bird = valid.bird;
    let sourceEventId: string | null = null;
    if (body.event_type === "anilhamento") sourceEventId = await findBirthForBird(supabase, user.id, bird.id, body.event_date);
    let incubationStart = clean(body.incubation_start_date);
    if (body.event_type === "postura" && !incubationStart && [2,3].includes(Number(body.egg_count))) {
      incubationStart = datePlusDays(body.event_date, Number(body.egg_count) - 1);
    }
    const payload = {
      bird_id: bird.id, partner_bird_id: valid.partnerBirdId || null, event_type: body.event_type,
      event_date: body.event_date, title: String(body.title).trim(), location: clean(body.location),
      egg_count: clean(body.egg_count), chick_count: clean(body.chick_count), song_count: clean(body.song_count),
      ring_days_after: clean(body.ring_days_after), incubation_start_date: body.event_type === "postura" ? incubationStart : null,
      source_event_id: sourceEventId, result: clean(body.result), notes: clean(body.notes),
    };
    const { data, error } = await supabase.from("calendar_events").update(payload)
      .eq("id", body.id).eq("user_id", user.id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("[Apollo] PUT calendar-events", error);
    return NextResponse.json({ error: "Não foi possível atualizar o evento." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    const { error } = await supabase.from("calendar_events").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[Apollo] DELETE calendar-events", error);
    return NextResponse.json({ error: "Não foi possível excluir o evento." }, { status: 500 });
  }
}
