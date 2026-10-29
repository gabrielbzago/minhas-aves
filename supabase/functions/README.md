# Supabase Edge Functions (opcional)

O projeto principal usa Route Handlers do Next.js para o Stripe. Se futuramente você quiser separar o webhook em uma Edge Function, mova a lógica para cá.

Para o MVP atual, mantenha:
`POST /api/stripe/webhook`

O segredo `SUPABASE_SERVICE_ROLE_KEY` deve existir somente no servidor. Nunca publique essa chave no navegador.
