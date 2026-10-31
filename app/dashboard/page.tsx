import Link from "next/link";
import {requireUser} from "@/lib/auth";
import {redirect} from "next/navigation";
import {cookies} from "next/headers";
import { effectivePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarDays, Egg, Bird, Stethoscope, TrendingUp, ArrowUpRight, Clock3, Sparkles } from "lucide-react";
export default async function DashboardPage({searchParams}:{searchParams?:Promise<{mode?:string}>}){
 const {supabase,user}=await requireUser();
 const params=searchParams?await searchParams:{}; const creatorMode=params.mode==='creator';
 const [{data:profile},{data:birdRows},{data:calendarRows},{data:ringRows},{data:vetRows}]=await Promise.all([
  supabase.from("profiles").select("full_name,criatorio_name,criatorio_logo_path,plan,bonus_birds,role,lenda_consultation_used").eq("id",user.id).maybeSingle(),
  supabase.from("birds").select("id,name,sex,status,birth_date,species:species_id(common_name)").or("is_genealogy_reference.eq.false,is_genealogy_reference.is.null"),
  supabase.from("calendar_events").select("id,bird_id,event_type,event_date,title,egg_count,chick_count,incubation_start_date,source_event_id").eq("user_id",user.id).order("event_date",{ascending:true}).limit(500),
  supabase.from("ring_inventory").select("id,status").eq("user_id",user.id),
  supabase.from("vet_consultations").select("id,status,consultation_date,scheduled_at,description").eq("creator_id",user.id).order("created_at",{ascending:false}).limit(100)
 ]);
 const birds=birdRows||[];
 const birdCount=birds.length;
 const activeCount=birds.filter((bird:any)=>bird.status==="ativo").length;
 const femaleCount=birds.filter((bird:any)=>["fêmea","femea"].includes(String(bird.sex||"").trim().toLowerCase())).length;
 const maleCount=birds.filter((bird:any)=>String(bird.sex||"").trim().toLowerCase()==="macho").length;
 const undefinedCount=Math.max(0,birdCount-femaleCount-maleCount);
 const events=calendarRows||[];
 const today=new Date(); today.setHours(0,0,0,0);
 const dateKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
 const todayKey=dateKey(today);
 const addDays=(value:string,days:number)=>{const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+days);return dateKey(d);};
 const distance=(a:string,b:string)=>Math.round((new Date(`${b}T12:00:00`).getTime()-new Date(`${a}T12:00:00`).getTime())/86400000);
 const birdsById=new Map(birds.map((b:any)=>[b.id,b]));
 const upcoming=events.filter((e:any)=>e.event_date>=todayKey).slice(0,5);
 const posturas=events.filter((e:any)=>e.event_type==="postura"&&[2,3].includes(Number(e.egg_count)));
 const smartAlerts:any[]=[];
 for(const p of posturas){const start=p.incubation_start_date||addDays(p.event_date,Number(p.egg_count)-1);const day=distance(start,todayKey)+1;const later=posturas.filter((x:any)=>x.bird_id===p.bird_id&&x.event_date>p.event_date).sort((a:any,b:any)=>a.event_date.localeCompare(b.event_date))[0];const hatched=events.some((x:any)=>x.event_type==="nascimento"&&x.bird_id===p.bird_id&&x.event_date>=start&&x.event_date<=todayKey&&(!later||x.event_date<later.event_date));if(!hatched&&day>=11&&day<=13)smartAlerts.push({id:`h${p.id}`,icon:"🥚",title:day===11?"Nascimento se aproximando":day===12?"Janela provável de nascimento":"Último dia da previsão de nascimento",detail:`${birdsById.get(p.bird_id)?.name||"Fêmea"} · ${day}º dia de choco`});}
 for(const b of events.filter((e:any)=>e.event_type==="nascimento")){const day=distance(b.event_date,todayKey);const done=events.some((x:any)=>x.event_type==="anilhamento"&&x.bird_id===b.bird_id&&x.event_date>=b.event_date&&x.event_date<=todayKey&&(x.source_event_id===b.id||!x.source_event_id));if(!done&&day>=3&&day<=7)smartAlerts.push({id:`r${b.id}`,icon:"🔖",title:"Período de anilhamento",detail:`${birdsById.get(b.bird_id)?.name||"Ninhada"} · ${day}º dia após o nascimento`});}
 const hatchlings=events.filter((e:any)=>e.event_type==="nascimento").reduce((n:number,e:any)=>n+Number(e.chick_count||0),0);
 const eggs=events.filter((e:any)=>e.event_type==="postura").reduce((n:number,e:any)=>n+Number(e.egg_count||0),0);
 const ringAvailable=(ringRows||[]).filter((r:any)=>r.status==="disponivel").length;
 const speciesCounts=new Map<string,number>();birds.forEach((b:any)=>{const name=b.species?.common_name||"Espécie não informada";speciesCounts.set(name,(speciesCounts.get(name)||0)+1);});
 const speciesSummary=[...speciesCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);
 const reproductiveBirths=events.filter((e:any)=>e.event_type==="nascimento").length;
 const reproductivePosturas=events.filter((e:any)=>e.event_type==="postura").length;
 const completedConsults=(vetRows||[]).filter((v:any)=>v.status==="completed").length;
 const nextConsult=(vetRows||[]).filter((v:any)=>["requested","scheduled"].includes(v.status)).sort((a:any,b:any)=>String(a.scheduled_at||a.consultation_date||"").localeCompare(String(b.scheduled_at||b.consultation_date||"")))[0];
 const fmt=(v:string)=>new Intl.DateTimeFormat("pt-BR",{timeZone:"UTC"}).format(new Date(`${v}T12:00:00Z`));

 const femalePct=birdCount?Math.round(femaleCount/birdCount*100):0;
 const malePct=birdCount?Math.round(maleCount/birdCount*100):0;
 const femaleAngle=birdCount?(femaleCount/birdCount)*360:0;
 const maleAngle=birdCount?((femaleCount+maleCount)/birdCount)*360:0;
 let logoUrl:string|null=null;
 if(profile?.criatorio_logo_path){
  // Usa o cliente administrativo no servidor para não depender da policy SELECT do Storage.
  const admin=createAdminClient();
  const {data:logoData,error:logoError}=await admin.storage.from("criatorio-brand").createSignedUrl(profile.criatorio_logo_path,60*60);
  if(!logoError) logoUrl=logoData?.signedUrl||null;
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
 <section className="dashboard-lower-grid">
  <div className="dashboard-panel dashboard-today"><div className="dashboard-panel-head"><div><span className="dashboard-eyebrow">ROTINA DO CRIATÓRIO</span><h2><Sparkles size={18}/> Hoje no seu criatório</h2><p>Alertas inteligentes e próximos compromissos.</p></div><Link href="/dashboard/calendario">Abrir calendário <ArrowUpRight size={14}/></Link></div>
   {smartAlerts.length||upcoming.length?<div className="dashboard-activity-list">{smartAlerts.slice(0,4).map((a:any)=><Link href="/dashboard/calendario" className="dashboard-activity" key={a.id}><span className="dashboard-activity-icon">{a.icon}</span><span><strong>{a.title}</strong><small>{a.detail}</small></span><span className="dashboard-activity-tag">Atenção</span></Link>)}{upcoming.slice(0,4).map((e:any)=><Link href="/dashboard/calendario" className="dashboard-activity" key={e.id}><span className="dashboard-activity-icon">{e.event_type==="postura"?"🥚":e.event_type==="nascimento"?"🐣":e.event_type==="anilhamento"?"🔖":e.event_type==="torneio"?"🏆":"❤️"}</span><span><strong>{e.title||"Evento do calendário"}</strong><small>{birdsById.get(e.bird_id)?.name||"Ave"} · {fmt(e.event_date)}</small></span><span className="dashboard-activity-date">{distance(todayKey,e.event_date)===0?"Hoje":distance(todayKey,e.event_date)===1?"Amanhã":`${distance(todayKey,e.event_date)} dias`}</span></Link>)}</div>:<div className="dashboard-empty"><CalendarDays size={24}/><strong>Tudo tranquilo por aqui!</strong><span>Seus próximos eventos e lembretes aparecerão neste espaço.</span><Link href="/dashboard/calendario">Adicionar evento</Link></div>}
  </div>
  <div className="dashboard-panel"><div className="dashboard-panel-head"><div><span className="dashboard-eyebrow">VISÃO REPRODUTIVA</span><h2><Egg size={18}/> Resultados do criatório</h2><p>Indicadores com base nos registros do calendário.</p></div></div><div className="dashboard-repro-stats"><div><span>Posturas registradas</span><strong>{reproductivePosturas}</strong></div><div><span>Nascimentos registrados</span><strong>{reproductiveBirths}</strong></div><div><span>Ovos registrados</span><strong>{eggs}</strong></div><div><span>Filhotes registrados</span><strong>{hatchlings}</strong></div></div><div className="dashboard-note"><TrendingUp size={16}/><span>Indicadores baseados nos registros lançados no calendário, sem estimativas de produtividade.</span></div></div>
 </section>
 <section className="dashboard-lower-grid dashboard-secondary-grid">
  <div className="dashboard-panel"><div className="dashboard-panel-head"><div><span className="dashboard-eyebrow">COMPOSIÇÃO</span><h2><Bird size={18}/> Espécies do plantel</h2></div><Link href="/dashboard/plantel">Ver aves <ArrowUpRight size={14}/></Link></div>{speciesSummary.length?<div className="dashboard-species-list">{speciesSummary.map(([name,count])=><div className="dashboard-species-row" key={name}><span>{name}</span><div><i style={{width:`${birdCount?count/birdCount*100:0}%`}}/></div><strong>{count}</strong></div>)}</div>:<p className="dashboard-muted">Cadastre espécies nas fichas das aves para visualizar esta distribuição.</p>}</div>
  <div className="dashboard-panel"><div className="dashboard-panel-head"><div><span className="dashboard-eyebrow">CUIDADO E ORGANIZAÇÃO</span><h2><Stethoscope size={18}/> Gestão do plantel</h2></div></div><div className="dashboard-mini-metrics"><div><span className="mini-icon">🔖</span><span><strong>{ringAvailable}</strong><small>Anilhas disponíveis</small></span></div><div><span className="mini-icon">🩺</span><span><strong>{completedConsults}</strong><small>Consultas concluídas</small></span></div></div>{nextConsult?<Link className="dashboard-next-consult" href="/dashboard/veterinario"><Clock3 size={16}/><span><strong>Consulta em acompanhamento</strong><small>{nextConsult.scheduled_at||nextConsult.consultation_date||"Data a confirmar"}</small></span></Link>:<p className="dashboard-muted">Nenhuma consulta pendente registrada.</p>}</div>
 </section>
 {uiPlan==='lenda'&&<div className="member-note"><strong>🩺 {profile?.role==='veterinarian'?"Acesso veterinário parceiro":"Seu benefício veterinário"}</strong><span>{profile?.role==='veterinarian'?"Seu perfil tem acesso completo equivalente ao Lenda e pode realizar consultas particulares pelo Painel veterinário.":profile?.lenda_consultation_used?"A consulta inclusa deste período já foi utilizada. As demais consultas podem ser combinadas diretamente com o veterinário.":"Você tem 1 consulta para 1 ave disponível neste período anual pago."} <Link href={profile?.role==='veterinarian'?"/dashboard/veterinario":"/dashboard/veterinario/agendar"} style={{fontWeight:800,color:"var(--primary-dark)"}}>{profile?.role==='veterinarian'?"Abrir painel veterinário":"Agendar veterinário"}</Link></span></div>}
 <div className="grid3"><div className="card"><h3>Meu plantel</h3><p>Cadastre aves, anilhas e registros e conecte pai e mãe para construir a genealogia.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/plantel">Abrir plantel</Link></div><div className="card"><h3>Saúde veterinária</h3><p>Agende atendimento para qualquer plano e mantenha o histórico veterinário de cada ave.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/veterinario/agendar">Agendar veterinário</Link></div><div className="card"><h3>Recursos</h3><p>Abra os módulos de anilhas, fotos, documentos, gaiolas, comportamento e recursos profissionais.</p><Link className="btn btn-soft" style={{marginTop:16}} href="/dashboard/recursos">Abrir recursos</Link></div></div>
 </main>
}
