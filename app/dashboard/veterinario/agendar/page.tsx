import Link from "next/link";
import {requireUser} from "@/lib/auth";
import VetBookingForm from "@/components/vet-booking-form";

export default async function AgendarVeterinario({searchParams}:{searchParams:Promise<{ave?:string}>}){
 const {supabase}=await requireUser(); const sp=await searchParams;
 const [{data:birds},{data:vet}]=await Promise.all([
   supabase.from("birds").select("id,name,species:species_id(common_name,scientific_name)").order("name"),
   supabase.from("vet_profiles").select("id,display_name,whatsapp,online_available,in_person_available,address,city,state").eq("is_active",true).order("created_at").limit(1).maybeSingle()
 ]);
 return <main className="content"><div className="page-title"><div><h1>Agendar veterinário</h1><p>Escolha a ave. O horário e o valor, quando aplicável, são combinados diretamente com o veterinário.</p></div><Link className="btn btn-ghost" href="/dashboard/plantel">Voltar ao plantel</Link></div>{vet?<VetBookingForm birds={birds||[]} vet={vet} initialBird={sp.ave||""}/>:<div className="card"><h2>Veterinário parceiro ainda não configurado</h2><p>O administrador precisa cadastrar os dados do veterinário parceiro.</p></div>}</main>;
}
