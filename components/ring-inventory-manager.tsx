"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlySupabaseError } from "@/lib/error-messages";

const empty = { ring_number:"", species_id:"", father_id:"", mother_id:"", notes:"" };
export default function RingInventoryManager({birds=[],species=[]}:{birds:any[];species:any[]}) {
  const [rows,setRows]=useState<any[]>([]);
  const [form,setForm]=useState<any>(empty);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [filter,setFilter]=useState("todos");
  const [applyRing,setApplyRing]=useState("");
  const [applyBird,setApplyBird]=useState("");
  const [applySex,setApplySex]=useState("indeterminado");
  const [query,setQuery]=useState("");
  const [sexDrafts,setSexDrafts]=useState<Record<string,string>>({});
  const [motherDrafts,setMotherDrafts]=useState<Record<string,string>>({});
  const [batchImage,setBatchImage]=useState<File|null>(null);
  const [batchRows,setBatchRows]=useState<Array<{ring_number:string;mother_ring_number:string}>>([]);
  const [batchUncertain,setBatchUncertain]=useState<string[]>([]);
  const [batchSpecies,setBatchSpecies]=useState("");
  const [batchFather,setBatchFather]=useState("");
  const [batchMother,setBatchMother]=useState("");
  const [batchNotes,setBatchNotes]=useState("");
  const [batchBusy,setBatchBusy]=useState(false);
  const [canBatch,setCanBatch]=useState(false);
  const [batchMessage,setBatchMessage]=useState("");
  const [batchError,setBatchError]=useState("");
  const client=createClient();
  async function load(){
    setLoading(true);setError("");
    const {data:authData}=await client.auth.getUser();
    if(authData.user){const {data:profile}=await client.from("profiles").select("plan,role").eq("id",authData.user.id).maybeSingle();setCanBatch(profile?.role==="owner"||profile?.role==="veterinarian"||profile?.plan==="profissional"||profile?.plan==="lenda");}
    const {data,error}=await client.from("ring_inventory").select("*,species:species_id(common_name,scientific_name),father:father_id(name,ring_number),mother:mother_id(name,ring_number),applied_bird:applied_to_bird_id(name,ring_number)").order("created_at",{ascending:false});
    if(error)setError(friendlySupabaseError(error,"Não foi possível carregar o estoque. Confira se aplicou a migração SQL no Supabase."));
    else setRows(data||[]);
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);
  const available=rows.filter(r=>r.status==="disponivel");
  const applied=rows.filter(r=>r.status==="aplicada");
  // Resumo gerencial: distribuição do estoque por espécie e vínculo com as matrizes.
  const speciesSummary=useMemo(()=>{
    const groups=new Map<string,any>();
    rows.forEach(r=>{
      const key=r.species_id||"sem-especie";
      if(!groups.has(key))groups.set(key,{key,name:r.species?.common_name||"Espécie não informada",scientific:r.species?.scientific_name||"",total:0,available:0,applied:0,other:0});
      const g=groups.get(key);g.total++;
      if(r.status==="disponivel")g.available++;else if(r.status==="aplicada")g.applied++;else g.other++;
    });
    return [...groups.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,"pt-BR"));
  },[rows]);
  const maxSpeciesTotal=Math.max(1,...speciesSummary.map((g:any)=>g.total));
  const motherSummary=useMemo(()=>{
    const groups=new Map<string,any>();
    rows.filter(r=>r.mother_id||r.mother?.name).forEach(r=>{
      const key=r.mother_id||r.mother?.name||"sem-matriz";
      if(!groups.has(key))groups.set(key,{key,name:r.mother?.name||"Fêmea não identificada",ringNumber:r.mother?.ring_number||"",rings:[],available:0,applied:0});
      const g=groups.get(key);g.rings.push(r);if(r.status==="disponivel")g.available++;if(r.status==="aplicada")g.applied++;
    });
    return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  },[rows]);
  const filtered=useMemo(()=>rows.filter(r=>(filter==="todos"||r.status===filter)&&(`${r.ring_number} ${r.species?.common_name||""} ${r.notes||""}`).toLowerCase().includes(query.toLowerCase())),[rows,filter,query]);
  const set=(k:string,v:string)=>setForm((x:any)=>({...x,[k]:v}));
  async function add(e:any){
    e.preventDefault();setBusy(true);setError("");
    const {data:auth}=await client.auth.getUser();
    if(!auth.user){setError("Faça login novamente.");setBusy(false);return;}
    const {data,error}=await client.from("ring_inventory").insert({...form,ring_number:form.ring_number.trim(),species_id:form.species_id||null,father_id:form.father_id||null,mother_id:form.mother_id||null,user_id:auth.user.id,sex:"indeterminado",status:"disponivel"}).select("*,species:species_id(common_name,scientific_name),father:father_id(name),mother:mother_id(name)").single();
    if(error)setError(friendlySupabaseError(error,"Não foi possível cadastrar a anilha. Verifique se o número já existe."));
    else {setRows([data,...rows]);setForm(empty);}
    setBusy(false);
  }
  async function apply(e:any){
    e.preventDefault();setBusy(true);setError("");
    const {data,error}=await client.rpc("apply_ring_to_bird",{p_ring_id:applyRing,p_bird_id:applyBird,p_sex:applySex});
    if(error)setError(friendlySupabaseError(error,"Não foi possível aplicar a anilha ao filhote."));
    else {setRows(rows.map(r=>r.id===applyRing?{...r,...data, status:"aplicada",applied_to_bird_id:applyBird,sex:applySex,applied_bird:birds.find(b=>b.id===applyBird)}:r));setApplyRing("");setApplyBird("");setApplySex("indeterminado");await load();}
    setBusy(false);
  }
  async function saveMother(id:string){
    const motherId=motherDrafts[id]||"";
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/rings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,mother_id:motherId||null})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Não foi possível alterar a matriz.");
      setMotherDrafts(current=>{const next={...current};delete next[id];return next;});
      await load();
    }catch(e:any){setError(e?.message||"Não foi possível alterar a matriz.");}
    finally{setBusy(false);}
  }
  async function saveSex(id:string){
    const sex=sexDrafts[id];
    if(!sex)return;
    setBusy(true);setError("");
    const {data,error}=await client.rpc("update_ring_sex",{p_ring_id:id,p_sex:sex});
    if(error)setError(friendlySupabaseError(error,"Não foi possível salvar o sexo da anilha e do filhote."));
    else {
      setRows(current=>current.map(r=>r.id===id?{...r,...(data||{}),sex}:r));
      setSexDrafts(current=>{const next={...current};delete next[id];return next;});
    }
    setBusy(false);
  }
  async function remove(id:string){
    if(!confirm("Excluir esta anilha do estoque? Somente anilhas ainda disponíveis podem ser excluídas."))return;
    const {error}=await client.from("ring_inventory").delete().eq("id",id).eq("status","disponivel");
    if(error)setError(friendlySupabaseError(error,"Não foi possível excluir a anilha."));
    else setRows(rows.filter(r=>r.id!==id));
  }
  async function readBatchPhoto(){
    if(!batchImage)return;
    setBatchBusy(true);setBatchError("");setBatchMessage("");
    try{
      const dataUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Não foi possível ler a foto."));reader.readAsDataURL(batchImage);});
      const image=new Image();image.src=dataUrl;await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
      const scale=Math.min(1,1800/Math.max(image.width,image.height));const canvas=document.createElement("canvas");canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext("2d")!.drawImage(image,0,0,canvas.width,canvas.height);
      const optimized=canvas.toDataURL("image/jpeg",0.82);
      const response=await fetch("/api/rings/import-photo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:optimized,mimeType:"image/jpeg"})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Falha ao ler a foto.");
      setBatchRows(result.items|| (result.ringNumbers||[]).map((ring_number:string)=>({ring_number,mother_ring_number:""})));setBatchUncertain(result.uncertain||[]);setBatchNotes(result.notes||"");setBatchMessage(`${(result.ringNumbers||[]).length} número(s) identificados. Revise a lista antes de cadastrar.`);
    }catch(e:any){setBatchError(e?.message||"Não foi possível ler a foto.");}finally{setBatchBusy(false);}
  }
  async function importBatch(){
    const items=batchRows.map(item=>({ring_number:item.ring_number.trim(),mother_ring_number:item.mother_ring_number.trim()})).filter(item=>item.ring_number);
    if(!batchSpecies||!items.length){setBatchError("Selecione a espécie e confira os números.");return;}
    setBatchBusy(true);setBatchError("");setBatchMessage("");
    try{
      const response=await fetch("/api/rings/import-photo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"import",items,speciesId:batchSpecies,fatherId:batchFather||null,motherId:batchMother||null,notes:batchNotes})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Não foi possível cadastrar o lote.");
      setBatchMessage(`${result.imported} anilha(s) cadastrada(s) com sucesso no estoque.`);setBatchRows([]);setBatchImage(null);setBatchUncertain([]);setBatchFather("");setBatchMother("");await load();
    }catch(e:any){setBatchError(e?.message||"Falha ao importar o lote.");}finally{setBatchBusy(false);}
  }
  return <div className="module-manager">
    <div className="stat-grid">
      <div className="stat"><small>Total de anilhas</small><strong>{rows.length}</strong></div>
      <div className="stat"><small>Disponíveis</small><strong>{available.length}</strong></div>
      <div className="stat"><small>Aplicadas</small><strong>{applied.length}</strong></div>
      <div className="stat"><small>Sexo indefinido</small><strong>{rows.filter(r=>r.sex==="indeterminado").length}</strong></div>
    </div>
    <section className="form-card" style={{marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div><h3 style={{marginBottom:4}}>Painel de estoque por espécie</h3><p style={{margin:0}}>Acompanhe a quantidade de anilhas de cada espécie e a situação do estoque.</p></div>
        <span className="badge">{speciesSummary.length} espécie(s)</span>
      </div>
      {loading?<div className="empty">Carregando indicadores...</div>:speciesSummary.length===0?<div className="empty">Ainda não há anilhas cadastradas para gerar o painel.</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14,marginTop:18}}>
        {speciesSummary.map((g:any)=>{
          const availablePct=g.total?g.available/g.total*100:0;const appliedPct=g.total?g.applied/g.total*100:0;
          return <article key={g.key} style={{border:"1px solid var(--border, #e5e7eb)",borderRadius:12,padding:14,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><div style={{minWidth:0}}><strong>{g.name}</strong>{g.scientific&&<small style={{display:"block",color:"var(--muted,#64748b)",marginTop:3}}>{g.scientific}</small>}</div><strong style={{fontSize:24}}>{g.total}</strong></div>
            <div style={{height:12,display:"flex",overflow:"hidden",borderRadius:99,background:"var(--surface-secondary,#edf1ee)",marginTop:14}} title={`${g.available} disponíveis, ${g.applied} aplicadas`}>
              {g.available>0&&<div style={{width:`${availablePct}%`,background:"#16a34a"}}/>}{g.applied>0&&<div style={{width:`${appliedPct}%`,background:"#3b82f6"}}/>}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",fontSize:12,marginTop:10}}><span><i style={{display:"inline-block",width:8,height:8,borderRadius:9,background:"#16a34a",marginRight:5}}/>Disponíveis: <b>{g.available}</b></span><span><i style={{display:"inline-block",width:8,height:8,borderRadius:9,background:"#3b82f6",marginRight:5}}/>Aplicadas: <b>{g.applied}</b></span></div>
            {g.other>0&&<small style={{display:"block",marginTop:7,color:"var(--muted,#64748b)"}}>Outras situações: {g.other}</small>}
          </article>;
        })}
      </div>}
    </section>
    <section className="form-card" style={{marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><h3 style={{marginBottom:4}}>Anilhas vinculadas às fêmeas (matrizes)</h3><p style={{margin:0}}>Veja quais anilhas foram cadastradas com cada fêmea como mãe da futura ave.</p></div><strong>{motherSummary.reduce((n:number,g:any)=>n+g.rings.length,0)} vínculo(s)</strong></div>
      {loading?<div className="empty">Carregando vínculos...</div>:motherSummary.length===0?<div className="empty">Nenhuma anilha possui uma fêmea/matriz vinculada. Ao cadastrar uma anilha, selecione a mãe para acompanhar essa relação aqui.</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginTop:16}}>
        {motherSummary.map((g:any)=><article key={g.key} style={{border:"1px solid var(--border, #e5e7eb)",borderRadius:12,padding:14,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><div><strong>{g.name}</strong>{g.ringNumber&&<small style={{display:"block",color:"var(--muted,#64748b)"}}>Anilha da matriz: {g.ringNumber}</small>}</div><strong>{g.rings.length} anilha(s)</strong></div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>{g.rings.map((r:any)=><span key={r.id} style={{padding:"5px 9px",borderRadius:8,background:"var(--surface-secondary,#f1f5f2)",fontSize:12,fontWeight:700}}>{r.ring_number}</span>)}</div>
          <small style={{display:"block",marginTop:10,color:"var(--muted,#64748b)"}}>{g.available} disponível(is) · {g.applied} aplicada(s)</small>
        </article>)}
      </div>}
    </section>
    {error&&<div className="error" role="alert">{error}</div>}
    {canBatch&&<section className="form-card" style={{marginTop:16,border:"1px solid var(--border,#dce5df)"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><h3 style={{marginBottom:4}}>Importar estoque por foto</h3><p style={{margin:0}}>Fotografe uma lista de anilhas. A IA identifica cada anilha e, quando houver coluna de mãe/matriz, tenta vincular pelo número de anilha já cadastrado no plantel.</p></div><span className="badge">Profissional e Lenda</span></div>
      <div className="form-grid" style={{marginTop:14}}>
        <div className="field full"><label>Foto da lista de anilhas</label><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>{setBatchImage(e.target.files?.[0]||null);setBatchRows([]);setBatchError("");setBatchMessage("");}}/><small>JPG, PNG ou WEBP. Prefira foto reta, com boa iluminação e toda a lista visível.</small></div>
        <div className="field"><label>Espécie do lote *</label><select value={batchSpecies} onChange={e=>setBatchSpecies(e.target.value)}><option value="">Selecione a espécie</option>{species.map((sp:any)=><option key={sp.id} value={sp.id}>{sp.common_name} · {sp.scientific_name}</option>)}</select></div>
        <div className="field"><label>Pai (opcional, mesmo para o lote)</label><select value={batchFather} onChange={e=>setBatchFather(e.target.value)}><option value="">Não informado</option>{birds.filter((b:any)=>b.sex==="macho"&&(!batchSpecies||b.species_id===batchSpecies)).map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div>
        <div className="field"><label>Mãe (opcional, mesmo para o lote)</label><select value={batchMother} onChange={e=>setBatchMother(e.target.value)}><option value="">Não informado</option>{birds.filter((b:any)=>b.sex==="femea"&&(!batchSpecies||b.species_id===batchSpecies)).map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div>
      </div>
      <div className="form-actions"><button type="button" className="btn btn-primary" disabled={!batchImage||batchBusy} onClick={readBatchPhoto}>{batchBusy?"Lendo imagem...":"Ler lista com IA"}</button></div>
      {batchError&&<div className="error" role="alert" style={{marginTop:12}}>{batchError}</div>}{batchMessage&&<p role="status" style={{marginTop:12,color:"var(--success,#16834a)"}}>{batchMessage}</p>}
      {batchUncertain.length>0&&<div style={{marginTop:10,padding:12,borderRadius:10,background:"var(--surface-secondary,#f4f6f4)"}}><strong>Linhas que precisam de conferência</strong><ul>{batchUncertain.map((v,i)=><li key={i}>{v}</li>)}</ul></div>}
      {batchRows.length>0&&<div style={{marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",alignItems:"center"}}><strong>Revise os números identificados ({batchRows.length})</strong><small>Todos começam como disponíveis e sexo indefinido.</small></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:8,marginTop:10}}>{batchRows.map((item,i)=><div key={i} className="field" style={{border:"1px solid var(--border,#e5e7eb)",borderRadius:10,padding:10}}><label>Anilha do estoque {i+1}</label><input value={item.ring_number} onChange={e=>setBatchRows(rows=>rows.map((v,j)=>j===i?{...v,ring_number:e.target.value}:v))}/><label style={{marginTop:8}}>Anilha da mãe/matriz (opcional)</label><input value={item.mother_ring_number} placeholder="Número da anilha da mãe na lista" onChange={e=>setBatchRows(rows=>rows.map((v,j)=>j===i?{...v,mother_ring_number:e.target.value}:v))}/>{item.mother_ring_number&&<small style={{color:birds.some((b:any)=>String(b.ring_number||"").trim().toLowerCase()===item.mother_ring_number.trim().toLowerCase()&&b.sex==="femea")?"var(--success,#16834a)":"var(--muted,#64748b)"}}>{(()=>{const m=birds.find((b:any)=>String(b.ring_number||"").trim().toLowerCase()===item.mother_ring_number.trim().toLowerCase()&&b.sex==="femea");return m?`Matriz encontrada: ${m.name}`:"A matriz será conferida no plantel ao cadastrar"})()}</small>}</div>)}</div><div className="form-actions"><button type="button" className="btn btn-primary" disabled={batchBusy||!batchSpecies||!batchRows.some(item=>item.ring_number.trim())} onClick={importBatch}>{batchBusy?"Cadastrando lote...":`Cadastrar ${batchRows.length} anilha(s)`}</button><button type="button" className="btn btn-secondary" disabled={batchBusy} onClick={()=>{setBatchRows([]);setBatchMessage("");}}>Descartar leitura</button></div></div>}
    </section>}
    <div className="form-card" style={{marginTop:16}}>
      <h3>Cadastrar anilha no estoque</h3>
      <p>Informe a espécie cadastrada no catálogo do Apollo e vincule os pais já existentes no seu plantel. Cada número é individual e o sexo começa como indefinido.</p>
      <form onSubmit={add}><div className="form-grid">
        <div className="field"><label>Número da anilha *</label><input required value={form.ring_number} onChange={e=>set("ring_number",e.target.value)} placeholder="Ex.: 001234"/></div>
        <div className="field"><label>Espécie *</label><select required value={form.species_id} onChange={e=>setForm((x:any)=>({...x,species_id:e.target.value,father_id:"",mother_id:""}))}><option value="">Selecione a espécie</option>{species.map((s:any)=><option key={s.id} value={s.id}>{s.common_name} · {s.scientific_name}</option>)}</select></div>
        <div className="field"><label>Pai da anilha (macho cadastrado da mesma espécie)</label><select value={form.father_id} onChange={e=>set("father_id",e.target.value)}><option value="">Não informado</option>{birds.filter((b:any)=>b.sex==="macho" && (!form.species_id || b.species_id===form.species_id)).map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div>
        <div className="field"><label>Mãe da anilha (fêmea cadastrada da mesma espécie)</label><select value={form.mother_id} onChange={e=>set("mother_id",e.target.value)}><option value="">Não informado</option>{birds.filter((b:any)=>b.sex==="femea" && (!form.species_id || b.species_id===form.species_id)).map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div>
        <div className="field full"><label>Observações</label><textarea rows={3} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Fornecedor, lote, cor, tamanho, observações..."/></div>
      </div><div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy?"Salvando...":"Cadastrar anilha"}</button></div></form>
    </div>
    <div className="form-card" style={{marginTop:16}}>
      <h3>Aplicar anilha em filhote</h3>
      <p>Selecione uma anilha em estoque e um filhote da mesma espécie. O Apollo vincula o número e os pais registrados na anilha, e realiza a baixa automaticamente.</p>
      <form onSubmit={apply}><div className="form-grid">
        <div className="field"><label>Anilha disponível *</label><select required value={applyRing} onChange={e=>setApplyRing(e.target.value)}><option value="">Selecione</option>{available.map(r=><option key={r.id} value={r.id}>{r.ring_number} · {r.species?.common_name||"Espécie não informada"}</option>)}</select></div>
        <div className="field"><label>Filhote do plantel *</label><select required value={applyBird} onChange={e=>setApplyBird(e.target.value)}><option value="">Selecione</option>{birds.filter((b:any)=>!b.ring_number && (!available.find(r=>r.id===applyRing)?.species_id || b.species_id===available.find(r=>r.id===applyRing)?.species_id)).map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.species?.common_name||"espécie não informada"}</option>)}</select></div>
        <div className="field"><label>Sexo (pode definir depois)</label><select value={applySex} onChange={e=>setApplySex(e.target.value)}><option value="indeterminado">Indefinido</option><option value="macho">Macho</option><option value="femea">Fêmea</option></select></div>
      </div><div className="form-actions"><button className="btn btn-primary" disabled={busy||!available.length||!applyBird||!applyRing}>{busy?"Aplicando...":"Aplicar anilha e dar baixa"}</button></div></form>
    </div>
    <div className="form-card" style={{marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><h3>Estoque e histórico</h3><strong>{available.length} disponível(is)</strong></div>
      <div className="form-grid"><div className="field"><label>Buscar</label><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Número, espécie ou observação"/></div><div className="field"><label>Exibir</label><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="todos">Todas</option><option value="disponivel">Disponíveis</option><option value="aplicada">Aplicadas</option><option value="cancelada">Canceladas</option></select></div></div>
      {loading?<div className="empty">Carregando estoque...</div>:filtered.length===0?<div className="empty">Nenhuma anilha encontrada.</div>:<div className="record-list">{filtered.map(r=><article className="record" key={r.id}><div style={{flex:1}}><strong>{r.ring_number}</strong><small>{r.species?.common_name||"Espécie não informada"} · {r.status==="disponivel"?"Disponível":r.status==="aplicada"?"Aplicada":"Cancelada"}{r.applied_bird?.name?` · ${r.applied_bird.name}`:""}</small><p>{r.father?.name?`Pai: ${r.father.name} `:""}{r.mother?.name?`Mãe: ${r.mother.name} `:""}{r.notes||""}</p><div style={{display:"flex",alignItems:"end",gap:8,flexWrap:"wrap",marginTop:10}}><div className="field" style={{maxWidth:220,flex:1}}><label>Sexo do filhote</label><select value={sexDrafts[r.id]??(r.sex||"indeterminado")} disabled={busy} onChange={e=>setSexDrafts(current=>({...current,[r.id]:e.target.value}))}><option value="indeterminado">Indefinido</option><option value="macho">Macho</option><option value="femea">Fêmea</option></select></div><button type="button" className="btn btn-primary" disabled={busy||!sexDrafts[r.id]||sexDrafts[r.id]===(r.sex||"indeterminado")} onClick={()=>saveSex(r.id)}>{busy?"Salvando...":"Salvar sexo"}</button></div><div style={{display:"flex",alignItems:"end",gap:8,flexWrap:"wrap",marginTop:10}}><div className="field" style={{maxWidth:340,flex:1}}><label>Mãe/matriz vinculada</label><select value={motherDrafts[r.id]??(r.mother_id||"")} disabled={busy} onChange={e=>setMotherDrafts(current=>({...current,[r.id]:e.target.value}))}><option value="">Não vinculada</option>{birds.filter((b:any)=>b.sex==="femea"&&(!r.species_id||b.species_id===r.species_id)).map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.ring_number||"sem anilha"}</option>)}</select></div><button type="button" className="btn btn-soft" disabled={busy||(motherDrafts[r.id]??(r.mother_id||""))===(r.mother_id||"")} onClick={()=>saveMother(r.id)}>{busy?"Salvando...":"Salvar matriz"}</button></div></div>{r.status==="disponivel"&&<button className="btn btn-danger" onClick={()=>remove(r.id)}>Excluir</button>}</article>)}</div>}
    </div>
  </div>;
}
