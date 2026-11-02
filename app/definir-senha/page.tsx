"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function DefinirSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        setError("Não encontramos uma sessão válida do convite. Abra novamente o link recebido por e-mail. Se ele expirou, solicite um novo convite.");
      }
      setChecking(false);
    }).catch(() => {
      if (active) {
        setError("Não foi possível validar o convite. Abra novamente o link recebido por e-mail.");
        setChecking(false);
      }
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem. Digite novamente.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Sua sessão de convite expirou. Abra novamente o link do e-mail ou solicite um novo convite.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || "Não foi possível salvar sua senha. Tente novamente.");
        return;
      }
      setSuccess(true);
      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("[Apollo] erro ao definir senha após convite:", err);
      setError("Ocorreu um erro ao salvar sua senha. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="brand" href="/">
          <img className="apollo-public-logo" src="/branding/apollo-logo.png" alt="Apollo — Gestão de Aves" />
        </Link>
        <h1 style={{ marginTop: 30 }}>Defina sua senha</h1>
        <p>Seu convite foi recebido. Crie uma senha para acessar sua conta Apollo.</p>
        {checking ? <div className="success">Validando seu convite...</div> : null}
        {error ? <div className="error" role="alert">{error}</div> : null}
        {success ? <div className="success" role="status">Senha cadastrada com sucesso! Estamos levando você ao Apollo...</div> : null}
        {!checking && !success ? (
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="new-password">Nova senha</label>
              <div className="password-input-wrap">
                <input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" />
                <button type="button" className="password-visibility" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirme sua senha</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Digite a senha novamente" />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>
              <LockKeyhole size={17} style={{ marginRight: 8, verticalAlign: "middle" }}/>
              {saving ? "Salvando senha..." : "Salvar senha e acessar"}
            </button>
          </form>
        ) : null}
        <p style={{ fontSize: 13, marginTop: 20 }}>Já definiu sua senha? <Link href="/login" style={{ color: "var(--primary-dark)", fontWeight: 700 }}>Entrar</Link></p>
      </div>
    </main>
  );
}
