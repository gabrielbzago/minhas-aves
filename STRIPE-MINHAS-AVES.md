# Stripe — Minhas Aves

Os botões dos planos no painel redirecionam para estes Payment Links da conta Stripe do Minhas Aves:

- Criatório Amador — R$ 149,00: https://buy.stripe.com/eVqbJ096F9U6aRjdz41B600
- Criatório Profissional — R$ 249,90: https://buy.stripe.com/cNieVcdmV5DQe3v3Yu1B601
- Criador Lenda — R$ 349,90: https://buy.stripe.com/dRm14m1Ed5DQgbD7aG1B602

## Associação segura da assinatura ao usuário

O endpoint autenticado `/api/stripe/checkout?plan=amador|profissional|lenda` redireciona para o Payment Link selecionado e envia `client_reference_id` no formato `UUID_DO_USUARIO_plano`, além de pré-preencher o e-mail. No evento `checkout.session.completed`, o webhook associa o usuário e grava `user_id` e `plan` nos metadados da assinatura para processar os eventos de renovação seguintes.

## Configuração obrigatória no Stripe Dashboard

Para cada Payment Link, configure a página de confirmação/retorno após pagamento para:
`https://www.minhasaves.com.br/dashboard/assinatura?success=1`

Configure o webhook da conta Stripe exclusiva do Minhas Aves para:
`https://www.minhasaves.com.br/api/stripe/webhook`

Habilite pelo menos:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid` (e/ou `invoice.payment_succeeded`, conforme os eventos disponíveis na configuração da conta)
- `charge.dispute.created`

Use o segredo de assinatura desse endpoint em `STRIPE_WEBHOOK_SECRET` e a chave secreta da mesma conta em `STRIPE_SECRET_KEY`. Não use credenciais do TubeX.

## Observação importante

A associação automática exige que os pagamentos sejam iniciados pelos botões autenticados do aplicativo, que passam `client_reference_id`. Se o usuário abrir o Payment Link diretamente, fora do aplicativo, não haverá um identificador confiável do perfil Supabase e o webhook não poderá associar a compra automaticamente.
