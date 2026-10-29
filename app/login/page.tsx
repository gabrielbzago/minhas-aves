"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { friendlySupabaseError } from "@/lib/error-messages";
import TurnstileCaptcha from "@/components/turnstile-captcha";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const router = useRouter();

  async function validateCaptcha(): Promise<boolean> {
    if (!captchaConfigured) {
      setError("A proteção antirrobô ainda não foi configurada. Configure as chaves do Cloudflare Turnstile antes de habilitar o login.");
      return false;
    }
    if (!captchaToken) {
      setError("Conclua a verificação de segurança antes de continuar.");
      return false;
    }

    try {
      const response = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken }),
        cache: "no-store",
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      setCaptchaToken("");
      setCaptchaResetKey((value) => value + 1);
      if (!response.ok || !result.success) {
        setError(result.error || "Não foi possível validar a verificação. Tente novamente.");
        return false;
      }
      return true;
    } catch {
      setError("Não foi possível validar a verificação. Confira sua conexão e tente novamente.");
      setCaptchaToken("");
      setCaptchaResetKey((value) => value + 1);
      return false;
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    try {
      if (!(await validateCaptcha())) return;
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/confirm` },
      });
      if (authError) setError(friendlySupabaseError(authError, "Não foi possível entrar com o Google."));
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!(await validateCaptcha())) return;
      const { error: authError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError(friendlySupabaseError(authError, "Não foi possível entrar. Verifique seus dados e tente novamente."));
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="brand" href="/">
          <img className="apollo-public-logo" src="/branding/apollo-logo.png" alt="Apollo — Gestão de Aves" />
        </Link>
        <h1 style={{ marginTop: 30 }}>Entrar</h1>
        <p>Acesse seu plantel e continue de onde parou.</p>
        {error && <div className="error" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="login-email">E-mail</label>
            <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Senha</label>
            <input id="login-password" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <TurnstileCaptcha onToken={setCaptchaToken} resetKey={captchaResetKey} />
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading || !captchaConfigured || !captchaToken}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>
        <div className="auth-divider"><span>ou</span></div>
        <button type="button" className="google-btn" onClick={signInWithGoogle} disabled={loading || !captchaConfigured || !captchaToken}>
          <span className="google-icon">G</span><span>Continuar com Google</span>
        </button>
        <p style={{ fontSize: 13, marginTop: 20 }}>Ainda não tem conta? <Link href="/cadastro" style={{ color: "var(--primary-dark)", fontWeight: 700 }}>Criar conta</Link></p>
      </div>
    </main>
  );
}
