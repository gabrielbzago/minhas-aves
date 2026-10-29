"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { digitsOnlyCpf, formatCpf, isValidCpf } from "@/lib/cpf";

function StatusBadge({ status }: { status: string }) {
  const label: Record<string,string> = { pending: "Pendente", accepted: "Aceita", rejected: "Recusada", cancelled: "Cancelada" };
  return <span className="badge">{label[status] || status}</span>;
}

export default function TransferManager({ birds, transfers, myCpf, userId, initialBirdId }: { birds: any[]; transfers: any[]; myCpf: string | null; userId: string; initialBirdId?: string }) {
  const router = useRouter();
  const [birdId, setBirdId] = useState(initialBirdId || "");
  const [cpf, setCpf] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const incoming = useMemo(() => transfers.filter(t => t.recipient_id === userId && t.status === "pending"), [transfers, userId]);
  const outgoing = useMemo(() => transfers.filter(t => t.sender_id === userId && t.status === "pending"), [transfers, userId]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setMessage("");
    if (!isValidCpf(myCpf)) { setError("Cadastre seu CPF em Configurações antes de transferir uma ave."); return; }
    if (!birdId) { setError("Selecione a ave que será transferida."); return; }
    if (!isValidCpf(cpf)) { setError("Informe um CPF válido do criador que receberá a ave."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bird_id: birdId, recipient_cpf: digitsOnlyCpf(cpf), note }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível solicitar a transferência.");
      setMessage("Solicitação enviada. O outro criador precisa confirmar a transferência.");
      setBirdId(""); setCpf(""); setNote("");
      router.refresh();
    } catch (e:any) { setError(e.message || "Erro ao solicitar transferência."); }
    finally { setBusy(false); }
  }

  async function respond(id:string, accept:boolean) {
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/transfers/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request_id:id, accept }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível responder.");
      setMessage(accept ? "Transferência confirmada. A ave e sua genealogia já estão no seu plantel." : "Transferência recusada.");
      router.refresh();
    } catch(e:any) { setError(e.message || "Erro ao responder transferência."); }
    finally { setBusy(false); }
  }

  return <div className="transfer-page">
    {error && <div className="error">{error}</div>}
    {message && <div className="success">{message}</div>}

    <section className="section-card">
      <div className="section-heading"><div><h2>Transferir uma ave</h2><p>A transferência é feita entre contas do Minhas Aves usando o CPF do criador que receberá a ave.</p></div></div>
      {!isValidCpf(myCpf) && <div className="member-note"><strong>CPF necessário</strong><span>Cadastre seu CPF em <a href="/dashboard/configuracoes" style={{fontWeight:800,color:"var(--primary-dark)"}}>Configurações</a> para habilitar a transferência.</span></div>}
      <form className="form-card" onSubmit={submit} style={{boxShadow:"none",padding:0,border:0}}>
        <div className="form-grid">
          <div className="field"><label>Ave</label><select value={birdId} onChange={e=>setBirdId(e.target.value)} disabled={!isValidCpf(myCpf)}><option value="">Selecione a ave</option>{birds.filter(b=>b.status==='ativo'&&!b.is_genealogy_reference).map(b=><option key={b.id} value={b.id}>{b.name} · {b.species?.common_name || "Espécie não informada"} · {b.ring_number || "sem anilha"}</option>)}</select></div>
          <div className="field"><label>CPF do criador destinatário *</label><input value={cpf} onChange={e=>setCpf(formatCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" disabled={!isValidCpf(myCpf)} /></div>
          <div className="field full"><label>Observação da transferência</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Opcional" disabled={!isValidCpf(myCpf)} /></div>
        </div>
        <div className="card" style={{marginTop:16,background:"var(--surface-soft)"}}><strong>O que será levado para o destinatário?</strong><p style={{margin:"6px 0 0",color:"var(--muted)"}}>A ave real, seus dados, genética, anilha, registros, módulos e histórico veterinário. A árvore genealógica dos ancestrais será reconstruída como registros genealógicos vinculados à ave, sem contar no limite de plantel.</p></div>
        <div className="form-actions"><button className="btn btn-primary" disabled={busy||!isValidCpf(myCpf)}>{busy?"Processando...":"Enviar solicitação de transferência"}</button></div>
      </form>
    </section>

    <section className="section-card">
      <div className="section-heading"><div><h2>Transferências recebidas</h2><p>Confirme ou recuse solicitações enviadas para o seu CPF.</p></div></div>
      <div className="record-list">{incoming.length?incoming.map((t:any)=><article className="record" key={t.id}><div><strong>{t.bird?.name || "Ave"}</strong><small>{t.bird?.species?.common_name || "Espécie não informada"} · anilha: {t.bird?.ring_number || "—"}</small><p>De: <b>{t.sender?.criatorio_name || t.sender?.full_name || "Criador"}</b>{t.note?` · ${t.note}`:""}</p></div><div className="actions" style={{margin:0}}><button className="btn btn-primary" disabled={busy} onClick={()=>respond(t.id,true)}>Aceitar</button><button className="btn btn-danger" disabled={busy} onClick={()=>respond(t.id,false)}>Recusar</button></div></article>):<div className="empty">Nenhuma transferência pendente.</div>}</div>
    </section>

    <section className="section-card">
      <div className="section-heading"><div><h2>Solicitações enviadas</h2><p>Acompanhe transferências que ainda aguardam confirmação.</p></div></div>
      <div className="record-list">{outgoing.length?outgoing.map((t:any)=><article className="record" key={t.id}><div><strong>{t.bird?.name || "Ave"}</strong><small>Destinatário: {t.recipient?.criatorio_name || t.recipient?.full_name || "Criador"}</small><p>Enviada em {t.created_at?.slice(0,10) || "—"}</p></div><StatusBadge status={t.status}/></article>):<div className="empty">Nenhuma solicitação pendente enviada.</div>}</div>
    </section>
  </div>;
}
