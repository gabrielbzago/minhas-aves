# Stripe — Apollo Minhas Aves v0.5.18

## Vercel Environment Variables (Production)
Configure os valores na mesma conta Stripe e no mesmo modo (Live ou Test):
- STRIPE_SECRET_KEY = sk_live_...
- STRIPE_WEBHOOK_SECRET = whsec_...
- STRIPE_PRICE_AMADOR = price_...
- STRIPE_PRICE_PROFISSIONAL = price_...
- STRIPE_PRICE_LENDA = price_...
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Os nomes das três variáveis STRIPE_PRICE_* estão corretos. O valor deve ser o Price ID `price_...`, não `prod_...` nem URL `buy.stripe.com`. A captura recebida mostra STRIPE_PRICE_LENDA apenas em Production; habilite Production para as três variáveis. Preview é opcional.

## Checkout e associação
Os botões chamam `/api/stripe/checkout?plan=...`. O endpoint exige sessão Apollo já autenticada (redireciona para login se necessário), cria Checkout Session `mode=subscription` usando o Price ID e grava `user_id`/`plan` nos metadados da sessão e da assinatura. Não se deve usar os Payment Links antigos nos botões.

## Portal do cliente (upgrade/downgrade/cancelamento)
Ative o Customer Portal no Stripe Dashboard. Configure os produtos/preços anuais permitidos para troca e habilite cancelamento e atualização de forma de pagamento. Assinaturas existentes são direcionadas ao portal para evitar criar assinaturas duplicadas.

## Webhook
Endpoint: https://www.minhasaves.com.br/api/stripe/webhook
Configure `STRIPE_WEBHOOK_SECRET` com o segredo deste endpoint. Habilite:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_succeeded
- invoice.payment_failed
- charge.refunded
- charge.dispute.created
- charge.dispute.closed

O webhook atualiza profiles e mantém histórico em stripe_subscriptions. Eventos são deduplicados por stripe_event_id em subscription_events. Em falha de processamento, o marcador é removido para permitir retry do Stripe.

## Migração Supabase
Execute `supabase/migration_stripe_lifecycle_0_5_18.sql` no SQL Editor antes de publicar esta versão.

## Política operacional
- `past_due`: mantém temporariamente o plano durante a recuperação da cobrança; defina a régua de cobrança/retries no Stripe.
- Cancelamento ao fim do período: o acesso continua enquanto subscription.status permanecer active; o evento deleted remove o plano ao término efetivo.
- Reembolso integral: marca o perfil como refunded e retorna ao gratuito. Reembolso parcial não altera automaticamente o plano.
- Disputa aberta: bloqueia o plano; disputa ganha pode restaurar se a assinatura ainda estiver ativa; disputa perdida mantém bloqueio.
- Upgrade/downgrade: feito pelo Customer Portal; o webhook identifica o plano pelo Price ID configurado.

## Testes antes de produção
Use Stripe Test Mode + webhook de teste para validar compra, renovação (invoice paid), falha de cobrança, cancelamento imediato e ao fim do período, troca de preço, reembolso integral e disputa ganha/perdida. O código foi inspecionado e os arquivos/ZIP foram validados; não foi possível executar `next build` nesta sessão.
