# Apollo 0.5.22 — cadastro antes da assinatura

## Fluxo dos botões da página inicial
Os CTAs da home agora abrem `/cadastro?plan=amador|profissional|lenda`. O visitante cria conta antes de pagar.

## Após cadastro
- Cadastro com sessão imediata: redireciona para `/api/stripe/checkout?plan=...`.
- Cadastro que exige confirmação por e-mail: o `emailRedirectTo` inclui o destino de checkout em `next`; `/auth/confirm` valida o código, cria a sessão e redireciona para esse destino.
- Cadastro com Google: OAuth também preserva `next` até a confirmação e segue para o checkout.
- Se já possui conta, o link Entrar na tela de cadastro preserva o plano escolhido via `next` no login.

## Assinantes existentes
Os botões dentro do painel continuam usando o endpoint autenticado `/api/stripe/checkout`, que usa Price IDs `STRIPE_PRICE_AMADOR`, `STRIPE_PRICE_PROFISSIONAL` e `STRIPE_PRICE_LENDA`. Para quem já tem assinatura vinculada, o endpoint abre o Portal do Cliente em vez de criar uma assinatura duplicada.

## Stripe / webhook
O checkout criado pelo servidor inclui `client_reference_id`, metadata `user_id` e `plan`, e metadata da assinatura. Isso permite ao webhook vincular eventos ao perfil do Supabase.

## Configuração
Vercel: conferir as três variáveis `STRIPE_PRICE_*` em Production, com valores `price_...`.
Supabase Auth: Redirect URLs devem permitir `/auth/confirm` nos domínios de produção (`https://minhasaves.com.br/auth/confirm` e `https://www.minhasaves.com.br/auth/confirm`).
Stripe: manter endpoint de webhook `/api/stripe/webhook` e eventos configurados conforme `STRIPE-MINHAS-AVES.md`.

ZIP validado estruturalmente. Build Next.js não foi executado nesta sessão.
