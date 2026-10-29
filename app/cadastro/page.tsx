"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlySupabaseError } from "@/lib/error-messages";

export default function CadastroPage() {
  const [name,setName]=useState(""); const [criatorio,setCriatorio]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function signInWithGoogle(){
    setLoading(true); setError("");
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{
        redirectTo:`${window.location.origin}/auth/confirm`,
        queryParams:{access_type:"offline",prompt:"consent"}
      }
    });
    if(error){setError(friendlySupabaseError(error,"Não foi possível continuar com o Google."));setLoading(false);}
  }
  async function submit(e:FormEvent){
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const {data,error}=await supabase.auth.signUp({
        email: email.trim(),
        password,
        options:{
          data:{full_name:name.trim(),criatorio_name:criatorio.trim()},
          emailRedirectTo:`${window.location.origin}/auth/confirm`
        }
      });
      if(error) throw error;
      setMessage(data.session ? "Conta criada com sucesso! Redirecionando..." : "Conta criada. Verifique seu e-mail para confirmar o cadastro.");
      if(data.session) window.location.href="/dashboard";
    } catch (err:any) {
      setError(friendlySupabaseError(err,"Não foi possível criar a conta. Verifique os dados e tente novamente."));
    } finally {
      setLoading(false);
    }
  }
  return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true" /><span className="brand-name brand-minhas-aves">Minhas Aves</span></Link><h1 style={{marginTop:30}}>Criar conta</h1><p>Comece gratuitamente com até 5 aves. Novas contas podem receber benefícios promocionais exclusivos.</p>{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}<form onSubmit={submit}><div className="field"><label>Seu nome</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do responsável"/></div><div className="field"><label>Nome do criatório</label><input required value={criatorio} onChange={e=>setCriatorio(e.target.value)} placeholder="Ex.: Criatório Zago"/></div><div className="field"><label>E-mail</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label>Senha</label><input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/></div><button className="btn btn-primary" style={{width:"100%"}} disabled={loading}>{loading?"Criando...":"Criar minha conta"}</button></form>
<div className="auth-divider"><span>ou</span></div>
<button type="button" className="google-btn" onClick={signInWithGoogle} disabled={loading}>
  <span className="google-icon">G</span><span>Cadastrar com Google</span>
</button>
<p style={{fontSize:13,marginTop:20}}>Já possui conta? <Link href="/login" style={{color:"var(--primary-dark)",fontWeight:700}}>Entrar</Link></p></div></main>
}
