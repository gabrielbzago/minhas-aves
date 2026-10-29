"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import VetConsultationManager from "@/components/vet-consultation-manager";

function formatCpf(value: string | null | undefined) {
  const d = String(value || "").replace(/\D/g, "");
  if (d.length !== 11) return value || "CPF não cadastrado";
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

function ageFromBirth(value: string | null | undefined) {
  if (!value) return "—";
  const birth = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return "—";
  const now = new Date();
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  const month = now.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < birth.getUTCDate())) years--;
  if (years < 0) return "—";
  if (years === 0) {
    const months = Math.max(0, month < 0 ? month + 12 : month);
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}

export default function VetPartnerWorkspace({
  creators,
  birds,
  consultations,
  isPreview = false,
}: {
  creators: any[];
  birds: any[];
  consultations: any[];
  isPreview?: boolean;
}) {
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("");
  const [birdQuery, setBirdQuery] = useState("");
  const [selectedBirdId, setSelectedBirdId] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");

  const creatorMap = useMemo(() => new Map(creators.map((x) => [x.id, x])), [creators]);
  const selectedCreator = creatorFilter ? creatorMap.get(creatorFilter) : null;

  const visibleCreators = useMemo(() => {
    const q = creatorSearch.trim().toLowerCase();
    if (!q) return creators;
    return creators.filter((creator) =>
      [creator.criatorio_name, creator.full_name, creator.cpf, creator.city, creator.state]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [creators, creatorSearch]);

  const creatorBirds = useMemo(() => {
    if (!creatorFilter) return [];
    const q = birdQuery.trim().toLowerCase();
    return birds.filter((bird) => {
      if (bird.user_id !== creatorFilter) return false;
      if (!q) return true;
      return [bird.name, bird.ring_number, bird.reference_ring_number, bird.species?.common_name, bird.species?.scientific_name, bird.sex, bird.status]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [birds, creatorFilter, birdQuery]);

  const selectedBird = creatorBirds.find((bird) => bird.id === selectedBirdId) || null;
  const consultationMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const consultation of consultations) {
      const list = map.get(consultation.bird_id) || [];
      list.push(consultation);
      map.set(consultation.bird_id, list);
    }
    return map;
  }, [consultations]);
  const selectedConsultations = selectedBird ? consultationMap.get(selectedBird.id) || [] : [];

  function selectCreator(id: string) {
    setCreatorFilter(id);
    setSelectedBirdId("");
    setBirdQuery("");
    setCreating(false);
    setError("");
    setCreated("");
  }

  async function createConsultation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBird) return;
    setBusy(true);
    setError("");
    setCreated("");
    const form = new FormData(e.currentTarget);
    try {
      const record = form.get("record_pdf");
      const prescription = form.get("prescription_pdf");
      if (!(record instanceof File) || record.size === 0 || !(prescription instanceof File) || prescription.size === 0) {
        throw new Error("Anexe o prontuário e a receita em PDF para concluir a consulta.");
      }
      const createResponse = await fetch("/api/vet/consultation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bird_id: selectedBird.id }),
      });
      const createData = await createResponse.json();
      if (!createResponse.ok) throw new Error(createData.error || "Não foi possível abrir a consulta.");

      const completeForm = new FormData();
      completeForm.set("consultation_id", createData.consultation_id);
      completeForm.set("record_pdf", record);
      completeForm.set("prescription_pdf", prescription);
      completeForm.set("description", String(form.get("description") || ""));
      completeForm.set("vet_notes", String(form.get("vet_notes") || ""));
      completeForm.set("consultation_date", String(form.get("consultation_date") || ""));
      completeForm.set("modality", String(form.get("modality") || "a_combinar"));

      const completeResponse = await fetch("/api/vet/consultation/complete", { method: "POST", body: completeForm });
      const completeData = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completeData.error || "A consulta foi aberta, mas não pôde ser concluída.");
      setCreated("Consulta registrada e os dois PDFs foram arquivados no histórico da ave.");
      setCreating(false);
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || "Não foi possível registrar a consulta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {isPreview && (
        <div className="member-note" style={{ marginBottom: 18, borderColor: "#e8c76a", background: "#fffaf0" }}>
          <strong>👁️ Modo de teste do Owner</strong>
          <span>Selecione qualquer criador ativo para simular a operação. Os documentos enviados neste modo ficam gravados no histórico real.</span>
        </div>
      )}

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="kicker">Criadores ativos</span>
            <h2>Selecionar criador</h2>
            <p>Pesquise pelo nome, criatório ou CPF e selecione o criador para abrir o plantel completo.</p>
          </div>
          <span className="badge">{creators.length} usuários</span>
        </div>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Buscar criador / CPF</label>
            <input value={creatorSearch} onChange={(e) => setCreatorSearch(e.target.value)} placeholder="Ex.: Gabriel, Criatório Zago ou CPF" />
          </div>
          <div className="field">
            <label>Todos os usuários ativos</label>
            <select value={creatorFilter} onChange={(e) => selectCreator(e.target.value)}>
              <option value="">Selecione um criador...</option>
              {visibleCreators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {(creator.criatorio_name || creator.full_name || "Criador")} · {formatCpf(creator.cpf)} · {(creator.plan || "free").toUpperCase()} · {(creator.role || "creator")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCreator && (
          <div className="member-note" style={{ marginTop: 14 }}>
            <strong>{selectedCreator.criatorio_name || selectedCreator.full_name || "Criador"}</strong>
            <span>Responsável: {selectedCreator.full_name || "—"} · CPF: {formatCpf(selectedCreator.cpf)} · Plano: {(selectedCreator.plan || "free").toUpperCase()} · Perfil: {selectedCreator.role || "creator"}</span>
          </div>
        )}
      </section>

      {selectedCreator && (
        <section className="section-card" style={{ marginTop: 18 }}>
          <div className="section-heading">
            <div>
              <span className="kicker">Plantel do criador</span>
              <h2>{selectedCreator.criatorio_name || selectedCreator.full_name || "Plantel"}</h2>
              <p>Selecione uma ave na tabela para abrir o painel clínico e anexar os documentos da consulta.</p>
            </div>
            <span className="badge">{creatorBirds.length} aves</span>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>Buscar ave / anilha / espécie</label>
            <input value={birdQuery} onChange={(e) => setBirdQuery(e.target.value)} placeholder="Ex.: Apollo, 152061, Coleiro..." />
          </div>

          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Espécie</th>
                  <th>Sexo</th>
                  <th>Idade</th>
                  <th>Anilha</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {creatorBirds.map((bird) => (
                  <tr key={bird.id} onClick={() => { setSelectedBirdId(bird.id); setCreating(false); setError(""); }} style={{ cursor: "pointer", background: selectedBird?.id === bird.id ? "#f2fbf7" : undefined }}>
                    <td><strong>{bird.name}</strong></td>
                    <td>{bird.species?.common_name || "—"}<small style={{ display: "block" }}>{bird.species?.scientific_name || ""}</small></td>
                    <td>{bird.sex || "—"}</td>
                    <td>{ageFromBirth(bird.birth_date)}</td>
                    <td>{bird.ring_number || "—"}</td>
                    <td><span className="badge">{bird.status || "—"}</span></td>
                    <td><button type="button" className="btn btn-soft" onClick={(e) => { e.stopPropagation(); setSelectedBirdId(bird.id); setCreating(false); }}>Abrir ave</button></td>
                  </tr>
                ))}
                {!creatorBirds.length && <tr><td colSpan={7}><div className="empty">Este criador ainda não possui aves cadastradas.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedBird && selectedCreator && (
        <section className="section-card" style={{ marginTop: 18 }}>
          <div className="section-heading">
            <div>
              <span className="kicker">Painel da ave</span>
              <h2>{selectedBird.name}</h2>
              <p>{selectedBird.species?.common_name || "Espécie não informada"} · Anilha {selectedBird.ring_number || "não informada"}</p>
              <p><b>Criador:</b> {selectedCreator.criatorio_name || selectedCreator.full_name} · <b>CPF:</b> {formatCpf(selectedCreator.cpf)}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => { setCreating(true); setError(""); setCreated(""); }}>+ Registrar consulta</button>
          </div>

          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="stat"><small>Data de nascimento</small><strong>{formatDate(selectedBird.birth_date)}</strong></div>
            <div className="stat"><small>Idade</small><strong>{ageFromBirth(selectedBird.birth_date)}</strong></div>
            <div className="stat"><small>Sexo</small><strong>{selectedBird.sex || "—"}</strong></div>
            <div className="stat"><small>Registro</small><strong>{selectedBird.ibama_registration_number || "—"}</strong></div>
          </div>

          {created && <div className="success" style={{ marginTop: 14 }}>{created}</div>}
          {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

          {creating && (
            <form className="form-card" onSubmit={createConsultation} style={{ marginTop: 16 }}>
              <div className="member-note">
                <strong>🩺 Nova consulta de {selectedBird.name}</strong>
                <span>Prontuário e receita são armazenados como PDFs privados e aparecem no histórico desta ave para o criador e o veterinário.</span>
              </div>
              <div className="form-grid">
                <div className="field"><label>Data da consulta *</label><input type="date" name="consultation_date" defaultValue={new Date().toISOString().slice(0, 10)} required /></div>
                <div className="field"><label>Modalidade</label><select name="modality" defaultValue="a_combinar"><option value="presencial">Presencial</option><option value="online">Online</option><option value="a_combinar">A combinar</option></select></div>
                <div className="field full"><label>Descrição do atendimento</label><textarea name="description" rows={4} placeholder="O que foi consultado, avaliação e orientações." /></div>
                <div className="field full"><label>Observações do veterinário</label><textarea name="vet_notes" rows={4} placeholder="Observações profissionais para o histórico." /></div>
                <div className="field"><label>Prontuário do paciente — PDF *</label><input type="file" name="record_pdf" accept="application/pdf,.pdf" required /></div>
                <div className="field"><label>Receita — PDF *</label><input type="file" name="prescription_pdf" accept="application/pdf,.pdf" required /></div>
              </div>
              <div className="form-actions"><button type="button" className="btn btn-soft" onClick={() => setCreating(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Arquivando..." : "Salvar consulta + PDFs"}</button></div>
            </form>
          )}

          <div className="section-heading" style={{ marginTop: 26 }}><div><h3>Histórico veterinário</h3><p>Todos os registros, prontuários e receitas desta ave.</p></div></div>
          <div className="record-list">
            {selectedConsultations.map((consultation) => (
              <article className="record" key={consultation.id}>
                <div style={{ width: "100%" }}>
                  <strong>{formatDate(consultation.consultation_date)} · {consultation.included_in_lenda ? "Consulta inclusa Lenda" : "Consulta particular"}</strong>
                  <small>Status: {consultation.status} · {consultation.modality || "a combinar"}</small>
                  {consultation.description && <p><b>Descrição:</b> {consultation.description}</p>}
                  {consultation.vet_notes && <p><b>Observações:</b> {consultation.vet_notes}</p>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {consultation.record_pdf_path ? <a className="btn btn-soft" href={`/api/vet/document?consulta=${consultation.id}&tipo=prontuario`} target="_blank" rel="noreferrer">📄 Baixar prontuário</a> : <span className="btn btn-ghost" style={{ opacity: .65 }}>Prontuário pendente</span>}
                    {consultation.prescription_pdf_path ? <a className="btn btn-soft" href={`/api/vet/document?consulta=${consultation.id}&tipo=receita`} target="_blank" rel="noreferrer">💊 Baixar receita</a> : <span className="btn btn-ghost" style={{ opacity: .65 }}>Receita pendente</span>}
                  </div>
                  {consultation.status !== "completed" && consultation.status !== "cancelled" && <div style={{ marginTop: 14 }}><VetConsultationManager consultation={consultation} /></div>}
                </div>
              </article>
            ))}
            {!selectedConsultations.length && <div className="empty">Nenhuma consulta registrada para esta ave.</div>}
          </div>
        </section>
      )}
    </>
  );
}
