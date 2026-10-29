"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CreatorPreviewButton from "@/components/creator-preview-button";

const PLANS = [
  { code: "free", label: "Grátis", detail: "5 aves · recursos gratuitos" },
  { code: "amador", label: "Criatório Amador", detail: "Aves ilimitadas · recursos Amador" },
  { code: "profissional", label: "Criatório Profissional", detail: "Aves ilimitadas · recursos Profissionais" },
  { code: "lenda", label: "Criador Lenda", detail: "Aves ilimitadas · benefício veterinário" },
] as const;

export default function OwnerPlanTester({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function changePlan(plan: string) {
    setBusy(plan); setError(""); setOk("");
    try {
      const res = await fetch("/api/owner/test-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível alterar o plano.");
      setOk(`Perfil atualizado para ${data.label}.`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Erro ao atualizar o plano.");
    } finally { setBusy(""); }
  }

  return <section className="section-card owner-test-card">
    <div className="section-heading">
      <div>
        <span className="kicker">Modo de validação</span>
        <h2>Testar planos no meu usuário</h2>
        <p>Exclusivo do owner. Altera o plano real do usuário logado no Supabase, mas mantém seu papel de owner.</p>
      </div>
      <span className="badge">Atual: {PLANS.find(x => x.code === currentPlan)?.label || currentPlan}</span>
    </div>
    <div className="plan-test-grid">
      {PLANS.map(plan => <button key={plan.code} type="button" className={`plan-test-option ${currentPlan === plan.code ? "active" : ""}`} disabled={!!busy} onClick={() => changePlan(plan.code)}>
        <strong>{busy === plan.code ? "Atualizando..." : plan.label}</strong><small>{plan.detail}</small>
      </button>)}
    </div>
    <div className="actions" style={{marginTop:14}}>
      <CreatorPreviewButton />
      <a className="btn btn-soft" href="/dashboard/recursos">Validar módulos</a>
      <a className="btn btn-soft" href="/dashboard/plantel">Validar plantel</a>
    </div>
    {ok && <div className="success" style={{marginTop:12}}>{ok}</div>}
    {error && <div className="error" style={{marginTop:12}}>{error}</div>}
  </section>;
}
