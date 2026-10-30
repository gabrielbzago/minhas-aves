import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { effectivePlan, normalizePlan, hasFeatureAccess, PLAN_INFO, PLAN_BENEFITS, requiredPlanForFeature, planLabel, isAmadorTrialActive } from "@/lib/plans";
import { FEATURES, type FeatureCode } from "@/lib/features";
import ModuleManager from "@/components/module-manager";

function targetCheckout(plan: string) {
  const paymentLinks: Record<string, string> = {
    amador: "https://buy.stripe.com/eVqbJ096F9U6aRjdz41B600",
    profissional: "https://buy.stripe.com/cNieVcdmV5DQe3v3Yu1B601",
    lenda: "https://buy.stripe.com/dRm14m1Ed5DQgbD7aG1B602",
  };
  return paymentLinks[plan] || paymentLinks.amador;
}

export default async function RecursosPage({searchParams}:{searchParams:Promise<{modulo?:string}>}){
 const {supabase,user}=await requireUser();
 const {data:profile}=await supabase.from("profiles").select("plan,role,amador_trial_eligible,amador_trial_started_at,amador_trial_ends_at").eq("id",user.id).maybeSingle();
 const plan=effectivePlan(profile?.plan,profile?.role);
 const params=await searchParams;
 const module=(params.modulo||"") as FeatureCode;
 const selected=FEATURES.find(x=>x.code===module);
 let trialStart=profile?.amador_trial_started_at||null;
 let trialEnd=profile?.amador_trial_ends_at||null;
 if(module && selected?.tier==="amador" && profile?.plan==="free" && profile?.role!="owner" && profile?.role!="veterinarian" && profile?.amador_trial_eligible && !trialStart){
   const {data:end}=await supabase.rpc("start_amador_trial_on_first_use",{p_user_id:user.id});
   if(end){ trialStart=new Date(new Date(end).getTime()-30*24*60*60*1000).toISOString(); trialEnd=end; }
 }
 const amadorTrialActive=isAmadorTrialActive({plan:profile?.plan,role:profile?.role,eligible:profile?.amador_trial_eligible,startedAt:trialStart,endsAt:trialEnd});
 const [{data:birds},{data:records},{data:media},{data:vet}]=await Promise.all([
   supabase.from("birds").select("id,name,sex,ring_number,birth_date,is_genealogy_reference,species:species_id(common_name,scientific_name)").eq("is_genealogy_reference",false).order("name"),
   module?supabase.from("bird_module_records").select("id,title,data,event_date,created_at,bird_id,birds:bird_id(name)").eq("module_code",module).order("created_at",{ascending:false}).limit(50):Promise.resolve({data:[]}),
   module==="galeria-fotos"||module==="gestao-documentos"?supabase.from("bird_media").select("id,title,storage_path,mime_type,created_at,bird_id").eq("kind",module==="galeria-fotos"?"foto":"documento").order("created_at",{ascending:false}).limit(50):Promise.resolve({data:[]}),
   module==="agendar-veterinario"?supabase.from("vet_profiles").select("*").limit(1).maybeSingle():Promise.resolve({data:null})
 ]);
 const mediaRows=await Promise.all((media||[]).map(async (m:any)=>{const signed=await supabase.storage.from("bird-media").createSignedUrl(m.storage_path,3600);return {id:m.id,title:m.title||"Arquivo",data:{arquivo:m.storage_path,mime:m.mime_type||""},event_date:null,created_at:m.created_at,url:signed.data?.signedUrl||null,_media:true};}));
 const combinedRecords=[...(records||[]),...mediaRows].sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at)));
 const allowed=module?hasFeatureAccess(plan,module,{role:profile?.role,eligible:profile?.amador_trial_eligible,startedAt:trialStart,endsAt:trialEnd}):false;
 const required=module?requiredPlanForFeature(module):"free";
 const requiredInfo=PLAN_INFO[required];
 const requiredLabel=planLabel(required);
 return <main className="content">
  <div className="page-title"><div><h1>Recursos</h1><p>Explore todos os módulos do Minhas Aves. Os módulos bloqueados continuam visíveis para você conhecer o que cada plano entrega.</p></div><Link className="btn btn-soft" href="/dashboard">Voltar ao painel</Link></div>
  {!module&&<div className="module-grid dashboard-modules">{FEATURES.map(f=>{const ok=hasFeatureAccess(plan,f.code,{role:profile?.role,eligible:profile?.amador_trial_eligible,startedAt:trialStart,endsAt:trialEnd});return <Link href={`/dashboard/recursos?modulo=${f.code}`} className={`module-card ${ok?"":"locked"}`} key={f.code}><div className="module-icon">{ok?"✓":"🔒"}</div><div><strong>{f.title}</strong><p>{f.description}</p></div><span className="module-tier">{f.tier==="free"?"Grátis":f.tier==="amador"?"Amador":f.tier==="profissional"?"Profissional":"Lenda"}</span></Link>})}</div>}
  {module&&selected&&!allowed&&<div className="upgrade-card card">
    <div className="upgrade-card-icon">🔒</div>
    <span className="kicker">RECURSO PREMIUM</span>
    <h2>{selected.title}</h2>
    {module && selected?.tier==="amador" && profile?.amador_trial_eligible && profile?.plan==="free" && !amadorTrialActive?<div className="member-note"><strong>🎁 Bônus exclusivo para novas contas</strong><span>Você tem 30 dias de teste dos recursos do Criatório Amador. O prazo começa agora, no seu primeiro uso, e depois o acesso é bloqueado até a contratação.</span></div>:<p className="upgrade-lead">Este recurso faz parte do <strong>{requiredLabel}</strong>. Você está no <strong>{planLabel(plan)}</strong>.</p>}
    <div className="upgrade-grid">
      <div className="upgrade-feature-box"><h3>O que você libera</h3><ul>{PLAN_BENEFITS[required].map((benefit)=><li key={benefit}>✓ {benefit}</li>)}</ul></div>
      <div className="upgrade-price-box"><span>Plano {requiredLabel}</span><strong>{requiredInfo.annualPrice===0?"Grátis":`R$ ${requiredInfo.annualPrice.toFixed(2).replace('.',',')}`}</strong>{requiredInfo.annualPrice>0&&<small>/ano · aves ilimitadas</small>}<a className="btn btn-primary" href={targetCheckout(required)}>Fazer upgrade agora</a><Link className="btn btn-soft" href="/dashboard/assinatura">Comparar todos os planos</Link></div>
    </div>
    <div className="upgrade-actions"><Link className="btn btn-ghost" href="/dashboard/recursos">← Ver todos os módulos</Link></div>
  </div>}
  {module&&selected&&allowed&&<><div className="module-hero"><div><span className="kicker">{selected.tier==="free"?"GRÁTIS":selected.tier==="amador"?"CRIATÓRIO AMADOR":selected.tier==="profissional"?"CRIATÓRIO PROFISSIONAL":"CRIADOR LENDA"}</span><h2>{selected.title}</h2><p>{selected.description}</p></div><Link className="btn btn-ghost" href="/dashboard/recursos">Todos os módulos</Link></div>{amadorTrialActive&&<div className="trial-banner"><strong>🎁 Seu teste do Amador está ativo</strong><span>Os recursos do Criatório Amador estão liberados até <b>{new Intl.DateTimeFormat("pt-BR",{dateStyle:"short"}).format(new Date(trialEnd!))}</b>.</span></div>}<ModuleManager module={module} birds={birds||[]} initialRecords={combinedRecords} canImport={module==="importacao-anilha"} vet={vet||null}/></>}
 </main>
}
