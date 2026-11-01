"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bird, Stethoscope } from "lucide-react";

export default function OwnerMobileModeSwitcher(){
  const [busy,setBusy]=useState(false);
  const router=useRouter();
  async function enterCreator(){
    if(busy) return;
    setBusy(true);
    try {
      const response=await fetch("/api/owner/preview-mode",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({enabled:true})});
      if(!response.ok) throw new Error("Não foi possível ativar o modo de criador.");
      router.push("/dashboard");
      router.refresh();
    } catch(error) {
      window.alert(error instanceof Error ? error.message : "Falha ao trocar de modo.");
    } finally { setBusy(false); }
  }
  return <div className="owner-mobile-mode-switcher">
    <button type="button" onClick={enterCreator} disabled={busy}><Bird size={16}/>{busy?"Abrindo...":"Modo criador"}</button>
    <Link href="/dashboard/owner/veterinario-preview"><Stethoscope size={16}/>Visão veterinário</Link>
  </div>;
}
