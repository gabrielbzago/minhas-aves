import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { friendlySupabaseError } from "@/lib/error-messages";

export async function GET(request:Request){
 const {supabase}=await requireUser();
 const url=new URL(request.url);
 const status=url.searchParams.get("status");
 let q=supabase.from("ring_inventory").select("id,ring_number,species_id,sex,status,species:species_id(common_name,scientific_name)").eq("status",status||"disponivel").order("ring_number");
 const {data,error}=await q;
 if(error)return NextResponse.json({data:null,error:friendlySupabaseError(error,"Não foi possível consultar o estoque de anilhas.")},{status:400});
 return NextResponse.json({data:data||[],error:null});
}


export async function PATCH(request: Request) {
 const { supabase, user } = await requireUser();
 const body = await request.json().catch(() => ({}));
 const ringId = String(body?.id || "").trim();
 const motherId = body?.mother_id ? String(body.mother_id) : null;
 if (!ringId) return NextResponse.json({ error: "Identifique a anilha que será atualizada." }, { status: 400 });
 const { data: ring, error: ringError } = await supabase.from("ring_inventory").select("id,species_id,user_id").eq("id", ringId).eq("user_id", user.id).maybeSingle();
 if (ringError || !ring) return NextResponse.json({ error: "Anilha não encontrada no seu estoque." }, { status: 404 });
 if (motherId) {
  const { data: mother, error: motherError } = await supabase.from("birds").select("id,sex,species_id,user_id,is_genealogy_reference").eq("id", motherId).eq("user_id", user.id).maybeSingle();
  if (motherError || !mother) return NextResponse.json({ error: "A matriz selecionada não pertence ao seu plantel." }, { status: 422 });
  if (mother.sex !== "femea") return NextResponse.json({ error: "A matriz precisa estar cadastrada como fêmea." }, { status: 422 });
  if (mother.is_genealogy_reference) return NextResponse.json({ error: "Referências genealógicas não podem ser vinculadas como matriz do estoque." }, { status: 422 });
  if (ring.species_id && mother.species_id && ring.species_id !== mother.species_id) return NextResponse.json({ error: "A matriz precisa ser da mesma espécie da anilha." }, { status: 422 });
 }
 const { data, error } = await supabase.from("ring_inventory").update({ mother_id: motherId }).eq("id", ringId).eq("user_id", user.id).select("id,mother_id,mother:mother_id(id,name,ring_number)").single();
 if (error) return NextResponse.json({ error: friendlySupabaseError(error, "Não foi possível atualizar a matriz desta anilha.") }, { status: 400 });
 return NextResponse.json({ data, error: null });
}
