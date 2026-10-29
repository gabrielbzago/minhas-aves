"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BirdForm({ species, birds, initialBird }: { species: any[]; birds: any[]; initialBird?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ringChecking, setRingChecking] = useState(false);
  const [f, setF] = useState<any>(initialBird
    ? {
        ...initialBird,
        genetics: initialBird.genetics ? Object.entries(initialBird.genetics).map(([a, b]) => `${a}:${b}`).join(",") : "",
        species_id: initialBird.species_id || "",
        father_id: initialBird.father_id || "",
        mother_id: initialBird.mother_id || "",
      }
    : {
        name: "", species_id: "", sex: "indeterminado", birth_date: "", death_date: "", transfer_date: "",
        status: "ativo", ring_number: "", ibama_registration_number: "", ibama_record_type: "",
        father_id: "", mother_id: "", genetic_line: "", genetics: "", breeder_matrix: false, notes: "",
      });

  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  async function checkRingAvailability(value: string) {
    const ring = String(value || "").trim();
    if (!ring) { setError(""); return true; }
    setRingChecking(true);
    try {
      const response = await fetch(`/api/birds?ring=${encodeURIComponent(ring)}${initialBird ? `&exclude=${encodeURIComponent(initialBird.id)}` : ""}`, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.available === false) {
        setError(result.error || "Este número de anilha já está cadastrado no sistema. Cada anilha é única e não pode ser reutilizada.");
        return false;
      }
      if (error.includes("número de anilha")) setError("");
      return true;
    } catch {
      // A restrição definitiva está no banco; não bloqueamos o cadastro por uma falha de consulta.
      return true;
    } finally { setRingChecking(false); }
  }

  function validate() {
    if (!String(f.name || "").trim()) return "O campo Nome da ave é obrigatório.";
    if (!f.species_id) return "Selecione a espécie da ave.";
    if (!f.sex) return "Informe o sexo/sexagem da ave.";

    const today = new Date().toISOString().slice(0, 10);
    if (f.birth_date && f.birth_date > today) return "A data de nascimento não pode ser futura.";
    if (f.death_date && f.birth_date && f.death_date < f.birth_date) return "A data de falecimento não pode ser anterior ao nascimento.";
    if (f.transfer_date && f.birth_date && f.transfer_date < f.birth_date) return "A data de transferência não pode ser anterior ao nascimento.";
    if (f.status === "falecido" && !f.death_date) return "Informe a data de falecimento quando o status for Falecido.";
    if (f.status === "transferido" && !f.transfer_date) return "Informe a data de transferência quando o status for Transferido.";
    if (f.father_id && f.mother_id && f.father_id === f.mother_id) return "Pai e mãe não podem ser a mesma ave.";
    if (initialBird && f.father_id === initialBird.id) return "A ave não pode ser pai dela mesma.";
    if (initialBird && f.mother_id === initialBird.id) return "A ave não pode ser mãe dela mesma.";
    return "";
  }

  function normalizeGenetics(value: any) {
    if (!value || !String(value).trim()) return {};
    return Object.fromEntries(
      String(value).split(",").map((x: string) => {
        const [a, ...rest] = x.split(":");
        return [a?.trim(), rest.join(":")?.trim()];
      }).filter(([a, b]) => a && b)
    );
  }

  async function submit(e: any) {
    e.preventDefault();
    setError("");
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    if (f.ring_number?.trim()) {
      const ringOk = await checkRingAvailability(f.ring_number);
      if (!ringOk) { setLoading(false); return; }
    }

    const payload: any = {
      name: String(f.name).trim(),
      species_id: f.species_id || null,
      sex: f.sex || "indeterminado",
      status: f.status || "ativo",
      birth_date: f.birth_date || null,
      death_date: f.death_date || null,
      transfer_date: f.transfer_date || null,
      ring_number: f.ring_number?.trim() || null,
      ibama_registration_number: f.ibama_registration_number?.trim() || null,
      ibama_record_type: f.ibama_record_type?.trim() || null,
      father_id: f.father_id || null,
      mother_id: f.mother_id || null,
      genetic_line: f.genetic_line?.trim() || null,
      genetics: normalizeGenetics(f.genetics),
      breeder_matrix: !!f.breeder_matrix,
      notes: f.notes?.trim() || null,
    };

    try {
      const response = await fetch("/api/birds", {
        method: initialBird ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialBird ? { ...payload, id: initialBird.id } : payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Não foi possível salvar a ave. Verifique os dados e tente novamente.");
        setLoading(false);
        return;
      }
      router.push(initialBird ? `/dashboard/plantel/${initialBird.id}` : "/dashboard/plantel");
      router.refresh();
    } catch (err) {
      console.error("[Minhas Aves] erro de comunicação ao salvar ave", err);
      setError("Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return <form className="form-card" onSubmit={submit}>
    {error && <div className="error" role="alert">{error}</div>}
    <div className="form-grid">
      <div className="field"><label>Nome da ave *</label><input required value={f.name} onChange={e => set("name", e.target.value)} placeholder="Ex.: Thor" /></div>
      <div className="field"><label>Espécie *</label><select required value={f.species_id} onChange={e => set("species_id", e.target.value)}><option value="">Selecione...</option>{species.map(s => <option key={s.id} value={s.id}>{s.common_name} — {s.scientific_name}</option>)}</select></div>
      <div className="field"><label>Sexagem / sexo *</label><select required value={f.sex} onChange={e => set("sex", e.target.value)}><option value="macho">Macho</option><option value="femea">Fêmea</option><option value="indeterminado">Indeterminado</option></select></div>
      <div className="field"><label>Status</label><select value={f.status} onChange={e => set("status", e.target.value)}><option value="ativo">Ativo</option><option value="falecido">Falecido</option><option value="transferido">Transferido</option><option value="arquivado">Arquivado</option></select></div>
      <div className="field"><label>Data de nascimento</label><input type="date" value={f.birth_date || ""} onChange={e => set("birth_date", e.target.value)} /></div>
      <div className="field"><label>Data de falecimento</label><input type="date" value={f.death_date || ""} onChange={e => set("death_date", e.target.value)} /></div>
      <div className="field"><label>Data de transferência</label><input type="date" value={f.transfer_date || ""} onChange={e => set("transfer_date", e.target.value)} /></div>
      <div className="field"><label>Número da anilha</label><input value={f.ring_number || ""} onChange={e => set("ring_number", e.target.value)} onBlur={e => { if (e.target.value.trim()) void checkRingAvailability(e.target.value); }} placeholder="Número / identificação" /><small style={{color:"var(--muted)"}}>A anilha é única no sistema e não pode ser reutilizada.</small></div>
      <div className="field"><label>Registro regulatório (informado pelo criador)</label><input value={f.ibama_registration_number || ""} onChange={e => set("ibama_registration_number", e.target.value)} placeholder="Preencha conforme seu documento" /></div>
      <div className="field"><label>Tipo do registro</label><input value={f.ibama_record_type || ""} onChange={e => set("ibama_record_type", e.target.value)} placeholder="Ex.: registro, licença, origem" /></div>
      <div className="field"><label>Pai</label><select value={f.father_id || ""} onChange={e => set("father_id", e.target.value)}><option value="">Não informado</option>{birds.filter(b => b.sex === "macho").map(b => <option key={b.id} value={b.id}>{b.name} — {b.ring_number || "sem anilha"}</option>)}</select></div>
      <div className="field"><label>Mãe</label><select value={f.mother_id || ""} onChange={e => set("mother_id", e.target.value)}><option value="">Não informado</option>{birds.filter(b => b.sex === "femea").map(b => <option key={b.id} value={b.id}>{b.name} — {b.ring_number || "sem anilha"}</option>)}</select></div>
      <div className="field"><label>Linhagem / genética</label><input value={f.genetic_line || ""} onChange={e => set("genetic_line", e.target.value)} placeholder="Ex.: linha X, mutação Y" /></div>
      <div className="field"><label>Genotipagem / genética detalhada</label><input value={f.genetics || ""} onChange={e => set("genetics", e.target.value)} placeholder="Ex.: mutação:opalino, portador:ino" /></div>
      <div className="field full"><label><input type="checkbox" checked={!!f.breeder_matrix} onChange={e => set("breeder_matrix", e.target.checked)} style={{ width: "auto", marginRight: 8 }} /> Marcar como matriz principal do criatório</label></div>
      <div className="field full"><label>Observações</label><textarea rows={5} value={f.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Informações adicionais, origem, características, histórico..." /></div>
    </div>
    <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button><button className="btn btn-primary" disabled={loading}>{loading || ringChecking ? "Verificando..." : (initialBird ? "Salvar alterações" : "Salvar ave")}</button></div>
  </form>;
}
