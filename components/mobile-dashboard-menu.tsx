"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Home, Bird, Layers3, CreditCard, Settings, Stethoscope, LockKeyhole, CalendarDays, X, Menu, LogOut, ShieldCheck } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { normalizePlan, planLabel, hasFeatureAccess } from "@/lib/plans";

const moduleIcon: Record<string,string>={"importacao-anilha":"↥","gestao-anilhas":"◉","gestao-ave":"🐦","galeria-fotos":"▧","gestao-documentos":"▤","gestao-gaiola":"⌂","historico-ave":"◷",comportamento:"◌",genealogia:"⌘",painel:"▦","cartao-gaiola":"▣","imprimir-ficha":"▤","imprimir-plantel":"☷",reproducao:"♧",doencas:"✚",medicamentos:"✚",genotipagem:"◇",sexagem:"⚥","agendar-veterinario":"♧","consulta-veterinaria-inclusa":"★","modulo-veterinario":"🩺"};

const baseLinks=[
  ["/dashboard","Visão geral",Home],
  ["/dashboard/plantel","Meu plantel",Bird],
  ["/dashboard/calendario","Calendário",CalendarDays],
  ["/dashboard/recursos","Recursos",Layers3],
  ["/dashboard/especies","Espécies",Bird],
  ["/dashboard/veterinario/agendar","Veterinário",Stethoscope],
  ["/dashboard/assinatura","Assinatura",CreditCard],
  ["/dashboard/configuracoes","Configurações",Settings],
  ["/dashboard/transferencias","Transferências",Bird],
] as const;

export default function MobileDashboardMenu({plan,isVeterinarian=false,amadorTrialActive=false,isOwnerPreview=false}:{plan:string;isVeterinarian?:boolean;amadorTrialActive?:boolean;isOwnerPreview?:boolean}){
  const [open,setOpen]=useState(false);
  const router=useRouter();
  async function handleSignOut(){ await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }
  const normalized=normalizePlan(plan);
  const tierLabel=planLabel(normalized);
  return <>
    <button className="mobile-menu-trigger" aria-label="Abrir menu" onClick={()=>setOpen(true)}><Menu size={22}/></button>
    {open&&<div className="mobile-menu-backdrop" onClick={()=>setOpen(false)} />}
    <aside className={`mobile-drawer ${open?"open":""}`} aria-hidden={!open}>
      <div className="mobile-drawer-head"><div className="apollo-system-brand"><img src="/branding/apollo-logo.png" alt="Apollo — Gestão de Criatórios" /></div><button className="mobile-menu-close" aria-label="Fechar menu" onClick={()=>setOpen(false)}><X size={21}/></button></div>
      <div className="mobile-plan-badge">Plano atual: <strong>{tierLabel}</strong></div>
      {isOwnerPreview&&<section className="mobile-owner-mode-panel" aria-label="Controles do Owner">
        <div className="mobile-nav-title"><ShieldCheck size={14}/> CONTROLES DO OWNER</div>
        <Link href="/dashboard/owner/veterinario-preview" onClick={()=>setOpen(false)}><Stethoscope size={17}/><span>Visão veterinário</span></Link>
        <button type="button" onClick={async()=>{try{const r=await fetch('/api/owner/preview-mode',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({enabled:false})});if(!r.ok)throw new Error('Não foi possível voltar ao Owner.');setOpen(false);router.replace('/dashboard/owner');router.refresh();}catch(e){window.alert(e instanceof Error?e.message:'Falha ao voltar para Owner.');}}}><ShieldCheck size={17}/><span>Voltar para Owner</span></button>
      </section>}
      <nav className="mobile-nav">
        <div className="mobile-nav-title">Navegação</div>
        {baseLinks.map(([href,label,Icon])=><Link href={href} key={href} onClick={()=>setOpen(false)}><Icon size={18}/><span>{label}</span></Link>)}
        {isVeterinarian&&<Link href="/dashboard/veterinario" onClick={()=>setOpen(false)}><Stethoscope size={18}/><span>Painel veterinário</span><small>Parceiro</small></Link>}
        <div className="mobile-nav-title">Todos os recursos</div>
        {FEATURES.map(f=>{
          const unlocked=hasFeatureAccess(normalized,f.code,{role:isVeterinarian?"veterinarian":"creator",eligible:amadorTrialActive,startedAt:amadorTrialActive?new Date(Date.now()-1000).toISOString():null,endsAt:amadorTrialActive?new Date(Date.now()+86400000).toISOString():null});
          return <Link href={`/dashboard/recursos?modulo=${f.code}`} key={f.code} onClick={()=>setOpen(false)} className={unlocked?"":"mobile-locked"}>
            <span className="mobile-module-icon">{moduleIcon[f.code]||"•"}</span><span>{f.title}</span>{!unlocked&&<LockKeyhole size={13}/>}<small>{unlocked?"Disponível":`Desbloquear · ${f.tier==="amador"?"Amador":f.tier==="profissional"?"Profissional":f.tier==="lenda"?"Lenda":"Grátis"}`}</small>
          </Link>
        })}
      </nav>
      <div className="mobile-drawer-footer"><button type="button" onClick={handleSignOut}><LogOut size={18}/><span>Sair da conta</span></button></div>
    </aside>
  </>;
}
