import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { CONVERSION_COPY, PLAN_MARKETING } from "@/lib/conversion";
import { normalizePlan, PLAN_INFO } from "@/lib/plans";

export default function PlanUpgradeBanner({plan, compact=false}:{plan:string;compact?:boolean}) {
  const normalized=normalizePlan(plan);
  if(normalized!=="free") return null;
  const copy=CONVERSION_COPY.freeDashboard;
  const benefits=PLAN_MARKETING.amador.highlights;
  return <section className={`apollo-upgrade-banner${compact?" compact":""}`} aria-label="Conheça os planos Apollo">
    <div className="apollo-upgrade-mark"><Sparkles size={20}/></div>
    <div className="apollo-upgrade-content"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.description}</p>
      {!compact&&<ul>{benefits.map(item=><li key={item}>{item}</li>)}</ul>}
    </div>
    <div className="apollo-upgrade-action"><small>Planos a partir de R$ {PLAN_INFO.amador.annualPrice.toFixed(2).replace(".",",")}/ano</small><Link className="btn btn-primary" href="/dashboard/assinatura">{copy.cta}<ArrowUpRight size={15}/></Link></div>
  </section>;
}
