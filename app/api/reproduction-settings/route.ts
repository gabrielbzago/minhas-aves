import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET(){
  try{
    const {supabase,user}=await requireUser();
    const {data,error}=await supabase.from("bird_module_records").select("id,data").eq("user_id",user.id).eq("module_code","reproducao");
    if(error)throw error;
    const settings=(data||[]).map((row:any)=>row.data||{}).filter((value:any)=>value.config_kind==="species_config"&&value.species_id);
    return NextResponse.json({data:settings});
  }catch(error:any){
    console.error("[Apollo] GET reproduction-settings",error);
    return NextResponse.json({error:error?.message==="UNAUTHENTICATED"?"Faça login novamente.":"Não foi possível carregar as configurações reprodutivas."},{status:error?.message==="UNAUTHENTICATED"?401:500});
  }
}
