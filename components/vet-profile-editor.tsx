"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VetProfileEditor({ profile }: { profile: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [name,setName]=useState(profile?.display_name || "Kaique Pedro");
  const [crmv,setCrmv]=useState(profile?.crmv || "");
  const [photo,setPhoto]=useState(profile?.photo_url || "/veterinarios/kaique-pedro.png");
  const [bio,setBio]=useState(profile?.bio || "Meu nome é Kaique Pedro, tenho 31 anos e sou médico-veterinário, formado em 2025. Também sou formado em Logística e atualmente sou proprietário da Clínica Veterinária Vivaz, em Espírito Santo do Pinhal – SP, onde atuo no atendimento clínico de animais de pequeno porte e, principalmente, na medicina de aves.\n\nMinha trajetória com as aves começou muito antes da minha formação acadêmica. Sou criador de aves desde os oito anos de idade, com experiência especialmente na criação de passeriformes, tendo como principais espécies o coleiro e o trinca-ferro. Essa vivência prática despertou meu interesse pela medicina aviária e contribuiu diretamente para minha escolha profissional.\n\nAo longo da minha formação, busquei aprimorar meus conhecimentos por meio de cursos voltados à clínica médica, manejo, clínica cirúrgica e, mais recentemente, anestesiologia veterinária voltada para aves.\n\nEm relação à experiência prática, realizei um estágio de três meses no Criatório Veneno, onde tive a oportunidade de aprofundar meus conhecimentos na criação e no manejo de passeriformes. Posteriormente, retornei ao criatório para atuar diretamente no acompanhamento da reprodução de coleiros e na rotina de clínica médica.\n\nDurante esse período, participei de atividades relacionadas ao controle sanitário do plantel, manejo produtivo, acompanhamento reprodutivo, ajustes nutricionais e atendimento clínico das aves.\n\nAcredito que a combinação entre vivência na criação, conhecimento técnico e formação veterinária é um diferencial importante na minha atuação, especialmente na medicina de aves.");
  const [specialties,setSpecialties]=useState(profile?.specialties || "Medicina de aves; clínica médica de pequenos animais; manejo e clínica de passeriformes; acompanhamento reprodutivo; clínica cirúrgica; anestesiologia veterinária voltada para aves");
  const [address,setAddress]=useState(profile?.address || "");
  const [city,setCity]=useState(profile?.city || "Espírito Santo do Pinhal");
  const [state,setState]=useState(profile?.state || "SP");
  const [whatsapp,setWhatsapp]=useState(profile?.whatsapp || "");
  const [online,setOnline]=useState(profile?.online_available ?? true);
  const [inPerson,setInPerson]=useState(profile?.in_person_available ?? true);
  const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function uploadPhoto(file?: File) {
    if (!file) return;
    setError(""); setMessage("");
    if (!file.type.startsWith("image/")) { setError("Selecione um arquivo de imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("A foto deve ter até 5 MB."); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sessão expirada. Entre novamente."); setSaving(false); return; }
    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("vet-profile-photos").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) setError(`Não foi possível enviar a foto: ${uploadError.message}`);
    else { const { data } = supabase.storage.from("vet-profile-photos").getPublicUrl(path); setPhoto(data.publicUrl); setMessage("Foto enviada. Clique em Salvar perfil profissional para publicar a alteração."); }
    setSaving(false);
  }
  async function submit(e:FormEvent){
    e.preventDefault(); setSaving(true);setMessage("");setError("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setError("Sessão expirada. Entre novamente.");setSaving(false);return;}
    const {error:saveError}=await supabase.from("vet_profiles").update({
      display_name:name.trim(),crmv:crmv.trim()||null,photo_url:photo.trim()||null,bio:bio.trim()||null,
      specialties:specialties.trim()||null,address:address.trim()||null,city:city.trim()||null,
      state:state.trim().toUpperCase()||null,whatsapp:whatsapp.trim()||null,
      online_available:online,in_person_available:inPerson,updated_at:new Date().toISOString()
    }).eq("id",user.id);
    if(saveError)setError(saveError.message);else{setMessage("Perfil profissional atualizado com sucesso.");router.refresh();}
    setSaving(false);
  }
  return <form className="form-card" onSubmit={submit}>
    <div className="section-heading"><div><h2>Meu perfil profissional</h2><p>Edite sua apresentação pública sempre que precisar. As alterações serão refletidas na página inicial e na página do veterinário.</p></div></div>
    {error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}
    <div className="form-grid">
      <div className="field"><label>Nome profissional</label><input value={name} onChange={e=>setName(e.target.value)} required/></div>
      <div className="field"><label>CRMV</label><input value={crmv} onChange={e=>setCrmv(e.target.value)} placeholder="Informe seu registro"/></div>
      <div className="field"><label>Foto profissional (URL)</label><input value={photo} onChange={e=>setPhoto(e.target.value)} placeholder="/veterinarios/kaique-pedro.png ou URL https://..."/><input type="file" accept="image/*" onChange={e=>uploadPhoto(e.target.files?.[0])}/><small>Você também pode enviar uma foto (até 5 MB).</small></div>
      <div className="field"><label>Especialidades e áreas de atuação</label><input value={specialties} onChange={e=>setSpecialties(e.target.value)}/></div>
      <div className="field"><label>Endereço da clínica</label><input value={address} onChange={e=>setAddress(e.target.value)}/></div>
      <div className="field"><label>WhatsApp</label><input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)}/></div>
      <div className="field"><label>Cidade</label><input value={city} onChange={e=>setCity(e.target.value)}/></div>
      <div className="field"><label>Estado</label><input value={state} onChange={e=>setState(e.target.value)}/></div>
      <div className="field" style={{gridColumn:"1/-1"}}><label>Biografia profissional</label><textarea rows={12} value={bio} onChange={e=>setBio(e.target.value)} required/></div>
      <div className="field"><label><input type="checkbox" checked={online} onChange={e=>setOnline(e.target.checked)}/> Atendimento online</label></div>
      <div className="field"><label><input type="checkbox" checked={inPerson} onChange={e=>setInPerson(e.target.checked)}/> Atendimento presencial</label></div>
    </div>
    <div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving?"Salvando...":"Salvar perfil profissional"}</button></div>
  </form>;
}
