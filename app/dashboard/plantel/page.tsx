import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Search } from "lucide-react";
import { effectivePlan, isAmadorTrialActive } from "@/lib/plans";
import PlantelTable from "@/components/plantel-table";

export default async function PlantelPage({searchParams}:{searchParams:Promise<{q?:string}>}){
 const {supabase,user}=await requireUser(); const {data:profile}=await supabase.from("profiles").select("plan,role,amador_trial_eligible,amador_trial_started_at,amador_trial_ends_at").eq("id",user.id).maybeSingle(); const paid=effectivePlan(profile?.plan,profile?.role)!=="free"; const trialActive=isAmadorTrialActive({plan:profile?.plan,role:profile?.role,eligible:profile?.amador_trial_eligible,startedAt:profile?.amador_trial_started_at,endsAt:profile?.amador_trial_ends_at}); const q=(await searchParams).q||"";
 let query=supabase.from("birds").select("id,name,sex,status,birth_date,ring_number,genetic_line,is_genealogy_reference,species:species_id(common_name,scientific_name),father_id,mother_id").or("is_genealogy_reference.eq.false,is_genealogy_reference.is.null").order("created_at",{ascending:false});
 if(q) query=query.ilike("name",`%${q}%`);
 const {data:birds,error:birdsError}=await query;
 return <main className="content"><div className="page-title"><div><h1>Meu plantel</h1><p>Todos os registros das suas aves.</p></div><div className="actions" style={{margin:0}}>{paid||trialActive?<a href="/api/print/plantel" target="_blank" className="btn btn-soft">🖨 Imprimir plantel</a>:<span className="btn btn-soft" title="Disponível nos planos pagos ou durante o teste">🔒 Imprimir plantel · plano pago</span>}<Link href="/dashboard/plantel/novo" className="btn btn-primary">+ Nova ave</Link></div></div>
 {birdsError&&<div className="error" role="alert">Não foi possível carregar o plantel: {birdsError.message}</div>}
 <form className="toolbar"><Search size={18} color="var(--muted)"/><input name="q" defaultValue={q} placeholder="Buscar por nome..." style={{border:0,outline:0,background:"transparent",flex:1,minWidth:180}}/><button className="btn btn-soft" type="submit">Buscar</button></form>
 <PlantelTable birds={birds||[]} paid={paid} />
 </main>
}
