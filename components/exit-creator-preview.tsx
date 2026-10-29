"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function ExitCreatorPreview(){
 const router=useRouter(); const [busy,setBusy]=useState(false);
 async function exit(){setBusy(true);try{await fetch('/api/owner/preview-mode',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({enabled:false})});router.push('/dashboard/owner');router.refresh();}finally{setBusy(false);}}
 return <button className="preview-exit" type="button" onClick={exit} disabled={busy}>{busy?'Voltando...':'← Voltar para Owner'}</button>;
}
