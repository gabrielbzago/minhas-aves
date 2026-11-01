"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { MessageCircle, X, Send, Mail, Phone, Star, ChevronDown, Headset } from "lucide-react";

type Props = { plan: string; };
const FAQ = [
  { q: "Como cadastro uma ave?", a: "Acesse Meu plantel e clique em Nova ave. Você pode preencher os dados manualmente ou usar o Cadastro inteligente por foto, conforme o limite do seu plano." },
  { q: "Como funciona o limite de IA?", a: "O plano Grátis inclui 1 análise por mês. O Profissional inclui 30 e o Lenda inclui 100 análises mensais. Nos planos pagos, você também pode analisar a frente e o verso da plaquinha e usar a genealogia por foto." },
  { q: "Como faço upgrade do meu plano?", a: "Acesse Assinatura no menu do Apollo, compare os benefícios e escolha o plano que atende ao seu criatório." },
  { q: "Como gerencio anilhas e estoque?", a: "O módulo Gestão de anilhas permite cadastrar anilhas individualmente e acompanhar a utilização no plantel. A disponibilidade depende do plano contratado." },
  { q: "Como solicito ajuda ou reporto um problema?", a: "Envie uma mensagem pelo WhatsApp ou e-mail de suporte. Informe o e-mail da sua conta, o módulo e o que aconteceu. Assinantes recebem encaminhamento prioritário conforme o nível do plano." },
];
const PRIORITY: Record<string, string> = {
  free: "Atendimento padrão",
  amador: "Atendimento prioritário · Criatório Amador",
  profissional: "Suporte prioritário · Criatório Profissional",
  lenda: "Suporte VIP prioritário · Criador Lenda",
};
const PLAN_NAME: Record<string,string> = { free:"Grátis", amador:"Criatório Amador", profissional:"Criatório Profissional", lenda:"Criador Lenda" };

export default function ApolloSupportWidget({ plan }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ajuda"|"feedback">("ajuda");
  const [expanded, setExpanded] = useState<number|null>(0);
  const [category, setCategory] = useState("Sugestão de melhoria");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const normalized = ["amador","profissional","lenda"].includes(plan) ? plan : "free";
  const whatsapp = "https://wa.me/5519992036896?text=" + encodeURIComponent(`Olá! Preciso de suporte no Apollo. Meu plano: ${PLAN_NAME[normalized]}.`);
  async function submitFeedback(e: FormEvent) {
    e.preventDefault();
    if (message.trim().length < 8) { setResult("Conte um pouco mais para que possamos entender sua avaliação."); return; }
    setSending(true); setResult("");
    try {
      const res = await fetch("/api/feedback", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ category, rating, message }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar agora.");
      setResult("Obrigado! Sua avaliação foi registrada e ajuda a melhorar o Apollo."); setMessage("");
    } catch (err) { setResult(err instanceof Error ? err.message : "Falha ao enviar. Tente novamente."); }
    finally { setSending(false); }
  }
  return <>
    <button type="button" aria-label="Abrir ajuda e suporte Apollo" onClick={()=>setOpen(v=>!v)} style={{position:"fixed",right:22,bottom:22,zIndex:150,display:"flex",alignItems:"center",gap:9,border:0,borderRadius:999,padding:"13px 17px",background:"#2f8f68",color:"white",fontWeight:800,boxShadow:"0 10px 28px rgba(25,90,60,.28)"}}><MessageCircle size={19}/><span>Ajuda e suporte</span></button>
    {open && <section role="dialog" aria-label="Central de ajuda Apollo" style={{position:"fixed",right:22,bottom:82,zIndex:151,width:"min(390px,calc(100vw - 28px))",maxHeight:"min(690px,calc(100vh - 110px))",overflowY:"auto",background:"white",border:"1px solid #dcebe4",borderRadius:20,boxShadow:"0 18px 55px rgba(20,65,45,.22)
    }}>
      <header style={{background:"#eaf7f0",padding:17,borderRadius:"20px 20px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><strong style={{display:"flex",gap:8,alignItems:"center"}}><Headset size={19}/> Central Apollo</strong><small style={{display:"block",marginTop:5,color:"#527263"}}>{PRIORITY[normalized]}</small></div><button onClick={()=>setOpen(false)} aria-label="Fechar" style={{border:0,background:"transparent",padding:5}}><X size={20}/></button></header>
      <div style={{display:"flex",gap:8,padding:12,borderBottom:"1px solid #e4eee8"}}><button onClick={()=>setTab("ajuda")} style={{flex:1,padding:9,border:0,borderRadius:9,background:tab==="ajuda"?"#e4f6ee":"#f7faf8",color:"#286f50",fontWeight:700}}>Dúvidas e suporte</button><button onClick={()=>setTab("feedback")} style={{flex:1,padding:9,border:0,borderRadius:9,background:tab==="feedback"?"#e4f6ee":"#f7faf8",color:"#286f50",fontWeight:700}}>Avaliar Apollo</button></div>
      {tab==="ajuda" ? <div style={{padding:15}}><p style={{fontSize:13,color:"#60766b",marginTop:0}}>Olá! Selecione uma dúvida ou fale diretamente com nossa equipe.</p>{FAQ.map((item,i)=><div key={item.q} style={{borderBottom:"1px solid #edf2ef"}}><button onClick={()=>setExpanded(expanded===i?null:i)} style={{width:"100%",border:0,background:"white",padding:"12px 0",display:"flex",justifyContent:"space-between",gap:8,textAlign:"left",fontWeight:700,color:"#234536",fontSize:13}}>{item.q}<ChevronDown size={16}/></button>{expanded===i&&<p style={{fontSize:12,lineHeight:1.6,color:"#62786d",margin:"0 0 12px"}}>{item.a}</p>}</div>)}<div style={{background:"#f5faf7",borderRadius:12,padding:12,marginTop:14}}><strong style={{fontSize:13}}>Seu atendimento no Apollo</strong><p style={{fontSize:12,color:"#60766b",lineHeight:1.5,margin:"6px 0 10px"}}>Plano {PLAN_NAME[normalized]} · {PRIORITY[normalized]}. Assinantes têm encaminhamento prioritário conforme o nível contratado. O prazo de resposta é informado pela equipe.</p><a href={whatsapp} target="_blank" rel="noreferrer" style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,background:"#2f8f68",color:"white",borderRadius:10,padding:11,fontSize:13,fontWeight:800}}><MessageCircle size={16}/> Falar pelo WhatsApp</a><a href="mailto:gabrielbzago@gmail.com?subject=Suporte%20Apollo" style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,color:"#286f50",padding:10,fontSize:12,fontWeight:700}}><Mail size={15}/> gabrielbzago@gmail.com</a><a href="tel:+5519992036896" style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,color:"#286f50",fontSize:12,fontWeight:700}}><Phone size={14}/> (19) 99203-6896</a></div></div>
      : <form onSubmit={submitFeedback} style={{padding:15}}><p style={{fontSize:13,color:"#60766b",marginTop:0}}>Sua opinião ajuda a definir as próximas melhorias do Apollo.</p><label style={{display:"block",fontSize:12,fontWeight:700,marginBottom:6}}>O que deseja compartilhar?</label><select value={category} onChange={e=>setCategory(e.target.value)} style={{width:"100%",padding:10,border:"1px solid #dcebe4",borderRadius:9,marginBottom:12}}><option>Avaliação do produto</option><option>Sugestão de melhoria</option><option>Problema ou erro</option><option>Nova funcionalidade</option><option>Experiência de uso</option></select><label style={{display:"block",fontSize:12,fontWeight:700,marginBottom:7}}>Sua nota</label><div style={{display:"flex",gap:6,marginBottom:13}}>{[1,2,3,4,5].map(n=><button type="button" key={n} onClick={()=>setRating(n)} aria-label={`${n} estrelas`} style={{border:0,background:"transparent",padding:2,color:n<=rating?"#e5a52c":"#cbd7d0"}}><Star size={25} fill={n<=rating?"currentColor":"none"}/></button>)}</div><label style={{display:"block",fontSize:12,fontWeight:700,marginBottom:6}}>Conte sua experiência ou ideia</label><textarea value={message} onChange={e=>setMessage(e.target.value)} required minLength={8} maxLength={3000} rows={5} placeholder="O que você gostaria que melhorássemos?" style={{width:"100%",resize:"vertical",padding:11,border:"1px solid #dcebe4",borderRadius:10,marginBottom:10}}/><button disabled={sending} type="submit" style={{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",gap:8,padding:12,border:0,borderRadius:10,background:"#2f8f68",color:"white",fontWeight:800,opacity:sending ? 0.65 : 1}}><Send size={15}/>{sending?"Enviando...":"Enviar avaliação"}</button>{result&&<p role="status" style={{fontSize:12,lineHeight:1.5,color:result.startsWith("Obrigado")?"#286f50":"#a04c43",marginBottom:0}}>{result}</p>}</form>}
      <footer style={{padding:"10px 15px",borderTop:"1px solid #edf2ef",fontSize:10,color:"#809187",textAlign:"center"}}>Apollo · Gestão de Criatórios · {PLAN_NAME[normalized]}</footer>
    </section>}
  </>;
}
