"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CriatorioProfileForm({ profile, email }: { profile: any; email: string }) {
  const supabase = createClient();
  const [name, setName] = useState(profile?.criatorio_name || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [city, setCity] = useState(profile?.city || "");
  const [state, setState] = useState(profile?.state || "");
  const [logoPath, setLogoPath] = useState(profile?.criatorio_logo_path || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function uploadLogo(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("Escolha uma imagem PNG, JPG ou WEBP.");
    if (file.size > 2 * 1024 * 1024) throw new Error("A logo deve ter no máximo 2 MB.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão expirada. Entre novamente.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("criatorio-brand").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;
    setLogoPath(path);
    setLogoPreview(URL.createObjectURL(file));
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
      criatorio_logo_path: logoPath || null,
    }).eq("id", user.id);
    if (updateError) setError(updateError.message); else setMessage("Dados do criatório salvos. Eles aparecerão automaticamente nos cartões e documentos de impressão.");
    setSaving(false);
  }

  return <form className="form-card" onSubmit={submit}>
    {error && <div className="error">{error}</div>}
    {message && <div className="success">{message}</div>}
    <div className="section-heading"><div><h2 style={{margin:0}}>Identidade do criatório</h2><p style={{margin:"5px 0 0", color:"var(--muted)", fontSize:13}}>Esses dados serão reutilizados nos cartões de aves. O CPF também identifica sua conta para transferências entre criadores.</p></div></div>
    <div className="form-grid">
      <div className="field full"><label>Nome do criatório</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Criatório Zago" /></div>
      <div className="field"><label>Responsável</label><input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nome do responsável" /></div>
      <div className="field"><label>E-mail</label><input value={email} disabled /></div>
      <div className="field"><label>CPF</label><input value={cpf} onChange={e=>setCpf(e.target.value)} inputMode="numeric" placeholder="000.000.000-00" /></div>
      <div className="field"><label>Telefone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
      <div className="field"><label>Cidade</label><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Cidade" /></div>
      <div className="field"><label>Estado</label><input maxLength={2} value={state} onChange={e=>setState(e.target.value)} placeholder="SP" /></div>
      <div className="field full">
        <label>Logo do criatório</label>
        <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          {(logoPreview || logoPath) && <div style={{width:86,height:86,borderRadius:16,border:"1px solid var(--border)",background:"#fff",display:"grid",placeItems:"center",overflow:"hidden"}}>{logoPreview ? <img src={logoPreview} alt="Prévia da logo" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} /> : <div style={{fontSize:11,color:"var(--muted)",textAlign:"center"}}>Logo salva</div>}</div>}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setError("");try{await uploadLogo(file)}catch(err:any){setError(err.message||"Não foi possível enviar a logo.")}}}/>
        </div>
        <small style={{color:"var(--muted)"}}>PNG, JPG ou WEBP. Até 2 MB. A logo fica privada na sua conta.</small>
      </div>
    </div>
    <div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving?"Salvando...":"Salvar identidade do criatório"}</button></div>
  </form>;
}
