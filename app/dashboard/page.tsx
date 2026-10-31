import Link from "next/link";
import {requireUser} from "@/lib/auth";
import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import { effectivePlan } from "@/lib/plans";
export default async function DashboardPage({searchParams}:{searchParams?:Promise<{mode?:string}>}){
 const {supabase,user}=await requireUser();
 const params=searchParams?await searchParams:{}; const creatorMode=params.mode==='creator';
 const [{data:profile},{data:birdRows}]=await Promise.all([
  supabase.from("profiles").select("full_name,criatorio_name,criatorio_logo_path,plan,bonus_birds,role,lenda_consultation_used").eq("id",user.id).maybeSingle(),
  supabase.from("birds").select("sex,status").or("is_genealogy_reference.eq.false,is_genealogy_reference.is.null")
 ]);
 const birds=birdRows||[];
 const birdCount=birds.length;
 const activeCount=birds.filter((bird:any)=>bird.status==="ativo").length;
 const femaleCount=birds.filter((bird:any)=>["fêmea","femea"].includes(String(bird.sex||"").trim().toLowerCase())).length;
 const maleCount=birds.filter((bird:any)=>String(bird.sex||"").trim().toLowerCase()==="macho").length;
 const undefinedCount=Math.max(0,birdCount-femaleCount-maleCount);
 const femalePct=birdCount?Math.round(femaleCount/birdCount*100):0;
 const malePct=birdCount?Math.round(maleCount/birdCount*100):0;
 const femaleAngle=birdCount?(femaleCount/birdCount)*360:0;
 const maleAngle=birdCount?((femaleCount+maleCount)/birdCount)*360:0;
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
 <div className="stat-grid"><div className="stat"><small>Aves no plantel</small><strong>{birdCount}</strong><span className="stat-foot">Registros cadastrados</span></div><div className="stat"><small>Aves ativas</small><strong>{activeCount}</strong><span className="stat-foot">No plantel atualmente</span></div><div className="stat"><small>Plano atual</small><strong style={{fontSize:20}}>{uiPlan==='lenda'?'Lenda':uiPlan==='profissional'?'Profissional':uiPlan==='amador'?'Amador':'Grátis'}</strong><span className="stat-foot">Seu nível de acesso</span></div><div className="stat"><small>Limite de aves</small><strong>{uiPlan==='free'?String(5+(profile?.bonus_birds||0)):"∞"}</strong><span className="stat-foot">Capacidade do plano</span></div></div>
 <section className="dashboard-insights">
  <div className="dashboard-sex-card">
   <div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">VISÃO DO PLANTEL</span><h2>Distribuição por sexo</h2><p>Conheça o equilíbrio do seu criatório em um olhar.</p></div><span className="dashboard-total-pill">{birdCount} {birdCount===1?'ave':'aves'}</span></div>
   <div className="sex-overview"><div className="sex-donut-wrap"><div className="sex-donut" style={{background:birdCount?`conic-gradient(#ec8eb5 0deg ${femaleAngle}deg,#6da8ee ${femaleAngle}deg ${maleAngle}deg,#d9e0e8 ${maleAngle}deg 360deg)`:'conic-gradient(#e8edf2 0deg 360deg)'}}><div className="sex-donut-hole"><strong>{birdCount}</strong><span>no plantel</span></div></div></div>
    <div className="sex-legend"><div className="sex-legend-item"><span className="sex-dot female"></span><div><strong>Fêmeas</strong><small>{femaleCount} {femaleCount===1?'ave':'aves'}</small></div><b>{femalePct}%</b></div><div className="sex-legend-item"><span className="sex-dot male"></span><div><strong>Machos</strong><small>{maleCount} {maleCount===1?'ave':'aves'}</small></div><b>{malePct}%</b></div><div className="sex-legend-item"><span className="sex-dot unknown"></span><div><strong>Não definidos</strong><small>{undefinedCount} {undefinedCount===1?'ave':'aves'}</small></div><b>{birdCount?Math.round(undefinedCount/birdCount*100):0}%</b></div></div></div>
   {!birdCount&&<p className="sex-empty">Cadastre sua primeira ave para visualizar a distribuição do plantel.</p>}
   <div className="sex-insight-footer"><span>♀ <b>{femaleCount}</b> fêmeas</span><span>♂ <b>{maleCount}</b> machos</span><Link href="/dashboard/plantel">Ver plantel →</Link></div>
  </div>
  <div className="dashboard-quick-card"><span className="dashboard-eyebrow">ACOMPANHAMENTO</span><h2>Seu criatório, em foco.</h2><p>Tenha os principais números sempre à mão e mantenha seus registros organizados.</p><div className="quick-metric"><span className="quick-metric-icon">🐦</span><div><strong>{activeCount} de {birdCount}</strong><small>aves estão ativas</small></div></div><div className="quick-progress"><span style={{width:`${birdCount?activeCount/birdCount*100:0}%`}} /></div><Link className="btn btn-soft" href="/dashboard/plantel">Gerenciar meu plantel</Link></div>
 </section>
 {uiPlan==='lenda'&&<div className="member-note"><strong>🩺 {profile?.role==='veterinarian'?"Acesso veterinário parceiro":"Seu benefício veterinário"}</strong><span>{profile?.role==='veterinarian'?"Seu perfil tem acesso completo equivalente ao Lenda e pode realizar consultas particulares pelo Painel veterinário.":profile?.lenda_consultation_used?"A consulta inclusa deste período já foi utilizada. As demais consultas podem ser combinadas diretamente com o veterinário.":"Você tem 1 consulta para 1 ave disponível neste período anual pago."} <Link href={profile?.role==='veterinarian'?"/dashboard/veterinario":"/dashboard/veterinario/agendar"} style={{fontWeight:800,color:"var(--primary-dark)"}}>{profile?.role==='veterinarian'?"Abrir painel veterinário":"Agendar veterinário"}</Link></span></div>}
 <div className="grid3"><div className="card"><h3>Meu plantel</h3><p>Cadastre aves, anilhas e registros e conecte pai e mãe para construir a genealogia.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/plantel">Abrir plantel</Link></div><div className="card"><h3>Saúde veterinária</h3><p>Agende atendimento para qualquer plano e mantenha o histórico veterinário de cada ave.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/veterinario/agendar">Agendar veterinário</Link></div><div className="card"><h3>Recursos</h3><p>Abra os módulos de anilhas, fotos, documentos, gaiolas, comportamento e recursos profissionais.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/recursos">Abrir recursos</Link></div></div>
 </main>
}
