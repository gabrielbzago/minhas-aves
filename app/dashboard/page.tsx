import Link from "next/link";
import {requireUser} from "@/lib/auth";
import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import { effectivePlan } from "@/lib/plans";
export default async function DashboardPage({searchParams}:{searchParams?:Promise<{mode?:string}>}){
 const {supabase,user}=await requireUser();
 const params=searchParams?await searchParams:{}; const creatorMode=params.mode==='creator';
 const [{data:profile},{count:birdCount},{count:activeCount}]=await Promise.all([
  supabase.from("profiles").select("full_name,criatorio_name,criatorio_logo_path,plan,bonus_birds,role,lenda_consultation_used").eq("id",user.id).maybeSingle(),
  supabase.from("birds").select("*",{count:"exact",head:true}).eq("is_genealogy_reference",false),
  supabase.from("birds").select("*",{count:"exact",head:true}).eq("status","ativo").eq("is_genealogy_reference",false)
 ]);
 let logoUrl:string|null=null;
 if(profile?.criatorio_logo_path){
  const {data:logoData}=await supabase.storage.from("criatorio-brand").createSignedUrl(profile.criatorio_logo_path,60*60);
  logoUrl=logoData?.signedUrl||null;
 }
 const ownerEmail=(process.env.OWNER_EMAIL||'gabrielbzago@gmail.com').trim().toLowerCase();
 const isOwner=(profile?.role==='owner') || ((user.email||'').trim().toLowerCase()===ownerEmail);
 const preview=isOwner && (await cookies()).get('mc_creator_preview')?.value==='1';
 const uiPlan=effectivePlan(profile?.plan,profile?.role);
 if(isOwner && !creatorMode && !preview) redirect('/dashboard/owner');
 return <main className="content"><div className="page-title"><div className="dashboard-welcome"><div className="dashboard-creator-heading"><div className="dashboard-creator-logo">{logoUrl?<img src={logoUrl} alt={`Logo ${profile?.criatorio_name||"do criatório"}`} />:<img src="/branding/Minhas Aves-icon-light.png" alt="Minhas Aves" />}</div><div><span className="kicker">{profile?.criatorio_name||"Minhas Aves"}</span><h1>Olá, {profile?.full_name||"criador"} 👋</h1><p>Tenha uma visão rápida do seu criatório.</p></div></div></div><Link href="/dashboard/plantel/novo" className="btn btn-primary">+ Nova ave</Link></div>
 <div className="stat-grid"><div className="stat"><small>Aves no plantel</small><strong>{birdCount||0}</strong></div><div className="stat"><small>Aves ativas</small><strong>{activeCount||0}</strong></div><div className="stat"><small>Plano</small><strong style={{fontSize:20}}>{uiPlan==='lenda'?'Lenda':uiPlan==='profissional'?'Profissional':uiPlan==='amador'?'Amador':'Grátis'}</strong></div><div className="stat"><small>Limite de aves</small><strong>{uiPlan==='free'?String(5+(profile?.bonus_birds||0)):"∞"}</strong></div></div>
 {uiPlan==='lenda'&&<div className="member-note"><strong>🩺 {profile?.role==='veterinarian'?"Acesso veterinário parceiro":"Seu benefício veterinário"}</strong><span>{profile?.role==='veterinarian'?"Seu perfil tem acesso completo equivalente ao Lenda e pode realizar consultas particulares pelo Painel veterinário.":profile.lenda_consultation_used?"A consulta inclusa deste período já foi utilizada. As demais consultas podem ser combinadas diretamente com o veterinário.":"Você tem 1 consulta para 1 ave disponível neste período anual pago."} <Link href={profile?.role==='veterinarian'?"/dashboard/veterinario":"/dashboard/veterinario/agendar"} style={{fontWeight:800,color:"var(--primary-dark)"}}>{profile?.role==='veterinarian'?"Abrir painel veterinário":"Agendar veterinário"}</Link></span></div>}
 <div className="grid3"><div className="card"><h3>Meu plantel</h3><p>Cadastre aves, anilhas e registros e conecte pai e mãe para construir a genealogia.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/plantel">Abrir plantel</Link></div><div className="card"><h3>Saúde veterinária</h3><p>Agende atendimento para qualquer plano e mantenha o histórico veterinário de cada ave.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/veterinario/agendar">Agendar veterinário</Link></div><div className="card"><h3>Recursos</h3><p>Abra os módulos de anilhas, fotos, documentos, gaiolas, comportamento e recursos profissionais.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/recursos">Abrir recursos</Link></div></div>
 </main>
}
