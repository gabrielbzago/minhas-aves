import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Home, Bird, Layers3, CreditCard, Settings, Stethoscope, ShieldCheck, LockKeyhole } from "lucide-react";
import SignOutButton from "@/components/sign-out";
import ExitCreatorPreview from "@/components/exit-creator-preview";
import MobileDashboardMenu from "@/components/mobile-dashboard-menu";
import { effectivePlan, normalizePlan, planLabel, hasFeatureAccess, isAmadorTrialActive } from "@/lib/plans";
import { FEATURES } from "@/lib/features";

const moduleIcon: Record<string,string>={"importacao-anilha":"↥","gestao-anilhas":"◉","gestao-ave":"🐦","galeria-fotos":"▧","gestao-documentos":"▤","gestao-gaiola":"⌂","historico-ave":"◷",comportamento:"◌",genealogia:"⌘",painel:"▦","cartao-gaiola":"▣","imprimir-ficha":"▤","imprimir-plantel":"☷","imprimir-genealogia":"⌘",sms:"✉",reproducao:"♧",doencas:"✚",medicamentos:"✚",genotipagem:"◇",sexagem:"⚥","agendar-veterinario":"♧","consulta-veterinaria-inclusa":"★"};

function CreatorSidebar({plan,ownerPreview,isVeterinarian,amadorTrialActive}:{plan:string;ownerPreview:boolean;isVeterinarian:boolean;amadorTrialActive:boolean}){
 const normalized=normalizePlan(plan); const tierLabel=planLabel(normalized);
 const links=[['/dashboard','Visão geral',Home],['/dashboard/plantel','Meu plantel',Bird],['/dashboard/recursos','Recursos',Layers3],['/dashboard/especies','Espécies',Bird],['/dashboard/veterinario/agendar','Veterinário',Stethoscope], ...(isVeterinarian ? [['/dashboard/veterinario','Painel veterinário',Stethoscope] as const] : []),['/dashboard/assinatura','Assinatura',CreditCard],['/dashboard/configuracoes','Configurações',Settings],['/dashboard/transferencias','Transferências',Bird]] as const;
 const modules=FEATURES;
 return <aside className="sidebar creator-sidebar"><div className="apollo-system-brand"><img src="/branding/apollo-logo.png" alt="Apollo — Gestão de Criatórios" /></div>{ownerPreview&&<div className="preview-banner"><span>Modo teste</span><strong>{tierLabel}</strong></div>}<nav className="side-nav">{links.map(([href,label,Icon])=><Link key={href} href={href}><Icon size={17}/><span>{label}</span></Link>)}</nav><div className="side-section"><div className="side-section-title">Módulos do plano</div><div className="side-modules">{modules.map(f=>{const unlocked=hasFeatureAccess(normalized,f.code,{role:isVeterinarian?"veterinarian":"creator",eligible:amadorTrialActive,startedAt:amadorTrialActive?new Date(Date.now()-1000).toISOString():null,endsAt:amadorTrialActive?new Date(Date.now()+86400000).toISOString():null}); return <Link key={f.code} href={`/dashboard/recursos?modulo=${f.code}`} className={`side-module ${unlocked?"":"side-module-locked"}`} title={unlocked?f.title:(f.code==='modulo-veterinario'&&normalized==='amador'&&!amadorTrialActive?'Teste do Amador por 30 dias no primeiro uso':`Disponível no ${f.tier==='amador'?'Criatório Amador':f.tier==='profissional'?'Criatório Profissional':'Criador Lenda'}`)}><span>{moduleIcon[f.code]||'•'}</span><span>{f.title}</span>{!unlocked&&<LockKeyhole size={12}/>}</Link>})}</div></div>{ownerPreview&&<ExitCreatorPreview/>}<SignOutButton/></aside>
}

export default async function DashboardLayout({children}:{children:ReactNode}){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/login');const {data:p}=await supabase.from('profiles').select('role,plan,criatorio_name,amador_trial_eligible,amador_trial_started_at,amador_trial_ends_at').eq('id',user.id).maybeSingle();
 const ownerEmail=(process.env.OWNER_EMAIL||'gabrielbzago@gmail.com').trim().toLowerCase();const isOwner=(p?.role==='owner')||((user.email||'').trim().toLowerCase()===ownerEmail);const role=isOwner?'owner':(p?.role||'creator');
 const preview=isOwner&&(await cookies()).get('mc_creator_preview')?.value==='1';
 if(role==='owner'&&!preview)return <div className="dashboard-shell"><aside className="sidebar"><div className="apollo-system-brand"><img src="/branding/apollo-logo.png" alt="Apollo — Gestão de Criatórios" /></div><nav className="side-nav"><Link href="/dashboard/owner"><ShieldCheck size={17}/><span>Gestão da plataforma</span></Link><Link href="/"><Home size={17}/><span>Site</span></Link><SignOutButton/></nav></aside><section className="main-area"><header className="topbar"><b>Apollo · Administração</b><span className="badge">Administração</span></header>{children}</section></div>;
 const isVeterinarian=role==='veterinarian';
 const uiPlan=effectivePlan(p?.plan,role);
 const amadorTrialActive=isAmadorTrialActive({plan:p?.plan,role,eligible:p?.amador_trial_eligible,startedAt:p?.amador_trial_started_at,endsAt:p?.amador_trial_ends_at});
 return <div className="dashboard-shell"><CreatorSidebar plan={uiPlan} ownerPreview={isOwner&&preview} isVeterinarian={isVeterinarian} amadorTrialActive={amadorTrialActive}/><section className="main-area"><header className="topbar"><MobileDashboardMenu plan={uiPlan} isVeterinarian={isVeterinarian} amadorTrialActive={amadorTrialActive}/><b className="topbar-title">{p?.criatorio_name||'Minhas Aves'}</b><div className="topbar-user" style={{fontSize:12,color:'var(--muted)',display:'flex',gap:10,alignItems:'center'}}><span className="topbar-email">{user.email}</span><span className="badge">{isVeterinarian?'Veterinário · Lenda':normalizePlan(p?.plan)==='lenda'?'Criador Lenda':normalizePlan(p?.plan)==='profissional'?'Profissional':normalizePlan(p?.plan)==='amador'?'Amador':'Grátis'}</span></div></header>{children}</section></div>;
}
