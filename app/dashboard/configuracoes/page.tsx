import { requireUser } from "@/lib/auth";
import CriatorioProfileForm from "@/components/criatorio-profile-form";

export default async function Settings(){
  const {supabase,user}=await requireUser();
  const {data:p}=await supabase.from("profiles").select("full_name,phone,city,state,cpf,criatorio_name,criatorio_logo_path").eq("id",user.id).maybeSingle();
  return <main className="content">
    <div className="page-title"><div><h1>Configurações</h1><p>Defina a identidade do seu criatório e os dados que serão impressos nos cartões.</p></div></div>
    <CriatorioProfileForm profile={p} email={user.email||""}/>
    <div className="card" style={{marginTop:18}}><h3>Como aparece no cartão</h3><p style={{color:"var(--muted)",marginBottom:0}}>O cartão de cada ave usa automaticamente o nome do criatório, a logo, o responsável, cidade/UF e os dados de identificação da própria ave. Você não precisa preencher essas informações novamente em cada cadastro.</p></div>
  </main>
}
