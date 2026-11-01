"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CONVERSION_COPY } from "@/lib/conversion";

export default function BirdForm({ species, birds, initialBird, canUseAi = false, isFreePlan = false }: { species: any[]; birds: any[]; initialBird?: any; canUseAi?: boolean; isFreePlan?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ringChecking, setRingChecking] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiScanError, setAiScanError] = useState("");
  const [aiScanInfo, setAiScanInfo] = useState("");
  const [aiUsage, setAiUsage] = useState<{used:number;limit:number} | null>(null);
  const [showAiUpgrade, setShowAiUpgrade] = useState(false);
  const [aiFileInputKey, setAiFileInputKey] = useState(0);
  const [frontLabelPhoto, setFrontLabelPhoto] = useState<File | null>(null);
  const [backLabelPhoto, setBackLabelPhoto] = useState<File | null>(null);
  const [backFileInputKey, setBackFileInputKey] = useState(0);
  const [aiGenealogyScanning, setAiGenealogyScanning] = useState(false);
  const [aiGenealogyError, setAiGenealogyError] = useState("");
  const [aiGenealogyInfo, setAiGenealogyInfo] = useState("");
  const [aiGenealogyFileInputKey, setAiGenealogyFileInputKey] = useState(0);
  const [stockRings, setStockRings] = useState<any[]>([]);
  const [stockRingId, setStockRingId] = useState("");
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
        father_id: "", mother_id: "", genetic_line: "", genetics: "", mutation_type: "", breeder_matrix: false, notes: "",
      });

  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  useEffect(() => { if (!initialBird) fetch("/api/rings?status=disponivel").then(r=>r.ok?r.json():{data:[]}).then(x=>setStockRings(x.data||[])).catch(()=>setStockRings([])); }, [initialBird]);

  async function prepareLabelPhoto(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use imagens JPG, PNG ou WEBP.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Cada foto deve ter no máximo 8 MB.");
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); throw new Error("Não foi possível preparar a imagem."); }
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const compressed = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Falha ao otimizar a imagem.")), "image/jpeg", 0.84));
    if (compressed.size > 3 * 1024 * 1024) throw new Error("Uma das fotos continua muito pesada. Tente uma imagem com menor resolução.");
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Não foi possível ler a imagem."));
      reader.onerror = () => reject(new Error("Falha ao abrir a imagem."));
      reader.readAsDataURL(compressed);
    });
  }

  async function scanBirdLabel() {
    setAiScanError(""); setAiScanInfo("");
    const selectedPhotos = [frontLabelPhoto, ...(isFreePlan ? [] : [backLabelPhoto])].filter(Boolean) as File[];
    if (!selectedPhotos.length) { setAiScanError("Fotografe ou selecione pelo menos a frente da plaquinha."); return; }
    setAiScanning(true);
    try {
      const images = await Promise.all(selectedPhotos.map(async file => ({ image: await prepareLabelPhoto(file), mimeType: "image/jpeg" })));
      const response = await fetch("/api/ai/parse-bird-label", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível analisar a plaquinha.");
      const data = result.data || {};
      if (result.usage) setAiUsage(result.usage);
      setF((current: any) => ({
        ...current,
        name: data.name || current.name,
        species_id: data.species_id || current.species_id,
        sex: data.sex || current.sex,
        birth_date: data.birth_date || current.birth_date,
        ring_number: data.ring_number || current.ring_number,
        ibama_registration_number: data.ibama_registration_number || current.ibama_registration_number,
        ibama_record_type: data.ibama_record_type || current.ibama_record_type,
        genetic_line: data.genetic_line || current.genetic_line,
        mutation_type: data.mutation_type || current.mutation_type,
        notes: data.notes || current.notes,
        genetics: data.genetics && Object.keys(data.genetics).length ? Object.entries(data.genetics).map(([a,b])=>`${a}:${b}`).join(",") : current.genetics,
      }));
      const found = [data.name, data.species_id && "espécie", data.birth_date && "nascimento", data.ring_number && "anilha", data.sex && data.sex !== "indeterminado" && "sexo"].filter(Boolean).length;
      setAiScanInfo(`Leitura concluída com ${selectedPhotos.length} ${selectedPhotos.length === 1 ? "foto" : "fotos"}: ${found} informações identificadas. Confira todos os campos antes de salvar.${result.usage ? ` Uso mensal: ${result.usage.used}/${result.usage.limit}.` : ""}`);
    } catch (error: any) {
      const message = error?.message || "Não foi possível analisar a imagem.";
      setAiScanError(message);
      if (/upgrade|análise gratuita|limite|plano Grátis|genealogia por foto|frente e verso/i.test(message)) setShowAiUpgrade(true);
    } finally { setAiScanning(false); }
  }

    async function scanGenealogyPhoto(file?: File) {
    setAiGenealogyError(""); setAiGenealogyInfo("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setAiGenealogyError("Use uma imagem JPG, PNG ou WEBP."); return; }
    if (file.size > 8 * 1024 * 1024) { setAiGenealogyError("A imagem deve ter no máximo 8 MB."); return; }
    setAiGenealogyScanning(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { bitmap.close(); throw new Error("Não foi possível preparar a imagem."); }
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const compressed = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Falha ao otimizar a imagem.")), "image/jpeg", 0.84));
      if (compressed.size > 3 * 1024 * 1024) throw new Error("A imagem continua muito pesada. Tente uma foto com menor resolução.");
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Não foi possível ler a imagem."));
        reader.onerror = () => reject(new Error("Falha ao abrir a imagem."));
        reader.readAsDataURL(compressed);
      });
      const response = await fetch("/api/ai/parse-bird-label", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, mimeType: "image/jpeg", mode: "genealogy" }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível analisar a genealogia.");
      const data = result.data || {};
      if (result.usage) setAiUsage(result.usage);
      setF((current: any) => ({ ...current, father_id: data.father_id || "", mother_id: data.mother_id || "" }));
      const describe = (label: string, item: any) => {
        if (item?.status === "vinculado") return `${label}: ${item.name} vinculado`;
        if (item?.status === "ambiguo") return `${label}: ${item.name || item.ring_number || "identificação"} — mais de uma ave corresponde; selecione manualmente`;
        if (item?.status === "nao_cadastrado") return `${label}: ${item.name || item.ring_number || "identificado"}, mas não cadastrado no plantel`;
        return `${label}: não identificado na foto`;
      };
      setAiGenealogyInfo(`${describe("Pai", data.father)}. ${describe("Mãe", data.mother)}. Confira os vínculos antes de salvar.${result.usage ? ` Uso mensal: ${result.usage.used}/${result.usage.limit}.` : ""}`);
    } catch (error: any) {
      setAiGenealogyError(error?.message || "Não foi possível analisar a genealogia.");
    } finally { setAiGenealogyScanning(false); setAiGenealogyFileInputKey((x: number) => x + 1); }
  }

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
    if (f.ring_number?.trim() && !stockRingId) {
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
      ring_number: stockRingId ? null : (f.ring_number?.trim() || null),
      ring_inventory_id: stockRingId || null,
      ibama_registration_number: f.ibama_registration_number?.trim() || null,
      ibama_record_type: f.ibama_record_type?.trim() || null,
      father_id: f.father_id || null,
      mother_id: f.mother_id || null,
      genetic_line: f.genetic_line?.trim() || null,
      genetics: normalizeGenetics(f.genetics),
      mutation_type: f.mutation_type || null,
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
    {!initialBird && (canUseAi ? <section style={{border:"1px solid var(--line)",borderRadius:14,padding:16,marginBottom:18,background:"linear-gradient(135deg,#f3fbf7,#fff)"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div><strong style={{display:"block",fontSize:15}}>✨ Cadastro Inteligente por Foto</strong><small style={{color:"var(--muted)"}}>{isFreePlan ? "Experimente a leitura automática da plaquinha com uma foto gratuita por mês." : "Fotografe a frente e, se necessário, o verso da plaquinha. A IA combina as duas fotos antes de preencher os dados."}</small></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <label className="btn btn-soft" style={{cursor:aiScanning?"wait":"pointer",margin:0,opacity:aiScanning ? 0.65 : 1}}>📷 Foto da frente<input key={aiFileInputKey} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={aiScanning || aiGenealogyScanning} onChange={e=>setFrontLabelPhoto(e.target.files?.[0] || null)} style={{display:"none"}}/></label>
          {!isFreePlan && <label className="btn btn-soft" style={{cursor:aiScanning?"wait":"pointer",margin:0,opacity:aiScanning ? 0.65 : 1}}>＋ Foto do verso (opcional)<input key={backFileInputKey} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={aiScanning || aiGenealogyScanning} onChange={e=>setBackLabelPhoto(e.target.files?.[0] || null)} style={{display:"none"}}/></label>}
          <button type="button" className="btn btn-primary" disabled={aiScanning || aiGenealogyScanning || !frontLabelPhoto} onClick={()=>void scanBirdLabel()}>{aiScanning?"Analisando fotos...":"✨ Analisar fotos"}</button>
          {!isFreePlan && <label className="btn btn-soft" style={{cursor:aiGenealogyScanning?"wait":"pointer",margin:0,opacity:aiGenealogyScanning ? 0.65 : 1}}>{aiGenealogyScanning?"Lendo árvore...":"🌳 Genealogia por foto"}<input key={aiGenealogyFileInputKey} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={aiScanning || aiGenealogyScanning} onChange={e=>void scanGenealogyPhoto(e.target.files?.[0])} style={{display:"none"}}/></label>}
        </div>
      </div>
      {aiScanError&&<p className="error" role="alert" style={{margin:"10px 0 0"}}>{aiScanError}</p>}
      {aiScanInfo&&<p style={{margin:"10px 0 0",fontSize:12,color:"var(--primary-dark)",fontWeight:700}}>{aiScanInfo}</p>}
      {isFreePlan && aiUsage && <p style={{margin:"8px 0 0",fontSize:12,color:"var(--muted)"}}>Sua experiência gratuita: {aiUsage.used}/{aiUsage.limit} análise utilizada neste mês.</p>}
      {showAiUpgrade && <div style={{marginTop:12,padding:14,borderRadius:12,background:"#f0f7ff",border:"1px solid #cfe3ff"}}><strong>🚀 {CONVERSION_COPY.aiLimit.title}</strong><p style={{fontSize:12,margin:"6px 0 10px",color:"var(--muted)"}}>{CONVERSION_COPY.aiLimit.description}</p><a className="btn btn-primary" href="/dashboard/assinatura">{CONVERSION_COPY.aiLimit.cta}</a></div>}
      {aiGenealogyError&&<p className="error" role="alert" style={{margin:"10px 0 0"}}>{aiGenealogyError}</p>}
      {aiGenealogyInfo&&<p style={{margin:"10px 0 0",fontSize:12,color:"var(--primary-dark)",fontWeight:700}}>{aiGenealogyInfo}</p>}
      {(frontLabelPhoto || backLabelPhoto) && <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8,fontSize:11,color:"var(--muted)"}}>
        {frontLabelPhoto && <span>Frente: {frontLabelPhoto.name}</span>}
        {backLabelPhoto && <span>Verso: {backLabelPhoto.name} <button type="button" className="btn btn-ghost" style={{padding:"2px 6px",fontSize:10}} onClick={()=>{setBackLabelPhoto(null);setBackFileInputKey(x=>x+1);}}>Remover verso</button></span>}
      </div>}
      <small style={{display:"block",marginTop:8,color:"var(--muted)"}}>{isFreePlan ? "Experimente gratuitamente: 1 análise de plaquinha por mês, com uma foto da frente. Para analisar mais fotos, usar o verso ou identificar a genealogia automaticamente, conheça os planos pagos." : "Disponível nos planos Profissional e Lenda. JPG, PNG ou WEBP; a imagem é otimizada automaticamente antes do envio. Adicione a foto do verso se houver mais informações. Depois clique em Analisar fotos e confira os campos antes de salvar."}</small>
    </section> : <section style={{border:"1px solid var(--line)",borderRadius:14,padding:16,marginBottom:18,background:"#f8fafc"}}><strong>✨ Cadastro Inteligente por Foto</strong><p style={{fontSize:12,color:"var(--muted)",margin:"6px 0 10px"}}>Economize tempo: fotografe a plaquinha e a IA preenche os dados da ave automaticamente. Recurso disponível nos planos Profissional e Lenda.</p><a className="btn btn-soft" href="/dashboard/assinatura">Conhecer planos</a></section>)}
    <div className="form-grid">
      <div className="field"><label>Nome da ave *</label><input required value={f.name} onChange={e => set("name", e.target.value)} placeholder="Ex.: Thor" /></div>
      <div className="field"><label>Espécie *</label><select required value={f.species_id} onChange={e => { set("species_id", e.target.value); setStockRingId(""); }}><option value="">Selecione...</option>{species.map(s => <option key={s.id} value={s.id}>{s.common_name} — {s.scientific_name}</option>)}</select></div>
      <div className="field"><label>Sexagem / sexo *</label><select required value={f.sex} onChange={e => set("sex", e.target.value)}><option value="macho">Macho</option><option value="femea">Fêmea</option><option value="indeterminado">Indeterminado</option></select></div>
      <div className="field"><label>Status</label><select value={f.status} onChange={e => set("status", e.target.value)}><option value="ativo">Ativo</option><option value="falecido">Falecido</option><option value="transferido">Transferido</option><option value="arquivado">Arquivado</option></select></div>
      <div className="field"><label>Data de nascimento</label><input type="date" value={f.birth_date || ""} onChange={e => set("birth_date", e.target.value)} /></div>
      <div className="field"><label>Data de falecimento</label><input type="date" value={f.death_date || ""} onChange={e => set("death_date", e.target.value)} /></div>
      <div className="field"><label>Data de transferência</label><input type="date" value={f.transfer_date || ""} onChange={e => set("transfer_date", e.target.value)} /></div>
      <div className="field"><label>Aplicar anilha do estoque (opcional)</label><select value={stockRingId} onChange={e=>{setStockRingId(e.target.value);if(e.target.value)set("ring_number","");}}><option value="">Não selecionar agora</option>{stockRings.filter(r=>!f.species_id||r.species_id===f.species_id).map(r=><option key={r.id} value={r.id}>{r.ring_number} · {r.species?.common_name||"Espécie"}</option>)}</select><small style={{color:"var(--muted)"}}>Ao salvar o filhote, a anilha será baixada automaticamente do estoque.</small></div><div className="field"><label>Número da anilha (manual)</label><input value={f.ring_number || ""} onChange={e => { setStockRingId(""); set("ring_number", e.target.value); }} onBlur={e => { if (e.target.value.trim()) void checkRingAvailability(e.target.value); }} placeholder="Número / identificação" /><small style={{color:"var(--muted)"}}>A anilha é única no sistema e não pode ser reutilizada.</small></div>
      <div className="field"><label>Registro regulatório (informado pelo criador)</label><input value={f.ibama_registration_number || ""} onChange={e => set("ibama_registration_number", e.target.value)} placeholder="Preencha conforme seu documento" /></div>
      <div className="field"><label>Tipo do registro</label><input value={f.ibama_record_type || ""} onChange={e => set("ibama_record_type", e.target.value)} placeholder="Ex.: registro, licença, origem" /></div>
      <div className="field"><label>Pai</label><select value={f.father_id || ""} onChange={e => set("father_id", e.target.value)}><option value="">Não informado</option>{birds.filter(b => b.sex === "macho").map(b => <option key={b.id} value={b.id}>{b.name} — {b.ring_number || "sem anilha"}</option>)}</select></div>
      <div className="field"><label>Mãe</label><select value={f.mother_id || ""} onChange={e => set("mother_id", e.target.value)}><option value="">Não informado</option>{birds.filter(b => b.sex === "femea").map(b => <option key={b.id} value={b.id}>{b.name} — {b.ring_number || "sem anilha"}</option>)}</select></div>
      <div className="field"><label>Linhagem / genética</label><input value={f.genetic_line || ""} onChange={e => set("genetic_line", e.target.value)} placeholder="Ex.: linha X, mutação Y" /></div>
      <div className="field"><label>Genotipagem / genética detalhada</label><input value={f.genetics || ""} onChange={e => set("genetics", e.target.value)} placeholder="Ex.: mutação:opalino, portador:ino" /></div>
      <div className="field full"><label><input type="checkbox" checked={!!f.mutation_type} onChange={e => set("mutation_type", e.target.checked ? (f.mutation_type || "Lutino") : "")} style={{ width: "auto", marginRight: 8 }} /> Mutação</label>{!!f.mutation_type && <div style={{marginTop:10,maxWidth:360}}><label htmlFor="bird-mutation-type">Tipo de mutação</label><select id="bird-mutation-type" value={f.mutation_type} onChange={e=>set("mutation_type",e.target.value)}><option value="Lutino">Lutino</option><option value="Branco">Branco</option><option value="Preto">Preto</option><option value="Canela">Canela</option><option value="Diluido">Diluido</option><option value="Laranjeira">Laranjeira</option><option value="Ardesiaca">Ardesiaca</option></select></div>}</div>
      <div className="field full"><label><input type="checkbox" checked={!!f.breeder_matrix} onChange={e => set("breeder_matrix", e.target.checked)} style={{ width: "auto", marginRight: 8 }} /> Marcar como matriz principal do criatório</label></div>
      <div className="field full"><label>Observações</label><textarea rows={5} value={f.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Informações adicionais, origem, características, histórico..." /></div>
    </div>
    <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancelar</button><button className="btn btn-primary" disabled={loading}>{loading || ringChecking ? "Verificando..." : (initialBird ? "Salvar alterações" : "Salvar ave")}</button></div>
  </form>;
}
