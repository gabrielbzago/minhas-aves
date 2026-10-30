"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CARD_COLORS, DEFAULT_CARD_COLOR, type CardColorKey } from "@/lib/card-colors";

export default function PlantelTable({ birds, paid }: { birds:any[]; paid:boolean }) {
  const router=useRouter();
  const [selected,setSelected]=useState<string[]>([]);
  const [cardColor,setCardColor]=useState<CardColorKey>(DEFAULT_CARD_COLOR);
  const MAX_PRINT=24;
  const all=birds.length>0 && selected.length===Math.min(birds.length,MAX_PRINT);
  const chosen=useMemo(()=>birds.filter(b=>selected.includes(b.id)),[birds,selected]);
  const toggle=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):(s.length>=MAX_PRINT?s:[...s,id]));
  const toggleAll=()=>setSelected(all?[]:birds.slice(0,MAX_PRINT).map(b=>b.id));
  const print=()=>{if(!paid||!selected.length)return;window.open(`/api/print/cards?theme=${encodeURIComponent(cardColor)}&ids=${encodeURIComponent(selected.join(","))}`,"_blank","noopener,noreferrer")};
  return <>
    {birds.length>0&&<div className="print-selection-bar"><div><strong>Cartões de gaiola dobráveis</strong><span>{selected.length} de até {MAX_PRINT} selecionadas · 3 cartões por folha A4 paisagem</span></div><div className="actions" style={{margin:0}}><button className="btn btn-ghost" type="button" onClick={toggleAll}>{all?"Desmarcar todos":"Selecionar todos"}</button>{selected.length>0&&<button className="btn btn-primary" type="button" onClick={print} disabled={!paid}>🖨 Imprimir dobráveis ({selected.length})</button>}</div>{selected.length>0&&<div className="card-palette compact"><div><strong>Cor dos cartões</strong><span>Aplicada a todos os cartões desta impressão.</span></div><div className="palette-options" role="radiogroup" aria-label="Cor dos cartões">{Object.entries(CARD_COLORS).map(([key,color])=><button key={key} type="button" className={`palette-swatch ${cardColor===key?"selected":""}`} style={{"--swatch":color.hex} as any} onClick={()=>setCardColor(key as CardColorKey)} aria-label={color.name} title={color.name}><span></span><small>{color.name}</small></button>)}</div></div>}</div>}
    <div className="table-card">{birds.length?<table><thead><tr><th style={{width:48}}><input type="checkbox" aria-label="Selecionar todas" checked={all} onChange={toggleAll}/></th><th>Ave</th><th>Espécie</th><th>Sexo</th><th>Status</th><th>Anilha</th><th>Genealogia</th><th>Ações</th></tr></thead><tbody>{birds.map(b=>{const open=()=>router.push(`/dashboard/plantel/${b.id}`);const isSelected=selected.includes(b.id);return <tr key={b.id}><td onClick={e=>e.stopPropagation()}><input type="checkbox" aria-label={`Selecionar ${b.name}`} checked={isSelected} disabled={!isSelected&&selected.length>=MAX_PRINT} onChange={()=>toggle(b.id)}/></td><td><button type="button" onClick={open} style={{border:0,background:"transparent",padding:0,font:"inherit",fontWeight:700,color:"var(--primary-dark)",cursor:"pointer"}}>{b.name}</button></td><td>{b.species?.common_name||"—"}<br/><small style={{color:"var(--muted)"}}>{b.species?.scientific_name||""}</small></td><td>{b.sex||"—"}</td><td><span className="badge">{b.status||"—"}</span></td><td>{b.ring_number||"—"}</td><td>{b.father_id||b.mother_id?<span className="badge">Conectada</span>:"—"}</td><td><div className="actions" style={{margin:0,justifyContent:"flex-start",gap:8}}><button type="button" className="btn btn-soft" onClick={open}>Ver dados</button><button type="button" className="btn btn-ghost" onClick={()=>router.push(`/dashboard/plantel/${b.id}?edit=1`)}>Editar</button></div></td></tr>})}</tbody></table>:<div className="empty">Nenhuma ave cadastrada ainda.</div>}</div>
    {chosen.length>0&&!paid&&<div className="print-paywall-note">🔒 Você pode selecionar e visualizar o recurso no Grátis. A geração para impressão é liberada nos planos pagos.</div>}
  </>;
}
