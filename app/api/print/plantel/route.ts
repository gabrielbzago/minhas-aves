import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { effectivePlan } from "@/lib/plans";
import { ensureAmadorTrialOnFirstUse } from "@/lib/amador-trial";
const esc=(x:any)=>String(x??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export async function GET(){
 const {supabase,user}=await requireUser();
 let {data:profile}=await supabase.from("profiles").select("plan,role,full_name,criatorio_name,criatorio_logo_path,city,state,amador_trial_eligible,amador_trial_started_at,amador_trial_ends_at").eq("id",user.id).maybeSingle();
 const trial=await ensureAmadorTrialOnFirstUse(supabase,user.id,"imprimir-plantel");
 profile=trial.profile;
 if(!profile|| (effectivePlan(profile.plan,profile.role)==="free" && !trial.active)) return new NextResponse("A impressão do plantel está disponível somente nos planos pagos.",{status:403});
 const {data:birds}=await supabase.from("birds").select("name,sex,status,birth_date,ring_number,ibama_registration_number,genetic_line,species:species_id(common_name,scientific_name)").order("name");
 let logo="";
 if(profile.criatorio_logo_path){const {data}=await supabase.storage.from("criatorio-brand").createSignedUrl(profile.criatorio_logo_path,3600);logo=data?.signedUrl||"";}
 const rows=(birds||[]).map((b:any)=>`<tr><td><b>${esc(b.name)}</b></td><td>${esc(b.species?.common_name)}<br><i>${esc(b.species?.scientific_name)}</i></td><td>${esc(b.sex)}</td><td>${esc(b.status)}</td><td>${esc(b.birth_date)}</td><td>${esc(b.ring_number)}</td><td>${esc(b.ibama_registration_number)}</td><td>${esc(b.genetic_line)}</td></tr>`).join("");
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Plantel — ${esc(profile.criatorio_name||"Minhas Aves")}</title><style>*{box-sizing:border-box}body{font-family:Arial;margin:0;padding:18px;color:#0d1b2a}header{display:flex;align-items:center;gap:14px;border-bottom:2px solid #d9e1e8;padding-bottom:12px}.logo{width:60px;height:60px;object-fit:contain}.brand{font-size:21px;font-weight:800}small{color:#647486}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:10px}th,td{border:1px solid #d9e1e8;padding:6px;text-align:left;vertical-align:top}th{background:#e3f2fd;font-size:9px;text-transform:uppercase}.print{display:block;margin:16px auto;padding:10px 16px;border:0;border-radius:9px;background:#1565c0;color:white;font-weight:700}@media print{.print{display:none}}@page{size:A4 landscape;margin:8mm}</style></head><body><header>${logo?`<img class="logo" src="${esc(logo)}">`:""}<div><div class="brand">${esc(profile.criatorio_name||"Minhas Aves")}</div><small>Responsável: ${esc(profile.full_name)}${profile.city||profile.state?` · ${esc([profile.city,profile.state].filter(Boolean).join("/"))}`:""} · ${birds?.length||0} aves</small></div></header><table><thead><tr><th>Ave</th><th>Espécie</th><th>Sexo</th><th>Status</th><th>Nascimento</th><th>Anilha</th><th>Registro</th><th>Linhagem</th></tr></thead><tbody>${rows||"<tr><td colspan='8'>Nenhuma ave cadastrada.</td></tr>"}</tbody></table><button class="print" onclick="window.print()">Imprimir plantel</button></body></html>`;
 return new NextResponse(html,{headers:{"content-type":"text/html;charset=utf-8"}});
}
