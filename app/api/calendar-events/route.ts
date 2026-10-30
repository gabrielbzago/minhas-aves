import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

const types = new Set(["postura", "gala", "nascimento", "anilhamento", "torneio"]);
const clean = (v: any) => v === "" || v === undefined ? null : v;

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*, bird:birds(id,name,sex,ring_number,species:species(common_name))")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error("[Apollo] GET calendar-events", error);
    return NextResponse.json({ error: error?.message === "UNAUTHENTICATED" ? "Faça login novamente." : "Não foi possível carregar o calendário. Verifique se a migração SQL foi executada." }, { status: error?.message === "UNAUTHENTICATED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await request.json();
    if (!body.bird_id || !types.has(body.event_type) || !body.event_date || !String(body.title || "").trim()) {
      return NextResponse.json({ error: "Informe a ave, o tipo, a data e o título do evento." }, { status: 400 });
    }
    const { data: bird, error: birdError } = await supabase.from("birds").select("id,sex").eq("id", body.bird_id).eq("user_id", user.id).maybeSingle();
    if (birdError || !bird) return NextResponse.json({ error: "Ave não encontrada no seu plantel." }, { status: 404 });
    const femaleTypes = new Set(["postura", "gala", "nascimento", "anilhamento"]);
    if (femaleTypes.has(body.event_type) && bird.sex !== "femea") return NextResponse.json({ error: "Este evento reprodutivo deve ser vinculado a uma fêmea." }, { status: 400 });
    if (body.event_type === "torneio" && bird.sex !== "macho") return NextResponse.json({ error: "O calendário de torneios deve ser vinculado a um macho." }, { status: 400 });
    const payload = {
      user_id: user.id, bird_id: bird.id, event_type: body.event_type,
      event_date: body.event_date, title: String(body.title).trim(),
      location: clean(body.location), egg_count: clean(body.egg_count),
      chick_count: clean(body.chick_count), song_count: clean(body.song_count),
      ring_days_after: clean(body.ring_days_after), result: clean(body.result), notes: clean(body.notes),
    };
    const { data, error } = await supabase.from("calendar_events").insert(payload).select("*, bird:birds(id,name,sex,ring_number)").single();
    if (error) throw error;
    // Ao registrar nascimento, cria automaticamente o lembrete de anilhamento na data escolhida (3–7 dias depois).
    if (body.event_type === "nascimento" && body.create_ring_reminder !== false) {
      const days = Math.min(7, Math.max(3, Number(body.ring_days_after || 5)));
      const date = new Date(`${body.event_date}T12:00:00`);
      date.setDate(date.getDate() + days);
      const ringDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      const { error: reminderError } = await supabase.from("calendar_events").insert({
        user_id: user.id, bird_id: bird.id, event_type: "anilhamento", event_date: ringDate, source_event_id: data.id, ring_days_after: days,
        title: `🔖 Anilhar filhotes — ${days} dias após o nascimento`,
        chick_count: clean(body.chick_count), notes: "Lembrete gerado automaticamente a partir do registro de nascimento.",
      });
      if (reminderError) console.error("[Apollo] Não foi possível criar lembrete automático de anilhamento", reminderError);
    }
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
    if (!body.id || !body.bird_id || !types.has(body.event_type) || !body.event_date || !String(body.title || "").trim()) {
      return NextResponse.json({ error: "Informe a ave, o tipo, a data e o título do evento." }, { status: 400 });
    }
    const { data: bird } = await supabase.from("birds").select("id,sex").eq("id", body.bird_id).eq("user_id", user.id).maybeSingle();
    if (!bird) return NextResponse.json({ error: "Ave não encontrada no seu plantel." }, { status: 404 });
    const femaleTypes = new Set(["postura", "gala", "nascimento", "anilhamento"]);
    if (femaleTypes.has(body.event_type) && bird.sex !== "femea") return NextResponse.json({ error: "Este evento reprodutivo deve ser vinculado a uma fêmea." }, { status: 400 });
    if (body.event_type === "torneio" && bird.sex !== "macho") return NextResponse.json({ error: "O calendário de torneios deve ser vinculado a um macho." }, { status: 400 });
    const payload = { bird_id: bird.id, event_type: body.event_type, event_date: body.event_date, title: String(body.title).trim(), location: clean(body.location), egg_count: clean(body.egg_count), chick_count: clean(body.chick_count), song_count: clean(body.song_count), ring_days_after: clean(body.ring_days_after), result: clean(body.result), notes: clean(body.notes) };
    const { data, error } = await supabase.from("calendar_events").update(payload).eq("id", body.id).eq("user_id", user.id).select().single();
    if (error) throw error;
    if (body.event_type === "nascimento") {
      const days = Math.min(7, Math.max(3, Number(body.ring_days_after || 5)));
      const date = new Date(`${body.event_date}T12:00:00`);
      date.setDate(date.getDate() + days);
      const ringDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      const { data: reminder } = await supabase.from("calendar_events").select("id").eq("source_event_id", body.id).eq("user_id", user.id).maybeSingle();
      if (reminder) {
        await supabase.from("calendar_events").update({ bird_id: bird.id, event_date: ringDate, chick_count: clean(body.chick_count), ring_days_after: days, title: `🔖 Anilhar filhotes — ${days} dias após o nascimento` }).eq("id", reminder.id).eq("user_id", user.id);
      } else {
        await supabase.from("calendar_events").insert({ user_id: user.id, bird_id: bird.id, event_type: "anilhamento", event_date: ringDate, source_event_id: body.id, ring_days_after: days, title: `🔖 Anilhar filhotes — ${days} dias após o nascimento`, chick_count: clean(body.chick_count), notes: "Lembrete gerado automaticamente a partir do registro de nascimento." });
      }
    } else {
      await supabase.from("calendar_events").delete().eq("source_event_id", body.id).eq("user_id", user.id);
    }
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
