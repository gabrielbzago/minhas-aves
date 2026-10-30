# Correção de redirecionamento de autenticação — Apollo 0.5.19

O helper `lib/supabase/auth-redirect.ts` agora prioriza `window.location.origin` quando executado no navegador. Assim, login/cadastro com Google e confirmação de e-mail retornam ao mesmo domínio onde o usuário iniciou a autenticação, sem serem desviados por uma variável `NEXT_PUBLIC_SITE_URL` antiga apontando para `localhost`.

## Verificações na Vercel
Em Project → Settings → Environment Variables, confira:
- `NEXT_PUBLIC_SITE_URL` (se existir): `https://minhasaves.com.br`
- `NEXT_PUBLIC_APP_URL` (se existir): `https://minhasaves.com.br`

Remova qualquer valor `http://localhost:3000` dos ambientes Production. Depois de alterar variáveis, faça um novo deployment.

## Verificações no Supabase
Authentication → URL Configuration:
- Site URL: `https://minhasaves.com.br`
- Redirect URLs:
  - `https://minhasaves.com.br/auth/confirm`
  - `https://www.minhasaves.com.br/auth/confirm`
  - `http://localhost:3000/auth/confirm` apenas para desenvolvimento local.

A rota `/auth/confirm` usa a origem do próprio request para redirecionar ao destino local `/dashboard` ou ao caminho `next` validado.
