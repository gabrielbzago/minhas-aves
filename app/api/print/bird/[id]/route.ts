import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { effectivePlan } from "@/lib/plans";
import { ensureAmadorTrialOnFirstUse } from "@/lib/amador-trial";

const esc = (x:any) => String(x ?? "—").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));

export async function GET(_: Request, { params }: { params: Promise<{id:string}> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  let { data: profile } = await supabase.from("profiles")
    .select("plan,role,full_name,criatorio_name,criatorio_logo_path,city,state,phone,amador_trial_eligible,amador_trial_started_at,amador_trial_ends_at")
    .eq("id", user.id).maybeSingle();
  const trial = await ensureAmadorTrialOnFirstUse(supabase, user.id, "imprimir-ficha");
  profile = trial.profile;

  if (!profile || (effectivePlan(profile.plan, profile.role) === "free" && !trial.active))
    return new NextResponse("A impressão está disponível nos planos pagos. Seu teste de 30 dias do Amador terminou.", { status: 403 });

  const [{ data: b }, { data: consultations }] = await Promise.all([
    supabase.from("birds").select("*,species:species_id(common_name,scientific_name)").eq("id", id).maybeSingle(),
    supabase.from("vet_consultations").select("consultation_date,status,description,vet_notes").eq("bird_id",id).order("created_at",{ascending:false})
  ]);
  if (!b) return new NextResponse("Ave não encontrada.", {status:404});

  const [fatherRes,motherRes] = await Promise.all([
    b.father_id ? supabase.from("birds").select("name,ring_number,reference_ring_number").eq("id",b.father_id).maybeSingle() : Promise.resolve({data:null}),
    b.mother_id ? supabase.from("birds").select("name,ring_number,reference_ring_number").eq("id",b.mother_id).maybeSingle() : Promise.resolve({data:null})
  ]);
  let logo = "";
  if (profile.criatorio_logo_path) {
    const {data} = await supabase.storage.from("criatorio-brand").createSignedUrl(profile.criatorio_logo_path, 3600);
    logo = data?.signedUrl || "";
  }
  const genetics = Object.entries((b.genetics||{}) as Record<string,unknown>).map(([k,v])=>`${k}: ${v}`).join(" · ");
  const consultHtml = (consultations||[]).map((c:any)=>`<div class="record"><b>${esc(c.consultation_date||c.created_at||"Consulta")} · ${esc(c.status)}</b><p>${esc(c.description||"Sem descrição.")}</p>${c.vet_notes?`<p><b>Veterinário:</b> ${esc(c.vet_notes)}</p>`:""}</div>`).join("") || `<p class="muted">Nenhuma consulta registrada.</p>`;

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ficha — ${esc(b.name)}</title>
<style>
*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:22px;background:#e3f2fd;color:#0d1b2a}
.sheet{max-width:900px;margin:auto;background:#fff;border:1px solid #d9e1e8;border-radius:18px;padding:28px}
.header{display:flex;gap:16px;align-items:center;border-bottom:1px solid #d9e1e8;padding-bottom:18px}.logo{width:72px;height:72px;object-fit:contain;border:1px solid #d9e1e8;border-radius:12px}.brand{font-size:22px;font-weight:800;color:#237653}.muted{color:#6d8179}.title{font-size:30px;margin:22px 0 4px}.species{color:#668078}.section{margin-top:20px;border-top:1px solid #e2eee9;padding-top:14px}.section h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#31805f}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}.item{font-size:13px}.item b{display:block;font-size:10px;color:#6d8179;text-transform:uppercase;margin-bottom:3px}.record{border:1px solid #d9e1e8;border-radius:10px;padding:10px;margin:8px 0;font-size:12px}.print{display:block;margin:18px auto 0;border:0;background:#1565c0;color:#fff;padding:11px 18px;border-radius:10px;font-weight:700;cursor:pointer}@media(max-width:650px){body{padding:0}.sheet{border:0;border-radius:0}.grid{grid-template-columns:1fr 1fr}}@media print{body{background:#fff;padding:0}.sheet{border:0;padding:0}.print{display:none}}@page{size:A4;margin:12mm}
</style></head><body><div class="sheet">
<div class="header">${logo?`<img class="logo" src="${esc(logo)}">`:""}<div><div class="brand">${esc(profile.criatorio_name||"Minhas Aves")}</div><div class="muted">Responsável: ${esc(profile.full_name)}${profile.city||profile.state?` · ${esc([profile.city,profile.state].filter(Boolean).join("/"))}`:""}</div></div></div>
<div class="title">${esc(b.name)}</div><div class="species">${esc(b.species?.common_name)} · <i>${esc(b.species?.scientific_name)}</i></div>
<div class="section"><h2>Identificação</h2><div class="grid">
<div class="item"><b>Sexo</b>${esc(b.sex)}</div><div class="item"><b>Status</b>${esc(b.status)}</div><div class="item"><b>Nascimento</b>${esc(b.birth_date)}</div><div class="item"><b>Falecimento</b>${esc(b.death_date)}</div><div class="item"><b>Transferência</b>${esc(b.transfer_date)}</div><div class="item"><b>Anilha</b>${esc(b.ring_number||b.reference_ring_number)}</div><div class="item"><b>Registro</b>${esc(b.ibama_registration_number)}</div><div class="item"><b>CTF do criatório</b>${esc("")}</div><div class="item"><b>Tipo de registro</b>${esc(b.ibama_record_type)}</div></div></div>
<div class="section"><h2>Genealogia e genética</h2><div class="grid"><div class="item"><b>Pai</b>${esc(fatherRes.data?.name)} ${(fatherRes.data?.ring_number||fatherRes.data?.reference_ring_number)?`· ${esc(fatherRes.data.ring_number||fatherRes.data.reference_ring_number)}`:""}</div><div class="item"><b>Mãe</b>${esc(motherRes.data?.name)} ${(motherRes.data?.ring_number||motherRes.data?.reference_ring_number)?`· ${esc(motherRes.data.ring_number||motherRes.data.reference_ring_number)}`:""}</div><div class="item"><b>Matriz principal</b>${b.breeder_matrix?"Sim":"Não"}</div><div class="item"><b>Linhagem</b>${esc(b.genetic_line)}</div><div class="item" style="grid-column:span 2"><b>Genética</b>${esc(genetics)}</div></div></div>
<div class="section"><h2>Observações</h2><p>${esc(b.notes||"Nenhuma observação.")}</p></div>
<div class="section"><h2>Histórico veterinário</h2>${consultHtml}</div>
<div class="section"><h2>Identidade do criatório</h2><p class="muted">Esta ficha pertence ao criatório identificado acima. Dados regulatórios são informados pelo responsável e devem ser mantidos conforme documentação oficial aplicável.</p></div>
</div><button class="print" onclick="window.print()">Imprimir ficha</button></body></html>`;
  return new NextResponse(html,{headers:{"content-type":"text/html;charset=utf-8"}});
}
