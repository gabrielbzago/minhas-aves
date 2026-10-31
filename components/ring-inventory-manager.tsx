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
  const client=createClient();
  async function load(){
    setLoading(true);setError("");
    const {data,error}=await client.from("ring_inventory").select("*,species:species_id(common_name,scientific_name),father:father_id(name,ring_number),mother:mother_id(name,ring_number),applied_bird:applied_to_bird_id(name,ring_number)").order("created_at",{ascending:false});
    if(error)setError(friendlySupabaseError(error,"Não foi possível carregar o estoque. Confira se aplicou a migração SQL no Supabase."));
    else setRows(data||[]);
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);
  const available=rows.filter(r=>r.status==="disponivel");
  const applied=rows.filter(r=>r.status==="aplicada");
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
  async function changeSex(id:string,sex:string){
    setBusy(true);setError("");
    const {data,error}=await client.rpc("update_ring_sex",{p_ring_id:id,p_sex:sex});
    if(error)setError(friendlySupabaseError(error,"Não foi possível atualizar o sexo."));
    else setRows(rows.map(r=>r.id===id?{...r,...data,sex}:r));
    setBusy(false);
  }
  async function remove(id:string){
    if(!confirm("Excluir esta anilha do estoque? Somente anilhas ainda disponíveis podem ser excluídas."))return;
    const {error}=await client.from("ring_inventory").delete().eq("id",id).eq("status","disponivel");
    if(error)setError(friendlySupabaseError(error,"Não foi possível excluir a anilha."));
    else setRows(rows.filter(r=>r.id!==id));
  }
  return <div className="module-manager">
    <div className="stat-grid">
      <div className="stat"><small>Total de anilhas</small><strong>{rows.length}</strong></div>
      <div className="stat"><small>Disponíveis</small><strong>{available.length}</strong></div>
      <div className="stat"><small>Aplicadas</small><strong>{applied.length}</strong></div>
      <div className="stat"><small>Sexo indefinido</small><strong>{rows.filter(r=>r.sex==="indeterminado").length}</strong></div>
    </div>
    {error&&<div className="error" role="alert">{error}</div>}
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
      {loading?<div className="empty">Carregando estoque...</div>:filtered.length===0?<div className="empty">Nenhuma anilha encontrada.</div>:<div className="record-list">{filtered.map(r=><article className="record" key={r.id}><div style={{flex:1}}><strong>{r.ring_number}</strong><small>{r.species?.common_name||"Espécie não informada"} · {r.status==="disponivel"?"Disponível":r.status==="aplicada"?"Aplicada":"Cancelada"}{r.applied_bird?.name?` · ${r.applied_bird.name}`:""}</small><p>{r.father?.name?`Pai: ${r.father.name} `:""}{r.mother?.name?`Mãe: ${r.mother.name} `:""}{r.notes||""}</p><div className="field" style={{maxWidth:220}}><label>Sexo</label><select value={r.sex||"indeterminado"} disabled={busy} onChange={e=>changeSex(r.id,e.target.value)}><option value="indeterminado">Indefinido</option><option value="macho">Macho</option><option value="femea">Fêmea</option></select></div></div>{r.status==="disponivel"&&<button className="btn btn-danger" onClick={()=>remove(r.id)}>Excluir</button>}</article>)}</div>}
    </div>
  </div>;
}
