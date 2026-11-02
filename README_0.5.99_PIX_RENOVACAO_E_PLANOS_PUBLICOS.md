# Apollo 0.5.99 — Ciclo Pix anual, aviso de vencimento e planos públicos

## Implementado
- Checkout Pix registra `pix_last_paid_at` com o timestamp do evento Stripe de pagamento confirmado e guarda o PaymentIntent.
- `current_period_start` e `current_period_end` definem o período anual. Renovação Pix antecipada acrescenta 12 meses ao vencimento atual; compra após expiração inicia novo período a partir da confirmação.
- Pagamento Pix confirmado limpa o aviso anterior e reinicia o ciclo de aviso.
- Cron diário avisa dentro do Apollo quando faltarem até 30 dias e, após o vencimento, muda o plano para `free`, preservando os dados. O layout do dashboard também verifica a validade em cada acesso e bloqueia o plano vencido imediatamente na próxima requisição autenticada, sem depender da execução diária do cron.
- Banner de aviso fica visível no dashboard e direciona à tela de assinatura.
- Tela Assinatura mostra data/hora do Pix confirmado e vencimento.
- Página inicial pública agora oferece opções Cartão e Pix nos três planos. O cadastro preserva o método escolhido após confirmação de e-mail ou login Google.

## Migração obrigatória
Execute `supabase/migration_pix_renewal_notifications_0_5_99.sql` no SQL Editor do Supabase antes de publicar.

## Vercel
- Manter `CRON_SECRET` configurado em Production.
- O `vercel.json` agenda o endpoint `/api/cron/expire-pix` diariamente às 03:15 UTC.
- Vercel Cron envia `Authorization: Bearer <CRON_SECRET>`.

## Stripe
- Manter o webhook atual e os eventos `checkout.session.completed` e `checkout.session.async_payment_succeeded`.
- O plano só é ativado quando `session.payment_status === 'paid'`.

## Limite atual da notificação
A notificação de 30 dias desta versão é **in-app**: o cron registra o aviso e o Apollo exibe um banner ao assinante quando ele acessa o sistema. Não envia e-mail, WhatsApp ou push porque o projeto não possui um provedor de mensagens configurado nesta base. Para e-mail automático, integrar um provedor (por exemplo, Resend) e configurar suas credenciais.

## Validação
ZIP íntegro. `next build` não executado nesta sessão porque `node_modules` não está incluído no pacote. Validar em Preview: compra Pix, evento assíncrono de confirmação, registro de horário, banner de 30 dias e expiração. Não simular vencimento em produção.
