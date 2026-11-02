# Apollo 0.5.98 — Pix anual

## O que mudou
- Na tela Assinatura, os três planos pagos oferecem pagamento por cartão ou Pix.
- Cartão mantém o checkout recorrente atual da Stripe.
- Pix usa Checkout Session individual, em modo `payment`, com o Price ID avulso do plano.
- A ativação só ocorre após confirmação de pagamento (`checkout.session.async_payment_succeeded` ou sessão concluída já paga).
- O webhook associa a compra ao usuário por metadados e registra 12 meses em `profiles.current_period_start/current_period_end`.
- O plano Lenda reinicia o benefício anual de consulta somente após confirmação do pagamento.
- Cron diário retorna ao plano Grátis os pagamentos Pix cujo período terminou. Os dados do criatório não são apagados.

## Variáveis Vercel
Já existentes:
- `STRIPE_PRICE_AMADOR_PIX`
- `STRIPE_PRICE_PROFISSIONAL_PIX`
- `STRIPE_PRICE_LENDA_PIX`

Adicionar:
- `CRON_SECRET`: segredo aleatório forte (mesmo valor usado pelo Vercel Cron para autenticar `/api/cron/expire-pix`).

Manter também as variáveis Stripe já usadas pelo checkout recorrente e webhook:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_AMADOR`
- `STRIPE_PRICE_PROFISSIONAL`
- `STRIPE_PRICE_LENDA`

## Stripe Webhook
Manter o endpoint atual `/api/stripe/webhook` e habilitar também o evento:
- `checkout.session.async_payment_succeeded`

Manter `checkout.session.completed` e os eventos de assinatura já configurados. O evento `checkout.session.completed` pode ocorrer enquanto o Pix ainda está pendente; nesse caso o Apollo NÃO libera o plano. A liberação ocorre somente quando `payment_status=paid`.

## Cron
`vercel.json` agenda `/api/cron/expire-pix` diariamente às 03:15 UTC. O endpoint exige `Authorization: Bearer CRON_SECRET`.

## Testes antes de produção
1. Testar Pix de cada plano em modo Stripe compatível com os Price IDs configurados.
2. Confirmar que o checkout pendente não libera o plano.
3. Confirmar que o webhook de pagamento aprovado libera o plano correto e grava vencimento de 12 meses.
4. Testar vencimento ajustando temporariamente `current_period_end` para uma data passada e executar o endpoint Cron autenticado.
5. Testar cartão para garantir que assinatura e portal continuam funcionando.

**Atenção:** o build Next.js não foi executado nesta sessão porque o pacote não contém `node_modules`. Faça deploy de Preview e valide o fluxo com um pagamento de teste antes de divulgar o Pix em produção.
