"use client";

import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PasskeySettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function registerPasskey() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (typeof window === "undefined" || !window.isSecureContext || !("PublicKeyCredential" in window)) {
        setError("Este navegador ou dispositivo não oferece suporte a Passkeys. Use um navegador atualizado em HTTPS.");
        return;
      }
      const supabase = createClient();
      const { error: passkeyError } = await supabase.auth.registerPasskey();
      if (passkeyError) throw passkeyError;
      setMessage("Chave de acesso cadastrada! Nos próximos acessos, você poderá usar a biometria, o PIN ou o autenticador configurado no seu dispositivo.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível cadastrar a chave de acesso.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card passkey-settings-card" style={{ marginTop: 18 }}>
      <div className="passkey-settings-heading">
        <div>
          <h3 style={{ margin: 0 }}>Acesso por biometria</h3>
          <p style={{ marginTop: 7 }}>Cadastre uma Passkey para entrar no Apollo usando impressão digital, Face ID, Windows Hello, PIN ou outro autenticador compatível.</p>
        </div>
        <Fingerprint size={28} aria-hidden="true" />
      </div>
      {error && <div className="error" role="alert" style={{ marginTop: 14 }}>{error}</div>}
      {message && <div className="success" role="status" style={{ marginTop: 14 }}>{message}</div>}
      <button className="btn btn-primary" type="button" onClick={registerPasskey} disabled={loading} style={{ marginTop: 16 }}>
        {loading ? <><Loader2 size={17} className="spin"/> Cadastrando...</> : <><Fingerprint size={17}/> Cadastrar biometria neste dispositivo</>}
      </button>
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, marginBottom: 0 }}>É necessário estar em um dispositivo compatível, usar HTTPS e ter confirmado o e-mail da conta. A biometria permanece no dispositivo ou gerenciador de credenciais; o Apollo não recebe nem armazena sua impressão digital.</p>
    </section>
  );
}
