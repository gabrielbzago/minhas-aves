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
  const ringInventoryId = !isBulk ? String(body?.ring_inventory_id || "") : "";
  const rows = (isBulk ? body : [body]).map((item: any) => { const copy={...(item||{})}; delete copy.ring_inventory_id; return cleanBirdPayload(copy, user.id); });

  // Nascimento com anilha: valida o estoque e a genealogia no servidor antes
  // de criar a ave. O navegador não é a fonte de verdade para esses vínculos.
  let birthRing: any = null;
  if (ringInventoryId && !isBulk) {
    const { data: ring, error: ringLookupError } = await supabase
      .from("ring_inventory")
      .select("id,ring_number,user_id,status,sex,species_id,father_id,mother_id")
      .eq("id", ringInventoryId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (ringLookupError || !ring) return NextResponse.json({ data: null, error: "Anilha não encontrada no estoque deste criador." }, { status: 404 });
    if (ring.status !== "disponivel") return NextResponse.json({ data: null, error: "Esta anilha não está mais disponível. Atualize a tela e selecione outra." }, { status: 409 });
    const child = rows[0];
    if (!child?.father_id || !child?.mother_id || child.father_id === child.mother_id) {
      return NextResponse.json({ data: null, error: "Vincule um pai e uma mãe diferentes antes de registrar o nascimento." }, { status: 400 });
    }
    const { data: parents, error: parentsError } = await supabase.from("birds")
      .select("id,sex,species_id")
      .eq("user_id", user.id)
      .in("id", [child.father_id, child.mother_id]);
    if (parentsError || !parents || parents.length !== 2) return NextResponse.json({ data: null, error: "Não foi possível validar o pai e a mãe no plantel." }, { status: 400 });
    const father = parents.find((parent: any) => parent.id === child.father_id);
    const mother = parents.find((parent: any) => parent.id === child.mother_id);
    if (father?.sex !== "macho" || mother?.sex !== "femea") return NextResponse.json({ data: null, error: "O pai precisa estar cadastrado como macho e a mãe como fêmea." }, { status: 400 });
    const speciesId = ring.species_id || mother.species_id || null;
    if (speciesId && (father.species_id !== speciesId || mother.species_id !== speciesId)) return NextResponse.json({ data: null, error: "Pai, mãe e anilha precisam pertencer à mesma espécie." }, { status: 400 });
    if (child.species_id && speciesId && child.species_id !== speciesId) return NextResponse.json({ data: null, error: "A espécie informada para o filhote não corresponde à espécie da anilha e dos pais." }, { status: 400 });
    child.species_id = speciesId;
    birthRing = ring;
  }

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

  if (ringInventoryId && !isBulk) {
    const createdBird = result.data?.[0];
    // Mantém a genealogia idêntica na ficha do filhote e no histórico da anilha.
    const { data: linkedRing, error: parentLinkError } = await supabase.from("ring_inventory")
      .update({ father_id: createdBird.father_id, mother_id: createdBird.mother_id, species_id: createdBird.species_id })
      .eq("id", ringInventoryId).eq("user_id", user.id).eq("status", "disponivel").select("id").maybeSingle();
    if (parentLinkError || !linkedRing) {
      await supabase.from("birds").delete().eq("id", createdBird.id).eq("user_id", user.id);
      return NextResponse.json({ data: null, error: parentLinkError ? friendlySupabaseError(parentLinkError, "Não foi possível vincular a genealogia à anilha. O nascimento não foi concluído.") : "Esta anilha acabou de ser utilizada por outro registro. Atualize o estoque e tente novamente." }, { status: 409 });
    }
    const { error: applyError } = await supabase.rpc("apply_ring_to_bird", {
      p_ring_id: ringInventoryId,
      p_bird_id: createdBird.id,
      p_sex: createdBird.sex || "indeterminado",
    });
    if (applyError) {
      await supabase.from("ring_inventory").update({ father_id: birthRing?.father_id ?? null, mother_id: birthRing?.mother_id ?? null, species_id: birthRing?.species_id ?? null }).eq("id", ringInventoryId).eq("user_id", user.id).eq("status", "disponivel");
      await supabase.from("birds").delete().eq("id",createdBird.id).eq("user_id",user.id);
      return NextResponse.json({data:null,error:friendlySupabaseError(applyError,"A ave não foi cadastrada porque não foi possível aplicar a anilha selecionada. O estoque foi preservado; atualize a tela e tente novamente.")},{status:400});
    }
    const {data:updatedBird,error:birdReloadError}=await supabase.from("birds").select("*").eq("id",createdBird.id).eq("user_id",user.id).single();
    if (birdReloadError || !updatedBird) return NextResponse.json({ data: null, error: "O nascimento foi registrado, mas não foi possível confirmar a ficha atualizada. Atualize o plantel antes de tentar novamente." }, { status: 500 });
    return NextResponse.json({data:updatedBird,error:null,ring_status:"aplicada",ring_number:birthRing?.ring_number},{status:201});
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

  // Campos exclusivos do formulário/fluxo de cadastro não pertencem à tabela birds.
  // ring_inventory_id é usado somente no POST para aplicar uma anilha do estoque.
  const updateInput = { ...body };
  delete updateInput.ring_inventory_id;
  delete updateInput.is_genealogy_reference;
  delete updateInput.source_bird_id;
  delete updateInput.source_owner_id;
  delete updateInput.transfer_origin_id;

  const payload = cleanBirdPayload(updateInput, user.id);
  // Edição não pode transformar uma referência genealógica em ave real.
  delete payload.is_genealogy_reference;
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


export async function DELETE(request: Request) {
  const { supabase, user } = await requireUser();
  const body = await request.json().catch(() => ({}));
  const id = String(body?.id || "").trim();
  if (!id) return NextResponse.json({ error: "Selecione uma ave para excluir." }, { status: 400 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const ownerEmail = (process.env.OWNER_EMAIL || "gabrielbzago@gmail.com").trim().toLowerCase();
  const isOwner = profile?.role === "owner" || (user.email || "").trim().toLowerCase() === ownerEmail;
  if (!isOwner) return NextResponse.json({ error: "Esta ação é exclusiva do Owner." }, { status: 403 });
  const { data: bird, error: lookupError } = await supabase.from("birds").select("id,name,is_genealogy_reference").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (lookupError || !bird) return NextResponse.json({ error: "Ave não encontrada no seu próprio plantel." }, { status: 404 });
  // Antes da exclusão, remove apenas referências genealógicas/operacionais dentro da própria conta.
  // Não apaga consultas, documentos ou registros de outras contas.
  const [childrenUpdate, ringParentUpdate, ringAppliedUpdate] = await Promise.all([
    supabase.from("birds").update({ father_id: null, mother_id: null }).eq("user_id", user.id).or(`father_id.eq.${id},mother_id.eq.${id}`),
    supabase.from("ring_inventory").update({ father_id: null, mother_id: null }).eq("user_id", user.id).or(`father_id.eq.${id},mother_id.eq.${id}`),
    supabase.from("ring_inventory").update({ applied_to_bird_id: null }).eq("user_id", user.id).eq("applied_to_bird_id", id),
  ]);
  const cleanupError = childrenUpdate.error || ringParentUpdate.error || ringAppliedUpdate.error;
  if (cleanupError) {
    console.error("[Apollo Owner] cleanup before bird deletion", cleanupError);
    return NextResponse.json({ error: "Não foi possível preparar os vínculos desta ave para exclusão. Nenhuma ave foi apagada; confira as dependências e tente novamente." }, { status: 409 });
  }
  const { error } = await supabase.from("birds").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    console.error("[Apollo Owner] DELETE /api/birds", error);
    return NextResponse.json({ error: friendlySupabaseError(error, "Não foi possível excluir esta ave. Existem registros vinculados que o banco precisa preservar.") }, { status: 409 });
  }
  return NextResponse.json({ success: true, deletedId: id, name: bird.name });
}
