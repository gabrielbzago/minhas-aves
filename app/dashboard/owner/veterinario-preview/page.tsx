import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import VetPartnerWorkspace from "@/components/vet-partner-workspace";

function isActiveProfile(profile: any) {
  const status = String(profile?.subscription_status || "").toLowerCase();
  return !["canceled", "cancelled", "suspended", "blocked"].includes(status);
}

export default async function OwnerVeterinarianPreview() {
  const { supabase, user } = await requireUser();
  const ownerEmail = (process.env.OWNER_EMAIL || "gabrielbzago@gmail.com").trim().toLowerCase();
  const { data: me } = await supabase
    .from("profiles")
    .select("id,role,full_name,criatorio_name,cpf,plan,subscription_status,current_period_start,current_period_end,lenda_consultation_used,city,state")
    .eq("id", user.id)
    .maybeSingle();

  const isOwner = me?.role === "owner" || (user.email || "").trim().toLowerCase() === ownerEmail;
  if (!isOwner) redirect("/dashboard");

  // No modo de simulação do Owner, mostramos todos os perfis ativos que podem
  // possuir plantel, inclusive o próprio usuário Owner. Isso é proposital:
  // o Owner precisa conseguir testar o software usando a própria conta.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,role,full_name,criatorio_name,cpf,plan,subscription_status,current_period_start,current_period_end,lenda_consultation_used,city,state")
    .neq("role", "owner")
    .order("criatorio_name", { ascending: true });

  const creatorMap = new Map<string, any>();
  for (const profile of profiles || []) {
    if (isActiveProfile(profile)) creatorMap.set(profile.id, profile);
  }
  if (me && isActiveProfile(me)) creatorMap.set(me.id, me);
  const creators = Array.from(creatorMap.values());

  const creatorIds = creators.map((creator: any) => creator.id);
  const [{ data: birds }, { data: consultations }] = await Promise.all([
    creatorIds.length
      ? supabase
          .from("birds")
          .select("id,user_id,name,sex,status,birth_date,death_date,transfer_date,ring_number,reference_ring_number,ibama_registration_number,ibama_record_type,species:species_id(common_name,scientific_name),genetic_line,breeder_matrix")
          .in("user_id", creatorIds)
          .order("name")
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from("vet_consultations")
      .select("id,creator_id,bird_id,status,modality,requested_at,scheduled_at,consultation_date,included_in_lenda,description,vet_notes,record_pdf_path,prescription_pdf_path,created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  return (
    <main className="content">
      <div className="page-title">
        <div>
          <span className="kicker">Owner · Simulação</span>
          <h1>Visão do veterinário parceiro</h1>
          <p>Selecione um usuário ativo, abra o plantel completo e teste consultas, prontuários e receitas.</p>
        </div>
        <Link href="/dashboard/owner" className="btn btn-soft">Voltar ao Owner</Link>
      </div>
      <VetPartnerWorkspace creators={creators} birds={birds || []} consultations={consultations || []} isPreview />
    </main>
  );
}
