# Apollo 0.5.24 — callback OAuth de produção

## Correção no código
O helper `lib/supabase/auth-redirect.ts` agora gera sempre `https://minhasaves.com.br/auth/confirm` como `redirectTo` de OAuth Google e confirmação de e-mail. Não usa mais a origem do navegador nem `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`, eliminando qualquer possibilidade de `localhost:3000` nessas URLs de retorno geradas pelo frontend.

A rota `/auth/confirm` troca o `code` por sessão e redireciona para `/dashboard` ou para o `next` interno validado (por exemplo, checkout após cadastro).

## Configuração obrigatória no Supabase
Em Authentication → URL Configuration:
- Site URL: `https://minhasaves.com.br`
- Redirect URLs deve incluir exatamente:
  - `https://minhasaves.com.br/auth/confirm`
  - `https://www.minhasaves.com.br/auth/confirm` (se o domínio www também for usado)
- Remova `http://localhost:3000` da configuração de produção se não precisar mais de desenvolvimento local. Não deixe `localhost` como Site URL.

No Google Cloud Console, Authorized redirect URI do provedor Supabase permanece o callback Supabase:
`https://wgnoowjqesalrncfclak.supabase.co/auth/v1/callback`
Não substitua pelo domínio do site.

## Observação
O código foi inspecionado e os JSONs/ZIP validados. Não foi executado `next build` nesta sessão.
