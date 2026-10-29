"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlySupabaseError } from "@/lib/error-messages";
import TurnstileCaptcha from "@/components/turnstile-captcha";

export default function CadastroPage() {
  const [name,setName]=useState(""); const [criatorio,setCriatorio]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false); const [captchaToken,setCaptchaToken]=useState(""); const [captchaResetKey,setCaptchaResetKey]=useState(0); const captchaConfigured=Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  async function validateCaptcha(): Promise<boolean> {
    if (!captchaConfigured) { setError("A proteção antirrobô ainda não foi configurada. Configure NEXT_PUBLIC_TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY antes de habilitar o cadastro."); return false; }
    if (!captchaToken) { setError("Conclua a verificação de segurança antes de criar sua conta."); return false; }
    try {
      const response = await fetch("/api/captcha/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:captchaToken}), cache:"no-store" });
      const result = await response.json() as {success?:boolean;error?:string};
      setCaptchaToken(""); setCaptchaResetKey(v=>v+1);
      if (!response.ok || !result.success) { setError(result.error || "Não foi possível validar a verificação. Tente novamente."); return false; }
      return true;
    } catch { setError("Não foi possível validar a verificação. Confira sua conexão e tente novamente."); setCaptchaToken(""); setCaptchaResetKey(v=>v+1); return false; }
  }
  async function signInWithGoogle(){
    setLoading(true); setError("");
    try {
      if (!(await validateCaptcha())) return;
      const {error}=await createClient().auth.signInWithOAuth({
        provider:"google",
        options:{redirectTo:`${window.location.origin}/auth/confirm`,queryParams:{access_type:"offline",prompt:"consent"}}
      });
      if(error) setError(friendlySupabaseError(error,"Não foi possível continuar com o Google."));
    } catch (err) { console.error("[Apollo] falha no cadastro com Google",err); setError(friendlySupabaseError(err,"Não foi possível continuar com o Google.")); }
    finally { setLoading(false); }
  }
  async function submit(e:FormEvent){
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (!(await validateCaptcha())) return;
      const supabase = createClient();
      const {data,error}=await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options:{
          data:{full_name:name.trim(),criatorio_name:criatorio.trim()},
          emailRedirectTo:`${window.location.origin}/auth/confirm`
        }
      });
      if(error) { console.error("[Apollo] erro Supabase ao criar conta", {message:error.message,code:error.code,status:error.status,name:error.name}); throw error; }
      setMessage(data.session ? "Conta criada com sucesso! Redirecionando..." : "Conta criada. Verifique seu e-mail para confirmar o cadastro.");
      if(data.session) window.location.href="/dashboard";
    } catch (err:any) {
      console.error("[Apollo] falha no cadastro", {
        message: err?.message,
        code: err?.code,
        status: err?.status,
        name: err?.name,
        details: err?.details,
        hint: err?.hint,
      });
      const friendly = friendlySupabaseError(err, "");
      const technical = [err?.message, err?.code ? `código ${err.code}` : "", err?.status ? `HTTP ${err.status}` : ""].filter(Boolean).join(" — ");
      setError(friendly || (technical
        ? `O Supabase recusou o cadastro: ${technical}. Envie esta mensagem ao suporte para identificar a causa.`
        : "Não foi possível criar a conta. Abra o console do navegador (F12) para ver o erro técnico."));
    } finally {
      setLoading(false);
    }
  }
  return <main className="auth-page"><div className="auth-card"><Link className="brand" href="/"><img className="apollo-public-logo" src="/branding/apollo-logo.png" alt="Apollo — Gestão de Aves" /></Link><h1 style={{marginTop:30}}>Criar conta</h1><p>Comece gratuitamente com até 5 aves. Novas contas podem receber benefícios promocionais exclusivos.</p>{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}<form onSubmit={submit}><div className="field"><label>Seu nome</label><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do responsável"/></div><div className="field"><label>Nome do criatório</label><input required value={criatorio} onChange={e=>setCriatorio(e.target.value)} placeholder="Ex.: Criatório Zago"/></div><div className="field"><label>E-mail</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label>Senha</label><input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></div><TurnstileCaptcha onToken={setCaptchaToken} resetKey={captchaResetKey}/><button className="btn btn-primary" style={{width:"100%"}} disabled={loading || !captchaConfigured || !captchaToken}>{loading?"Criando...":"Criar minha conta"}</button></form>
<div className="auth-divider"><span>ou</span></div>
<button type="button" className="google-btn" onClick={signInWithGoogle} disabled={loading || !captchaConfigured || !captchaToken}>
  <span className="google-icon">G</span><span>Cadastrar com Google</span>
</button>
<p style={{fontSize:13,marginTop:20}}>Já possui conta? <Link href="/login" style={{color:"var(--primary-dark)",fontWeight:700}}>Entrar</Link></p></div></main>
}
