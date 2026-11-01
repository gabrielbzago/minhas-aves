"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlySupabaseError } from "@/lib/error-messages";

type Ring = {
  id: string; ring_number: string; sex: string; status: string; species_id: string | null;
  species?: { common_name?: string | null } | null;
  mother_id?: string | null; father_id?: string | null;
  mother?: { id?: string; name?: string | null; ring_number?: string | null } | null;
  father?: { id?: string; name?: string | null; ring_number?: string | null } | null;
  applied_bird?: { id?: string; name?: string | null; birth_date?: string | null; sex?: string | null } | null;
};

export default function SexagemManager({ birds = [] }: { birds: any[] }) {
  const client = createClient();
  const [rings, setRings] = useState<Ring[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { name: string; birth_date: string; father_id: string; mother_id: string }>>({});
  const [sexDrafts, setSexDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true); setError("");
    const { data, error } = await client.from("ring_inventory")
      .select("*,species:species_id(common_name,scientific_name),father:father_id(id,name,ring_number),mother:mother_id(id,name,ring_number),applied_bird:applied_to_bird_id(id,name,birth_date,sex)")
      .eq("sex", "indeterminado").order("created_at", { ascending: false });
    if (error) setError(friendlySupabaseError(error, "Não foi possível carregar as anilhas com sexo indefinido."));
    else setRings((data || []) as Ring[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  const setDraft = (id: string, key: string, value: string) => setDrafts(current => {
    const ring = rings.find(r => r.id === id);
    const previous = current[id];
    const next = {
      ...(previous ?? {
        name: `Filhote ${ring?.ring_number || ""}`,
        birth_date: "",
        father_id: ring?.father_id ?? "",
        mother_id: ring?.mother_id ?? "",
      }),
      [key]: value,
    };
    return { ...current, [id]: next };
  });
  const undefinedRings = rings;
  const available = undefinedRings.filter(r => r.status === "disponivel");
  const born = undefinedRings.filter(r => r.status === "aplicada");

  const matrixSummary = useMemo(() => {
    const map = new Map<string, { key: string; name: string; ring: string; count: number; available: number; applied: number }>();
    undefinedRings.forEach(r => {
      const key = r.mother_id || "no-mother";
      if (!map.has(key)) map.set(key, { key, name: r.mother?.name || "Matriz não vinculada", ring: r.mother?.ring_number || "", count: 0, available: 0, applied: 0 });
      const group = map.get(key)!; group.count++;
      if (r.status === "disponivel") group.available++;
      if (r.status === "aplicada") group.applied++;
    });
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));
  }, [undefinedRings]);
  const maxCount = Math.max(1, ...matrixSummary.map(x => x.count));

  async function saveSexResult(ring: Ring) {
    const sex = sexDrafts[ring.id];
    if (!sex || !["macho", "femea"].includes(sex)) { setError("Selecione o resultado da sexagem."); return; }
    setBusyId(ring.id); setError(""); setSuccess("");
    const { error } = await client.rpc("update_ring_sex", { p_ring_id: ring.id, p_sex: sex });
    if (error) setError(friendlySupabaseError(error, "Não foi possível registrar o resultado da sexagem."));
    else { setSuccess(`Sexagem registrada: ${ring.applied_bird?.name || ring.ring_number} identificado(a) como ${sex === "macho" ? "macho" : "fêmea"}.`); setSexDrafts(current => { const next = { ...current }; delete next[ring.id]; return next; }); await load(); }
    setBusyId("");
  }

  async function declareBirth(ring: Ring) {
    const draft = drafts[ring.id] || { name: `Filhote ${ring.ring_number}`, birth_date: "", father_id: ring.father_id || "", mother_id: ring.mother_id || "" };
    if (!draft.name.trim()) { setError(`Informe o nome do filhote da anilha ${ring.ring_number}.`); return; }
    if (!draft.birth_date) { setError(`Informe a data de nascimento do filhote ${ring.ring_number}.`); return; }
    if (!draft.father_id || !draft.mother_id) { setError(`Vincule o pai e a mãe do filhote ${ring.ring_number}.`); return; }
    if (draft.father_id === draft.mother_id) { setError("Pai e mãe não podem ser a mesma ave."); return; }
    const father = birds.find(b => b.id === draft.father_id);
    const mother = birds.find(b => b.id === draft.mother_id);
    if (!father || father.sex !== "macho") { setError("O pai selecionado precisa estar cadastrado como macho."); return; }
    if (!mother || mother.sex !== "femea") { setError("A mãe selecionada precisa estar cadastrada como fêmea."); return; }
    if (ring.species_id && (father.species_id !== ring.species_id || mother.species_id !== ring.species_id)) {
      setError("A espécie do pai e da mãe deve corresponder à espécie desta anilha."); return;
    }
    setBusyId(ring.id); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/birds", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(), species_id: ring.species_id || mother.species_id || null,
          sex: "indeterminado", status: "ativo", birth_date: draft.birth_date,
          father_id: draft.father_id, mother_id: draft.mother_id,
          ring_inventory_id: ring.id,
          notes: "Nascimento registrado pela Gestão de Sexagem."
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Não foi possível registrar o nascimento (HTTP ${response.status}).`);
      setSuccess(`Nascimento de ${draft.name.trim()} registrado. Anilha ${ring.ring_number} aplicada e sexo mantido indefinido.`);
      setDrafts(current => { const next = { ...current }; delete next[ring.id]; return next; });
      await load();
    } catch (e: any) { setError(e?.message || "Falha ao registrar o nascimento."); }
    finally { setBusyId(""); }
  }

  return <div className="module-manager" style={{ display: "grid", gap: 18 }}>
    <div className="stat-grid">
      <div className="stat"><small>Anilhas com sexo indefinido</small><strong>{undefinedRings.length}</strong></div>
      <div className="stat"><small>Disponíveis para nascimento</small><strong>{available.length}</strong></div>
      <div className="stat"><small>Aplicadas em filhotes</small><strong>{born.length}</strong></div>
    </div>

    <section className="form-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div><h3 style={{ marginBottom: 4 }}>Estoque de anilhas por matriz</h3><p style={{ margin: 0 }}>Quantidade de anilhas com sexo indefinido vinculadas a cada matriz, separadas entre disponíveis e já aplicadas.</p></div>
        <span className="badge">{undefinedRings.length} anilha(s)</span>
      </div>
      {loading ? <div className="empty">Carregando gráfico...</div> : matrixSummary.length === 0 ? <div className="empty">Não há anilhas com sexo indefinido.</div> : <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
        {matrixSummary.map(group => <div key={group.key} style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><strong>{group.name}{group.ring ? ` · ${group.ring}` : ""}</strong><strong>{group.count}</strong></div>
          <div title={`${group.available} disponíveis; ${group.applied} aplicadas`} style={{ height: 16, display: "flex", overflow: "hidden", borderRadius: 99, background: "var(--surface-secondary,#edf1ee)" }}>
            {group.available > 0 && <div style={{ width: `${group.available / maxCount * 100}%`, background: "#2f9b70" }} />}
            {group.applied > 0 && <div style={{ width: `${group.applied / maxCount * 100}%`, background: "#e8bd32" }} />}
          </div>
          <small style={{ color: "var(--muted,#64748b)" }}>{group.available} disponíveis · {group.applied} aplicadas</small>
        </div>)}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}><span>🟢 Disponíveis</span><span>🟡 Aplicadas</span></div>
      </div>}
    </section>

    {error && <div className="alert alert-error" role="alert">{error}</div>}
    {success && <div className="alert alert-success" role="status">✓ {success}</div>}

    <section className="form-card">
      <h3>Declarar nascimento</h3>
      <p>Selecione uma anilha disponível com sexo indefinido, informe o nascimento e vincule o pai e a mãe. O Apollo cria a ficha do filhote, aplica a anilha e mantém o sexo indefinido até a sexagem.</p>
      {loading ? <div className="empty">Carregando anilhas...</div> : available.length === 0 ? <div className="empty">Não há anilhas disponíveis com sexo indefinido para registrar nascimento.</div> : <div style={{ display: "grid", gap: 16 }}>
        {available.map(ring => {
          const draft = drafts[ring.id] || { name: `Filhote ${ring.ring_number}`, birth_date: "", father_id: ring.father_id || "", mother_id: ring.mother_id || "" };
          const fathers = birds.filter(b => b.sex === "macho" && (!ring.species_id || b.species_id === ring.species_id));
          const mothers = birds.filter(b => b.sex === "femea" && (!ring.species_id || b.species_id === ring.species_id));
          return <article key={ring.id} style={{ border: "1px solid var(--border,#e5e7eb)", borderRadius: 12, padding: 14, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><strong>{ring.ring_number}</strong><span className="badge">Disponível · Sexo indefinido</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
              <div className="field"><label>Espécie</label><input value={ring.species?.common_name || "Espécie não informada"} readOnly /></div>
              <div className="field"><label>Nome do filhote</label><input value={draft.name} onChange={e => setDraft(ring.id, "name", e.target.value)} /></div>
              <div className="field"><label>Data de nascimento</label><input type="date" value={draft.birth_date} max={new Date().toISOString().slice(0, 10)} onChange={e => setDraft(ring.id, "birth_date", e.target.value)} /></div>
              <div className="field"><label>Pai</label><select value={draft.father_id} onChange={e => setDraft(ring.id, "father_id", e.target.value)}><option value="">Selecione o pai</option>{fathers.map((b:any) => <option key={b.id} value={b.id}>{b.name} · {b.ring_number || "sem anilha"}</option>)}</select></div>
              <div className="field"><label>Mãe</label><select value={draft.mother_id} onChange={e => setDraft(ring.id, "mother_id", e.target.value)}><option value="">Selecione a mãe</option>{mothers.map((b:any) => <option key={b.id} value={b.id}>{b.name} · {b.ring_number || "sem anilha"}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}><small>O filhote será cadastrado com sexo indefinido.</small><button className="btn btn-primary" type="button" disabled={!!busyId} onClick={() => void declareBirth(ring)}>{busyId === ring.id ? "Salvando nascimento..." : "Registrar nascimento e aplicar anilha"}</button></div>
          </article>;
        })}
      </div>}
    </section>

    <section className="form-card">
      <h3>Anilhas indefinidas já aplicadas</h3>
      {born.length === 0 ? <div className="empty">Nenhuma anilha indefinida foi aplicada a um filhote ainda.</div> : <div style={{ display: "grid", gap: 10 }}>{born.map(r => <div key={r.id} style={{ border: "1px solid var(--border,#e5e7eb)", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><strong>{r.ring_number}</strong><div>{r.applied_bird?.name || "Filhote"} · {r.species?.common_name || "Espécie não informada"}</div><small>{r.applied_bird?.birth_date ? `Nascimento: ${r.applied_bird.birth_date}` : "Data de nascimento não informada"}</small></div><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><select aria-label={`Resultado da sexagem ${r.ring_number}`} value={sexDrafts[r.id] || ""} onChange={e => setSexDrafts(current => ({ ...current, [r.id]: e.target.value }))}><option value="">Resultado da sexagem</option><option value="macho">Macho</option><option value="femea">Fêmea</option></select><button className="btn btn-primary" type="button" disabled={!!busyId || !sexDrafts[r.id]} onClick={() => void saveSexResult(r)}>{busyId === r.id ? "Salvando..." : "Registrar sexo"}</button></div></div>)}</div>}
    </section>
  </div>;
}
