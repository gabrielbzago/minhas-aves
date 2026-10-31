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
