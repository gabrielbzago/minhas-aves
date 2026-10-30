"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlySupabaseError } from "@/lib/error-messages";
import { useRouter } from "next/navigation";
import VetBookingForm from "@/components/vet-booking-form";
import { CARD_COLORS, DEFAULT_CARD_COLOR, type CardColorKey } from "@/lib/card-colors";

const FIELD_MAP: Record<string, {label:string; key:string; type?:string; placeholder?:string}[]> = {
  "gestao-anilhas":[{label:"Número da anilha",key:"ring_number"},{label:"Tipo",key:"ring_type"},{label:"Data",key:"date",type:"date"},{label:"Observações",key:"notes",type:"textarea"}],
  "galeria-fotos":[{label:"Título da foto",key:"title"},{label:"Descrição",key:"description",type:"textarea"}],
  "gestao-documentos":[{label:"Nome do documento",key:"title"},{label:"Tipo",key:"document_type"},{label:"Número/referência",key:"reference"},{label:"Observações",key:"notes",type:"textarea"}],
  "gestao-gaiola":[{label:"Identificação da gaiola",key:"cage_code"},{label:"Localização",key:"location"},{label:"Capacidade",key:"capacity"},{label:"Observações",key:"notes",type:"textarea"}],
  "historico-ave":[{label:"Tipo de acontecimento",key:"event_type",placeholder:"Transferência, nascimento, falecimento..."},{label:"Data",key:"date",type:"date"},{label:"Descrição",key:"description",type:"textarea"}],
  "comportamento":[{label:"Data",key:"date",type:"date"},{label:"Comportamento observado",key:"behavior",type:"textarea"},{label:"Observações",key:"notes",type:"textarea"}],
  "sms":[{label:"Telefone",key:"phone"},{label:"Mensagem",key:"message",type:"textarea"},{label:"Data prevista",key:"scheduled_at",type:"datetime-local"}],
  "reproducao":[{label:"Evento",key:"event"},{label:"Data",key:"date",type:"date"},{label:"Casal / referência",key:"pair"},{label:"Ninhada / filhotes",key:"offspring"},{label:"Observações",key:"notes",type:"textarea"}],
  "doencas":[{label:"Ocorrência",key:"condition"},{label:"Data",key:"date",type:"date"},{label:"Diagnóstico informado",key:"diagnosis",type:"textarea"},{label:"Observações",key:"notes",type:"textarea"}],
  "medicamentos":[{label:"Medicamento",key:"medicine"},{label:"Dose / orientação",key:"dose"},{label:"Início",key:"start_date",type:"date"},{label:"Fim",key:"end_date",type:"date"},{label:"Observações",key:"notes",type:"textarea"}],
  "genotipagem":[{label:"Exame / laboratório",key:"exam"},{label:"Data",key:"date",type:"date"},{label:"Resultado",key:"result",type:"textarea"},{label:"Documento / referência",key:"reference"}],
  "sexagem":[{label:"Método",key:"method"},{label:"Data",key:"date",type:"date"},{label:"Resultado",key:"result"},{label:"Referência / documento",key:"reference"}],
  "gestao-ave":[{label:"Observação do cadastro",key:"notes",type:"textarea"}],
};

const SPECIAL: Record<string,{title:string;description:string}> = {
  "gestao-ave": {title:"Gestão de Ave",description:"Acesse e gerencie as fichas individuais do seu plantel."},
  "genealogia": {title:"Genealogia",description:"Selecione uma ave para abrir a árvore genealógica completa e seus descendentes."},
  "painel": {title:"Painel de Dados",description:"Resumo rápido do plantel cadastrado nesta conta."},
  "cartao-gaiola": {title:"Cartão de Gaiola",description:"Visualize o cartão frente e verso já preenchido com os dados da ave e a identidade do criatório."},
  "imprimir-ficha": {title:"Imprimir ficha da ave",description:"Gere a ficha A4 individual da ave selecionada."},
  "imprimir-plantel": {title:"Imprimir plantel",description:"Gere uma lista organizada do plantel inteiro para impressão."},
  "imprimir-genealogia": {title:"Imprimir genealogia",description:"Gere a árvore genealógica da ave selecionada em folha pronta para impressão."},
  "consulta-veterinaria-inclusa": {title:"Consulta veterinária inclusa",description:"Benefício anual do Criador Lenda: uma consulta para uma ave durante cada período pago."},
  "modulo-veterinario": {title:"Módulo Veterinário Completo",description:"Centralize consultas, prontuários, receitas e documentos veterinários vinculados às aves. O Módulo Veterinário é liberado nos planos Profissional e Lenda."},
};

export default function ModuleManager({module,birds,initialRecords,canImport,vet}:any){
 const router=useRouter(); const [cardColor,setCardColor]=useState<CardColorKey>(DEFAULT_CARD_COLOR); const [records,setRecords]=useState<any[]>(initialRecords||[]); const [birdId,setBirdId]=useState(""); const [title,setTitle]=useState(""); const [data,setData]=useState<Record<string,string>>({}); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [file,setFile]=useState<File|null>(null);
 const fields=FIELD_MAP[module]||[{label:"Título",key:"title"},{label:"Observações",key:"notes",type:"textarea"}];
 const set=(k:string,v:string)=>setData(x=>({...x,[k]:v}));
 async function save(e:any){
  e.preventDefault(); setBusy(true); setError(""); const c=createClient();
  if((module==="galeria-fotos"||module==="gestao-documentos") && file){
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"); const path=`${(await c.auth.getUser()).data.user?.id}/${birdId||"geral"}/${crypto.randomUUID()}-${safe}`;
    const {error:uploadError}=await c.storage.from("bird-media").upload(path,file,{upsert:false,contentType:file.type});
    if(uploadError){console.error("[Minhas Aves] upload de mídia", uploadError);setError(friendlySupabaseError(uploadError,"Não foi possível enviar o arquivo. Verifique o formato e tente novamente."));setBusy(false);return;}
    const {data:media,error:mediaError}=await c.from("bird_media").insert({bird_id:birdId||null,kind:module==="galeria-fotos"?"foto":"documento",title:title||file.name,storage_path:path,mime_type:file.type}).select().single();
    if(mediaError){console.error("[Minhas Aves] cadastro de mídia", mediaError);setError(friendlySupabaseError(mediaError,"Não foi possível salvar o arquivo."));} else {setRecords([...(records||[]),{id:media.id,title:media.title,data:{arquivo:file.name,mime:file.type},event_date:null,created_at:media.created_at}]);setFile(null);setTitle("");setData({});}
    setBusy(false); return;
  }
  if (birdId && module === "gestao-anilhas" && data.ring_number) {
    const { data: available, error: ringError } = await c.rpc("is_bird_ring_available", { p_ring: String(data.ring_number).trim(), p_exclude: birdId });
    if (ringError) { setError(friendlySupabaseError(ringError, "Não foi possível verificar o número da anilha.")); setBusy(false); return; }
    if (available === false) { setError("Este número de anilha já está cadastrado no sistema. Cada anilha é única e não pode ser reutilizada, mesmo se a ave estiver arquivada, falecida ou transferida."); setBusy(false); return; }
  }
  const {data:row,error}=await c.from("bird_module_records").insert({bird_id:birdId||null,module_code:module,title:title||data.title||fields[0]?.label||"Registro",data,event_date:data.date||null}).select().single();
  if(error){console.error("[Minhas Aves] módulo", error);setError(friendlySupabaseError(error,"Não foi possível salvar este registro."));} else{
    if(birdId && module==="gestao-anilhas" && data.ring_number) {
      const { error: ringUpdateError } = await c.from("birds").update({ring_number:String(data.ring_number).trim()}).eq("id",birdId);
      if(ringUpdateError) { setError(friendlySupabaseError(ringUpdateError, "Não foi possível atualizar a anilha.")); setBusy(false); return; }
    }
    if(birdId && module==="sexagem" && data.result){const sex=String(data.result).toLowerCase().startsWith("m")?"macho":String(data.result).toLowerCase().startsWith("f")?"femea":"indeterminado"; await c.from("birds").update({sex}).eq("id",birdId);}
    setRecords([row,...records]);setTitle("");setData({});
  }
  setBusy(false);
 }
 async function remove(id:string){if(!confirm("Excluir este registro?"))return;const c=createClient();const target=records.find(r=>r.id===id);if(target?._media){const path=target.data?.arquivo; if(path) await c.storage.from("bird-media").remove([String(path)]); const {error}=await c.from("bird_media").delete().eq("id",id); if(!error)setRecords(records.filter(r=>r.id!==id)); return;} const {error}=await c.from("bird_module_records").delete().eq("id",id);if(!error)setRecords(records.filter(r=>r.id!==id));}
 async function importCsv(file:File){setBusy(true);setError("");const text=await file.text();const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2){setError("CSV vazio ou sem cabeçalho.");setBusy(false);return}const headers=lines[0].split(",").map(x=>x.trim().toLowerCase());const idx=(k:string)=>headers.indexOf(k);const payload=lines.slice(1).map(line=>{const cols=line.split(",");const birth=cols[idx("birth_date")]||cols[idx("nascimento")]||"";return {name:cols[idx("name")]||cols[idx("nome")]||"Ave importada",ring_number:cols[idx("ring_number")]||cols[idx("anilha")]||null,sex:(cols[idx("sex")]||"indeterminado").toLowerCase(),birth_date:birth.trim()?birth.trim():null,status:"ativo"};}).filter(x=>x.ring_number);try{const response=await fetch("/api/birds",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok){setError(result.error||"Não foi possível importar as aves.");}else{router.push("/dashboard/plantel");router.refresh();}}catch(err){console.error("[Minhas Aves] importação CSV",err);setError("Não foi possível conectar ao servidor durante a importação.");}finally{setBusy(false);}}

 if(module==="agendar-veterinario") return <div className="module-manager"><div className="card" style={{marginBottom:18}}><h3>Agendamento veterinário</h3><p>Escolha a ave, a modalidade e siga para o WhatsApp do veterinário parceiro. Qualquer plano pode solicitar atendimento.</p></div>{vet?<VetBookingForm birds={birds} vet={vet} initialBird=""/>:<div className="empty">O veterinário parceiro ainda não foi configurado.</div>}</div>;
 if(module==="genealogia") return <div className="module-manager"><div className="form-card"><div className="field full"><label>Ave</label><select value={birdId} onChange={e=>setBirdId(e.target.value)}><option value="">Selecione uma ave</option>{birds.map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div><div className="form-actions"><button className="btn btn-primary" disabled={!birdId} onClick={()=>router.push(`/dashboard/genealogia/${birdId}`)}>Abrir árvore genealógica</button></div></div></div>;
 if(module==="painel") { const total=birds.length, males=birds.filter((b:any)=>String(b.sex).toLowerCase().startsWith("m")).length, females=birds.filter((b:any)=>String(b.sex).toLowerCase().startsWith("f")).length, rings=birds.filter((b:any)=>b.ring_number).length; return <div className="module-manager"><div className="stat-grid"><div className="stat"><small>Aves cadastradas</small><strong>{total}</strong></div><div className="stat"><small>Machos</small><strong>{males}</strong></div><div className="stat"><small>Fêmeas</small><strong>{females}</strong></div><div className="stat"><small>Com anilha</small><strong>{rings}</strong></div></div></div>; }
 if(module==="cartao-gaiola") return <div className="module-manager"><div className="form-card"><div className="card"><h3>Impressão de vários cartões</h3><p>No Meu Plantel, selecione até 24 aves por vez. Os cartões serão montados com frente e verso lado a lado na mesma folha, com marca central para dobrar.</p><Link className="btn btn-primary" href="/dashboard/plantel">Selecionar aves e imprimir cartões dobráveis</Link></div><div className="field full"><label>Ave para visualizar individualmente</label><select value={birdId} onChange={e=>setBirdId(e.target.value)}><option value="">Selecione uma ave</option>{birds.map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div>{module==="cartao-gaiola"&&<div className="card-palette"><div><strong>Cor principal do cartão</strong><span>Escolha a cor que será usada na visualização e na impressão.</span></div><div className="palette-options" role="radiogroup" aria-label="Cor principal do cartão">{Object.entries(CARD_COLORS).map(([key,color])=><button key={key} type="button" className={`palette-swatch ${cardColor===key?"selected":""}`} style={{"--swatch":color.hex} as any} onClick={()=>setCardColor(key as CardColorKey)} aria-label={color.name} title={color.name}><span></span><small>{color.name}</small></button>)}</div></div>}<div className="form-actions">{birdId&&module==="cartao-gaiola"&&<a className="btn btn-primary" href={`/api/birds/card/${birdId}?theme=${encodeURIComponent(cardColor)}`} target="_blank" rel="noopener noreferrer">🖨 Abrir cartão frente e verso</a>}{birdId&&module==="imprimir-ficha"&&<a className="btn btn-primary" href={`/api/print/bird/${birdId}`} target="_blank">🖨 Imprimir ficha da ave</a>}{birdId&&module==="imprimir-genealogia"&&<a className="btn btn-primary" href={`/api/print/genealogia/${birdId}`} target="_blank">🖨 Imprimir genealogia</a>}</div></div></div>;
 if(module==="imprimir-plantel") return <div className="module-manager"><div className="card"><h3>Plantel completo</h3><p>{birds.length} ave(s) cadastrada(s). O documento usa a identidade do criatório e pode ser impresso em A4.</p><a className="btn btn-primary" href="/api/print/plantel" target="_blank">🖨 Abrir impressão do plantel</a></div></div>;
 if(module==="consulta-veterinaria-inclusa") return <div className="module-manager"><div className="card"><h3>Benefício Lenda</h3><p>Uma consulta veterinária para uma ave por período anual pago. A renovação inicia um novo período e libera novamente uma consulta.</p><Link className="btn btn-primary" href="/dashboard/recursos?modulo=agendar-veterinario">Agendar veterinário</Link></div></div>;
 if(module==="modulo-veterinario") return <div className="module-manager"><div className="card" style={{marginBottom:18}}><h3>🩺 Módulo Veterinário Completo</h3><p>Tenha o histórico clínico organizado por ave, com prontuários e receitas anexados pelo veterinário parceiro. O agendamento continua disponível para qualquer plano.</p><div className="actions" style={{marginTop:16}}><Link className="btn btn-primary" href="/dashboard/veterinario/agendar">Agendar veterinário</Link><Link className="btn btn-soft" href="/dashboard/plantel">Abrir plantel e histórico das aves</Link></div></div><div className="grid3">{birds.slice(0,12).map((b:any)=><div className="card" key={b.id}><h3>{b.name}</h3><p>{b.species?.common_name||"Espécie não informada"} · {b.ring_number||"sem anilha"}</p><Link className="btn btn-soft" href={`/dashboard/plantel/${b.id}`}>Abrir histórico veterinário</Link></div>)}</div>{birds.length>12&&<div className="member-note"><strong>{birds.length-12} outras aves</strong><span>Abra o plantel para acessar todas as fichas.</span></div>}</div>;
 if(module==="gestao-ave") return <div className="module-manager"><div className="card"><h3>Fichas do plantel</h3><p>Abra uma ave para editar os dados, genealogia, histórico e documentos vinculados.</p><Link className="btn btn-primary" href="/dashboard/plantel">Abrir meu plantel</Link></div></div>;

 return <div className="module-manager">
  {error&&<div className="error">{error}</div>}
  <form className="form-card" onSubmit={save}>
   <div className="form-grid">
    <div className="field"><label>Ave</label><select value={birdId} onChange={e=>setBirdId(e.target.value)}><option value="">Registro geral</option>{birds.map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div>
    <div className="field"><label>Título</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Identifique este registro"/></div>
    {fields.map((f:any)=><div className={`field ${f.type==="textarea"?"full":""}`} key={f.key}><label>{f.label}</label>{f.type==="textarea"?<textarea rows={4} value={data[f.key]||""} onChange={e=>set(f.key,e.target.value)}/>:<input type={f.type||"text"} value={data[f.key]||""} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder}/>}</div>)}
    {(module==="galeria-fotos"||module==="gestao-documentos")&&<div className="field full"><label>Arquivo</label><input type="file" accept={module==="galeria-fotos"?"image/*":".pdf,.jpg,.jpeg,.png,.doc,.docx"} onChange={e=>setFile(e.target.files?.[0]||null)}/></div>}
   </div><div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy?"Salvando...":"Salvar registro"}</button></div>
  </form>
  {module==="importacao-anilha"&&canImport&&<div className="card import-card"><h3>Importação de anilhas</h3><p>CSV: <code>name,ring_number,sex,birth_date</code>. A importação cria as aves como ativas. O número de anilha é validado contra todo o sistema e não pode ser reutilizado.</p><input type="file" accept=".csv,text/csv" onChange={e=>e.target.files?.[0]&&importCsv(e.target.files[0])}/></div>}
  <div className="record-list">{records.length?records.map((r:any)=><article className="record" key={r.id}><div><strong>{r.title}</strong><small>{r.event_date||r.created_at?.slice(0,10)} {r.birds?.name?` · ${r.birds.name}`:""}</small><p>{r.url&&<a href={r.url} target="_blank" rel="noreferrer" className="btn btn-soft" style={{marginBottom:8}}>Abrir arquivo</a>}{Object.entries(r.data||{}).filter(([,v])=>v).map(([k,v])=><span key={k}><b>{k}:</b> {String(v)} </span>)}</p></div><button className="btn btn-danger" onClick={()=>remove(r.id)}>Excluir</button></article>):<div className="empty">Nenhum registro ainda.</div>}</div>
 </div>
}
