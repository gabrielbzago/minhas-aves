"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function CreatorPreviewButton(){
 const router=useRouter(); const [busy,setBusy]=useState(false);
 async function enter(){setBusy(true);try{const res=await fetch('/api/owner/preview-mode',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({enabled:true})});if(!res.ok)throw new Error('Não foi possível abrir o modo criador.');router.push('/dashboard');router.refresh();}catch(e){alert(e instanceof Error?e.message:'Erro ao abrir o modo criador.');setBusy(false);}}
 return <button className="btn btn-primary" type="button" onClick={enter} disabled={busy}>{busy?'Abrindo...':'Abrir visão do criador'}</button>;
}
