import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import VetPartnerWorkspace from "@/components/vet-partner-workspace";

export default async function VetDashboard() {
  const { supabase, user } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "veterinarian") redirect("/dashboard");

  const [{ data: vet }, { data: profiles }, { data: consultations }] = await Promise.all([
    supabase.from("vet_profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("id,role,full_name,criatorio_name,cpf,plan,subscription_status,current_period_start,current_period_end,lenda_consultation_used,city,state").neq("role", "owner").order("criatorio_name"),
    supabase.from("vet_consultations").select("id,creator_id,bird_id,status,modality,requested_at,scheduled_at,consultation_date,included_in_lenda,description,vet_notes,record_pdf_path,prescription_pdf_path,created_at").or(`vet_id.eq.${user.id},creator_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(500),
  ]);

  const creators = (profiles || []).filter((profile: any) => !["canceled", "cancelled", "suspended", "blocked"].includes(String(profile.subscription_status || "").toLowerCase()));

  const creatorIds = (creators || []).map((creator: any) => creator.id);
  const { data: birds } = creatorIds.length
    ? await supabase.from("birds").select("id,user_id,name,sex,status,birth_date,death_date,transfer_date,ring_number,reference_ring_number,ibama_registration_number,ibama_record_type,species:species_id(common_name,scientific_name),genetic_line,breeder_matrix").in("user_id", creatorIds).order("name")
    : { data: [] as any[] };

  const pendingConsultations = (consultations || []).filter((x: any) => x.status === "requested" || x.status === "scheduled").length;
  return (
    <main className="content">
      <div className="page-title">
        <div>
          <span className="kicker">Área do parceiro</span>
          <h1>Painel veterinário</h1>
          <p>{vet?.display_name || "Veterinário parceiro"} · CRMV {vet?.crmv || "não informado"}</p>
        </div>
        <Link href="/veterinario" className="btn btn-soft">Ver página pública</Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><small>Criadores ativos</small><strong>{creators?.length || 0}</strong></div>
        <div className="stat"><small>Aves disponíveis</small><strong>{birds?.length || 0}</strong></div>
        <div className="stat"><small>Consultas pendentes</small><strong>{pendingConsultations}</strong></div>
        <div className="stat"><small>Consultas arquivadas</small><strong>{(consultations || []).filter((x: any) => x.status === "completed").length}</strong></div>
      </div>

      <VetPartnerWorkspace creators={creators || []} birds={birds || []} consultations={consultations || []} />
    </main>
  );
}
