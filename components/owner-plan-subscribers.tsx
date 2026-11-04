"use client";
import { useState } from "react";

const PLAN_META = [
  { key: "free", label: "Grátis", tone: "neutral" },
  { key: "amador", label: "Criatório Amador", tone: "blue" },
  { key: "profissional", label: "Criatório Profissional", tone: "violet" },
  { key: "lenda", label: "Criador Lenda", tone: "gold" },
] as const;

export default function OwnerPlanSubscribers({ profiles }: { profiles: any[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = (profile: any, plan: string) => { const status = String(profile.subscription_status || "").toLowerCase(); return plan === "free" ? !["suspended", "blocked", "deleted"].includes(status) : !["canceled", "cancelled", "suspended", "blocked", "inactive", "expired", "pix_expired"].includes(status); };
  const normalized = (value: any) => ["free", "amador", "profissional", "lenda"].includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "free";
  const counts = PLAN_META.map(plan => ({ ...plan, members: profiles.filter(p => normalized(p.plan) === plan.key && active(p, plan.key)) }));
  return <section className="section-card">
    <div className="section-heading"><div><h2>Assinantes por plano</h2><p>Clique em um plano para consultar os usuários vinculados a ele. Os dados são carregados diretamente do cadastro.</p></div></div>
    <div className="stat-grid owner-plan-grid">
      {counts.map(plan => <button type="button" key={plan.key} className={`stat owner-plan-stat ${selected === plan.key ? "owner-plan-selected" : ""}`} onClick={() => setSelected(selected === plan.key ? null : plan.key)} aria-expanded={selected === plan.key}>
        <small>{plan.label}</small><strong>{plan.members.length}</strong><span>{selected === plan.key ? "Ocultar usuários ↑" : "Ver usuários →"}</span>
      </button>)}
    </div>
    {selected && <div className="owner-plan-results">
      <div className="section-heading"><div><h3>{PLAN_META.find(p => p.key === selected)?.label}</h3><p>{counts.find(p => p.key === selected)?.members.length || 0} usuário(s) com acesso ativo</p></div></div>
      <div className="record-list">
        {(counts.find(p => p.key === selected)?.members || []).map((profile: any) => <article className="record" key={profile.id}>
          <div><strong>{profile.criatorio_name || profile.full_name || "Usuário sem nome"}</strong><small>{profile.subscription_status || "sem status informado"}</small></div>
          <span className="badge">{profile.plan === "free" ? "GRÁTIS" : String(profile.plan || "").toUpperCase()}</span>
        </article>)}
        {!counts.find(p => p.key === selected)?.members.length && <div className="empty">Nenhum usuário ativo neste plano.</div>}
      </div>
    </div>}
  </section>;
}
