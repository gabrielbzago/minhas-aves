# CAPTCHA no login — Cloudflare Turnstile

A tela `/login` exige uma verificação Cloudflare Turnstile antes de permitir login por e-mail/senha ou iniciar OAuth com Google. O token é validado no servidor pela rota `POST /api/captcha/verify`; a chave secreta nunca é enviada ao navegador.

## Configuração

1. Acesse https://dash.cloudflare.com/ e abra **Turnstile**.
2. Crie um widget para o Minhas Aves.
3. Adicione os hostnames de teste e produção: `localhost`, `127.0.0.1`, `minhasaves.com.br` e `www.minhasaves.com.br` (adicione somente os que utilizar).
4. Copie a **Site Key** para `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
5. Copie a **Secret Key** para `TURNSTILE_SECRET_KEY`.
6. Para desenvolvimento, coloque ambas no `.env.local` e reinicie `npm run dev`.
7. Na Vercel, configure ambas em **Project Settings → Environment Variables** para Production (e Preview, se necessário) e faça novo deploy.

Exemplo `.env.local`:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY="SUA_SITE_KEY"
TURNSTILE_SECRET_KEY="SUA_SECRET_KEY"
```

Não publique `.env.local` nem a Secret Key no GitHub. A `NEXT_PUBLIC_...` é pública por definição; a `TURNSTILE_SECRET_KEY` deve permanecer somente no servidor.

## Comportamento

- O botão de login por senha e o botão de login com Google ficam desativados até o widget emitir um token.
- O servidor valida o token com o endpoint oficial `siteverify` da Cloudflare antes de prosseguir.
- O token é descartado e o widget reiniciado após cada tentativa de validação, porque os tokens são de uso único e expiram.
- Sem as chaves configuradas, o login é bloqueado e a tela informa que a proteção precisa ser configurada.

O CAPTCHA protege a tela de login; para proteger também a criação de contas, aplique a mesma verificação à página `/cadastro` e configure proteção adicional contra abuso no Supabase.
