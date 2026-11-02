"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const canvasSizeLabel = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function CriatorioProfileForm({ profile, email, logoUrl }: { profile: any; email: string; logoUrl?: string | null }) {
  const supabase = createClient();
  const [name, setName] = useState(profile?.criatorio_name || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [ctf, setCtf] = useState(profile?.ctf_number || "");
  const [city, setCity] = useState(profile?.city || "");
  const [state, setState] = useState(profile?.state || "");
  const [logoPath, setLogoPath] = useState(profile?.criatorio_logo_path || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function optimizeLogo(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem PNG, JPG ou WEBP.");
    let bitmap: ImageBitmap;
    try { bitmap = await createImageBitmap(file); }
    catch { throw new Error("Não foi possível abrir essa imagem. Escolha um PNG, JPG ou WEBP válido."); }
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); throw new Error("Não foi possível preparar a imagem."); }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const toBlob = (quality: number) => new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Falha ao compactar a logo.")), "image/webp", quality)
    );
    let blob = await toBlob(0.90);
    for (const quality of [0.84, 0.78, 0.72, 0.65, 0.58]) {
      if (blob.size <= 1024 * 1024) break;
      blob = await toBlob(quality);
    }
    if (blob.size > 1024 * 1024) throw new Error("Não foi possível reduzir a logo para até 1 MB. Escolha uma imagem mais simples.");
    return new File([blob], "logo.webp", { type: "image/webp", lastModified: Date.now() });
  }

  async function uploadLogo(originalFile: File) {
    const file = await optimizeLogo(originalFile);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão expirada. Entre novamente.");
    const path = `${user.id}/logo.webp`;
    const { error: uploadError } = await supabase.storage.from("criatorio-brand").upload(path, file, { upsert: true, contentType: "image/webp", cacheControl: "3600" });
    if (uploadError) throw new Error(`Falha ao enviar a logo para o Storage: ${uploadError.message}`);
    const { error: pathError } = await supabase.from("profiles").update({ criatorio_logo_path: path }).eq("id", user.id);
    if (pathError) throw new Error(`A imagem foi enviada, mas não foi possível vinculá-la ao perfil: ${pathError.message}`);
    setLogoPath(path);
    setLogoPreview(URL.createObjectURL(file));
    setMessage(`Logo otimizada e vinculada! ${canvasSizeLabel(file.size)}. Recomendado: imagem quadrada, até 1024 × 1024 px e 1 MB.`);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sessão expirada. Entre novamente."); setSaving(false); return; }
    const { error: updateError } = await supabase.from("profiles").update({
      full_name: fullName.trim(), phone: phone.trim() || null, city: city.trim() || null,
      state: state.trim().toUpperCase() || null, criatorio_name: name.trim() || null,
      cpf: cpf.replace(/\D/g, "") || null,
      ctf_number: ctf.trim() || null,
      criatorio_logo_path: logoPath || null,
    }).eq("id", user.id);
    if (updateError) setError(updateError.message); else setMessage("Dados do criatório salvos. Eles aparecerão automaticamente nos cartões e documentos de impressão.");
    setSaving(false);
  }

  return <form className="form-card" onSubmit={submit}>
    {error && <div className="error">{error}</div>}
    {message && <div className="success">{message}</div>}
    <div className="section-heading"><div><h2 style={{margin:0}}>Identidade do criatório</h2><p style={{margin:"5px 0 0", color:"var(--muted)", fontSize:13}}>Esses dados serão reutilizados nos cartões de aves. O CPF também identifica sua conta para transferências entre criadores. O CTF é impresso nos cartões de identificação das aves.</p></div></div>
    <div className="form-grid">
      <div className="field full"><label>Nome do criatório</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Criatório Zago" /></div>
      <div className="field"><label>Responsável</label><input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nome do responsável" /></div>
      <div className="field"><label>E-mail</label><input value={email} disabled /></div>
      <div className="field"><label>CPF</label><input value={cpf} onChange={e=>setCpf(e.target.value)} inputMode="numeric" placeholder="000.000.000-00" /></div>
      <div className="field"><label>Número do CTF (IBAMA)</label><input value={ctf} onChange={e=>setCtf(e.target.value)} placeholder="Número de registro no CTF" /></div>
      <div className="field"><label>Telefone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
      <div className="field"><label>Cidade</label><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Cidade" /></div>
      <div className="field"><label>Estado</label><input maxLength={2} value={state} onChange={e=>setState(e.target.value)} placeholder="SP" /></div>
      <div className="field full">
        <label>Logo do criatório</label>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          {(logoPreview || logoUrl || logoPath) && <div style={{width:86,height:86,borderRadius:16,border:"1px solid var(--border)",background:"#fff",display:"grid",placeItems:"center",overflow:"hidden"}}>{(logoPreview || logoUrl) ? <img src={logoPreview || logoUrl || ""} alt="Logo do criatório" style={{width:"100%",height:"100%",objectFit:"contain"}} /> : <div style={{fontSize:11,color:"var(--muted)",textAlign:"center"}}>Logo vinculada; recarregue para visualizar</div>}</div>}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setError("");try{await uploadLogo(file)}catch(err:any){setError(err.message||"Não foi possível enviar a logo.")}}}/>
        </div>
        <small style={{color:"var(--muted)"}}>Recomendado: imagem quadrada de até 1024 × 1024 px e 1 MB. O Apollo redimensiona e compacta automaticamente imagens maiores antes do envio.</small>
      </div>
    </div>
    <div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving?"Salvando...":"Salvar identidade do criatório"}</button></div>
  </form>;
}
