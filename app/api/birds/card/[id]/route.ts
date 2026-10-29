import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/plans";
import { ensureAmadorTrialOnFirstUse } from "@/lib/amador-trial";
import { CARD_COLORS, DEFAULT_CARD_COLOR, isCardColorKey } from "@/lib/card-colors";

const esc=(x:any)=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
const hexMix=(hex:string,amount:number)=>{const n=parseInt(hex.slice(1),16);const r=n>>16,g=(n>>8)&255,b=n&255;const mix=(v:number)=>Math.max(0,Math.min(255,Math.round(v+(255-v)*amount)));return `#${[mix(r),mix(g),mix(b)].map(v=>v.toString(16).padStart(2,"0")).join("")}`};
const sexLabel=(s:string)=>({macho:"M",femea:"F",indeterminado:"—"} as any)[s]||s||"—";

type Bird={id:string;name:string;sex:string;ring_number:string|null;reference_ring_number?:string|null;father_id:string|null;mother_id:string|null;genetic_line?:string|null;genetics?:any};

async function loadBirdTree(db:any,id:string|null,userId:string,cache=new Map<string,Bird|null>()):Promise<Bird|null>{
 if(!id) return null;
 if(cache.has(id)) return cache.get(id)!;
 const {data}=await db.from("birds").select("id,name,sex,ring_number,reference_ring_number,father_id,mother_id,genetic_line,genetics").eq("id",id).eq("user_id",userId).maybeSingle();
 cache.set(id,data||null);
 if(!data) return null;
 return data;
}
async function loadGenerations(db:any,root:Bird,userId:string){
 const cache=new Map<string,Bird|null>();
 const levels:Bird[][]=[[root]];
 for(let g=1;g<=4;g++){
  const prev=levels[g-1]; const ids:string[]=[];
  for(const b of prev){if(b?.father_id)ids.push(b.father_id);if(b?.mother_id)ids.push(b.mother_id)}
  const unique=[...new Set(ids)]; const next=(await Promise.all(unique.map(id=>loadBirdTree(db,id,userId,cache)))).filter(Boolean) as Bird[];
  const byId=new Map(next.map(b=>[b.id,b]));
  const ordered:Bird[]=[];
  for(const b of prev){for(const id of [b.father_id,b.mother_id]){if(id&&byId.has(id))ordered.push(byId.get(id)!);}}
  levels.push(ordered);
 }
 return levels;
}
async function descendants(db:any,id:string,userId:string){
 const {data}=await db.from("birds").select("id,name,sex,ring_number").eq("user_id",userId).or(`father_id.eq.${id},mother_id.eq.${id}`).order("name").limit(8);return data||[];
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params; const {user}=await requireUser(); const db=createAdminClient();
 const preview=new URL(request.url).searchParams.get("preview")==="1";
 const themeParam=new URL(request.url).searchParams.get("theme"); const theme=isCardColorKey(themeParam)?themeParam:DEFAULT_CARD_COLOR; const accent=CARD_COLORS[theme].hex; const accentDark=hexMix(accent,-0.42); const accentBorder=hexMix(accent,0.58); const accentLight=hexMix(accent,0.88);
 let {data:profile,error:pe}=await db.from("profiles").select("plan,role,full_name,criatorio_name,criatorio_logo_path,amador_trial_eligible,amador_trial_started_at,amador_trial_ends_at").eq("id",user.id).maybeSingle();
 const trial=(!preview)?await ensureAmadorTrialOnFirstUse(db,user.id,"cartao-gaiola"):null;
 if(trial?.profile) profile=trial.profile;
 if(pe) return new Response(`Erro ao carregar perfil: ${pe.message}`,{status:500});
 if(!profile) return new Response("Perfil não encontrado para o usuário autenticado.",{status:404});
 const plan=effectivePlan(profile.plan,profile.role);
 // No plano Grátis, o cartão só pode ser aberto em modo de pré-visualização.
 // Sem essa validação, o usuário poderia remover ?preview=1 e usar a própria página como versão de impressão.
 const printUnlocked=plan!=="free" || Boolean(trial?.active);
 if(!printUnlocked && !preview) return new Response("A impressão do cartão está disponível nos planos pagos. Seu teste de 30 dias do Amador terminou.",{status:403});
 const {data:b,error:be}=await db.from("birds").select("id,name,sex,birth_date,status,ring_number,ibama_registration_number,ibama_record_type,genetic_line,genetics,breeder_matrix,father_id,mother_id,notes,species:species_id(common_name,scientific_name)").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(be) return new Response(`Erro ao carregar ave: ${be.message}`,{status:500});
 if(!b) return new Response("Ave não encontrada para o usuário autenticado.",{status:404});
 const levels=await loadGenerations(db,b,user.id); const children=await descendants(db,b.id,user.id);
 let logoUrl=""; if(profile.criatorio_logo_path){const {data}=await db.storage.from("criatorio-brand").createSignedUrl(profile.criatorio_logo_path,3600);logoUrl=data?.signedUrl||"";}
 const brand=esc(profile.criatorio_name||"Minhas Aves"), responsible=esc(profile.full_name||"—"), ctf="";
 const logo=(alt:string)=>logoUrl?`<img class="logo" src="${esc(logoUrl)}" alt="${alt}">`:``;
 const ancestorName=(b:any)=>b?.name||"—";
 const ringLabel=(x:any)=>x?.ring_number||x?.reference_ring_number||"";
 const generation=levels.slice(1);
 const g1=generation[0]||[],g2=generation[1]||[],g3=generation[2]||[],g4=generation[3]||[];
 const pair=(arr:any[],a:number,b:number)=>`${esc(ancestorName(arr[a]))} / ${esc(ancestorName(arr[b]))}`;
 const list=(arr:any[])=>arr.length?arr.map((x:any)=>`<span class="ancestor-item"><b>${esc(x.name)}</b>${ringLabel(x)?` · ${esc(ringLabel(x))}`:""}</span>`).join(""):`<span class="ancestor-empty">Não informado</span>`;
 const field=(label:string,value:any,cls="")=>`<div class="field ${cls}"><span class="label">${esc(label)}</span><strong class="value">${esc(value||"—")}</strong></div>`;
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cartão de gaiola — ${esc(b.name)}</title><style>
:root{--accent:${accent};--accent-dark:${accentDark};--accent-border:${accentBorder};--accent-light:${accentLight}}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#edf6f1;color:#17372b;font-family:Arial,Helvetica,sans-serif}.toolbar{max-width:900px;margin:16px auto;text-align:center}.toolbar button{border:0;background:#2f9a70;color:#fff;padding:10px 16px;border-radius:9px;font-weight:800;cursor:pointer}.toolbar .locked{background:#a9b8b2}.hint{font-size:12px;color:#60766c;margin-top:7px}.sheet{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:18px}.card{width:90mm;height:60mm;background:#fff;border:1px solid var(--accent-border);border-radius:4mm;position:relative;overflow:hidden;box-shadow:0 10px 30px #1e6b4a16}.card:before{content:"";position:absolute;inset:0;border-top:3px solid var(--accent);pointer-events:none}.brandbar{height:12mm;display:flex;align-items:center;gap:2.2mm;padding:2.2mm 3.2mm;border-bottom:1px solid var(--accent-light);position:relative}.logo{width:8.2mm;height:8.2mm;object-fit:contain;border-radius:1.8mm;background:#f5fbf8;flex:0 0 auto}.brandname{font-size:3.7mm;font-weight:900;line-height:1.05;color:var(--accent-dark);max-width:45mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.responsible{font-size:1.9mm;color:#70867d;margin-top:.7mm;max-width:45mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bird-badge{margin-left:auto;min-width:25mm;max-width:31mm;text-align:right;padding-left:2mm}.bird-badge-label{display:block;font-size:1.45mm;text-transform:uppercase;font-weight:800;color:#6c837a;letter-spacing:.15mm}.bird-badge-name{display:block;font-size:3.2mm;font-weight:900;color:var(--accent-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.content{padding:2.3mm 3.2mm}.species{font-size:2.15mm;color:#638078;margin-bottom:1.7mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.grid{display:grid;grid-template-columns:1fr 1.55fr .9fr;gap:1.15mm}.field{border:1px solid var(--accent-border);border-radius:1.45mm;padding:1mm 1.2mm;min-height:7.1mm;overflow:hidden;background:#fcfffd}.field.wide{grid-column:span 2}.label{display:block;font-size:1.45mm;line-height:1;color:#628078;text-transform:uppercase;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.value{display:block;font-size:2.35mm;line-height:1.12;font-weight:800;color:var(--accent-dark);margin-top:.65mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.footerline{position:absolute;bottom:1.7mm;left:3.2mm;right:3.2mm;font-size:1.5mm;color:#7a8f87;display:flex;justify-content:space-between;gap:3mm}.back .brandbar{height:9mm;padding-top:1.6mm;padding-bottom:1.2mm}.back .logo{width:6.5mm;height:6.5mm}.back .brandname{font-size:3.15mm}.back .responsible{font-size:1.65mm}.back .content{padding:1.5mm 3mm}.back-title{font-size:3.5mm;font-weight:900;color:var(--accent-dark)}.back-sub{font-size:1.7mm;color:#70867d;margin-top:.35mm}.ancestry{display:grid;grid-template-columns:1.05fr 1.2fr 1.65fr 2.15fr;gap:1.2mm;margin-top:1.2mm;height:32mm;position:relative}.ancestry:before{content:"";position:absolute;left:24%;right:24%;top:8mm;border-top:.25mm solid var(--accent-border)}.gen-col{border:1px solid var(--accent-border);border-radius:1.5mm;background:#fbfefc;padding:1mm;position:relative;z-index:1;overflow:hidden}.gen-col h4{margin:0 0 .8mm;font-size:1.65mm;text-transform:uppercase;color:var(--accent-dark);text-align:center}.gen-group{border-top:1px solid #e0eee8;padding:.55mm 0}.gen-group:first-of-type{border-top:0}.gen-label{font-size:1.35mm;color:#82958e;text-transform:uppercase;display:block;margin-bottom:.25mm}.ancestor-list{display:flex;flex-direction:column;gap:.35mm}.ancestor-item{font-size:1.45mm;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#234d3e}.ancestor-empty{font-size:1.4mm;color:#8a9b95}.main-bird{display:none}.desc{border-top:1px solid var(--accent-light);margin-top:1mm;padding-top:.9mm;display:flex;align-items:center;gap:1.2mm;min-height:5.5mm}.desc-label{font-size:1.55mm;color:var(--accent-dark);font-weight:800;white-space:nowrap}.desc-list{display:flex;gap:.8mm;overflow:hidden;white-space:nowrap}.desc-chip{font-size:1.4mm;border:1px solid var(--accent-light);border-radius:1mm;padding:.5mm .8mm;max-width:20mm;overflow:hidden;text-overflow:ellipsis}.meta{position:absolute;left:3mm;right:3mm;bottom:1.5mm;font-size:1.35mm;color:#71867e;display:flex;justify-content:space-between}.meta b{color:var(--accent-dark)}.free-print-block{display:none;text-align:center;font-family:Arial,Helvetica,sans-serif;font-weight:800;color:#56746a;padding:40mm 10mm;font-size:18px}
@media print{html,body{background:#fff}.toolbar{display:none}.free-print-block{display:${printUnlocked?"none":"block"}}.free-preview{display:${printUnlocked?"flex":"none"}}.sheet{height:100vh;min-height:0;padding:0;page-break-after:always}.sheet:last-of-type{page-break-after:auto}.card{box-shadow:none}}@page{size:A4;margin:0}@media(max-width:600px){.sheet{padding:10px}.card{transform-origin:center}}
</style></head><body>
<div class="toolbar">${printUnlocked?`<button onclick="window.print()">🖨 Imprimir cartão frente e verso</button>`:`<button class="locked" disabled>🔒 Impressão bloqueada</button><div class="hint">Seu teste de 30 dias terminou. Assine o Criatório Amador para continuar imprimindo.</div>`}</div>
<div class="free-print-block">🔒 Impressão disponível somente nos planos pagos.</div>
<div class="sheet free-preview"><div class="card front"><div class="brandbar">${logo("Logo do criatório")}<div><div class="brandname">${brand}</div><div class="responsible">Responsável: ${responsible}</div></div><div class="bird-badge"><span class="bird-badge-label">AVE:</span><span class="bird-badge-name">${esc(b.name)}</span></div></div><div class="content"><div class="species">${esc(b.species?.common_name||"Espécie não informada")} · <i>${esc(b.species?.scientific_name||"")}</i></div><div class="grid">${field("Nome da ave",b.name)}${field("Proprietário",profile.full_name)}${field("CTF",ctf)}${field("Nascimento",b.birth_date)}${field("Sexo",sexLabel(b.sex))}${field("Anilha",b.ring_number)}${field("Espécie",b.species?.common_name,"wide")}${field("Registro",b.ibama_registration_number)}</div></div><div class="footerline"><span>${esc(({ativo:"Ativo",falecido:"Falecido",transferido:"Transferido",arquivado:"Arquivado"} as any)[b.status]||b.status||"")}</span><span>${esc(b.ibama_record_type||"")}</span></div></div></div>
<div class="sheet free-preview"><div class="card back"><div class="brandbar">${logo("Logo do criatório")}<div><div class="brandname">${brand}</div><div class="responsible">Ficha de identificação</div></div><div class="bird-badge"><span class="bird-badge-label">AVE:</span><span class="bird-badge-name">${esc(b.name)}</span></div></div><div class="content"><div class="back-title">Genealogia da ave</div><div class="back-sub">Pais, avós, bisavós e tataravós · visão compacta para cartão de gaiola</div><div class="ancestry">
<div class="gen-col"><h4>Pais</h4><div class="gen-group"><span class="gen-label">Pai</span><div class="ancestor-list"><span class="ancestor-item">${esc(ancestorName(g1[0]))}</span></div></div><div class="gen-group"><span class="gen-label">Mãe</span><div class="ancestor-list"><span class="ancestor-item">${esc(ancestorName(g1[1]))}</span></div></div></div>
<div class="gen-col"><h4>Avós</h4><div class="gen-group"><span class="gen-label">Paternos</span><div class="ancestor-list"><span class="ancestor-item">${esc(ancestorName(g2[0]))}</span><span class="ancestor-item">${esc(ancestorName(g2[1]))}</span></div></div><div class="gen-group"><span class="gen-label">Maternos</span><div class="ancestor-list"><span class="ancestor-item">${esc(ancestorName(g2[2]))}</span><span class="ancestor-item">${esc(ancestorName(g2[3]))}</span></div></div></div>
<div class="gen-col"><h4>Bisavós</h4><div class="gen-group"><span class="gen-label">Paternos</span><div class="ancestor-list">${list(g3.slice(0,4))}</div></div><div class="gen-group"><span class="gen-label">Maternos</span><div class="ancestor-list">${list(g3.slice(4,8))}</div></div></div>
<div class="gen-col"><h4>Tataravós</h4><div class="gen-group"><span class="gen-label">Paternos</span><div class="ancestor-list">${list(g4.slice(0,8))}</div></div><div class="gen-group"><span class="gen-label">Maternos</span><div class="ancestor-list">${list(g4.slice(8,16))}</div></div></div>
</div>
<div class="desc"><span class="desc-label">Descendentes:</span><div class="desc-list">${children.length?children.map((c:any)=>`<span class="desc-chip">${esc(c.name)}${c.ring_number?` · ${esc(c.ring_number)}`:""}</span>`).join(""):`<span class="ancestor-empty">Nenhum cadastrado</span>`}</div></div></div><div class="meta"><span>Genética: ${esc(b.genetic_line||"")}</span><span>Matriz: ${b.breeder_matrix?"Sim":"Não"}</span><span>CTF: ${ctf}</span></div></div></div>
</body></html>`;
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8"}});
}
