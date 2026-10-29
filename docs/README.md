# Apollo — arquitetura e implantação

Marca pública: **Minhas Aves**  
Domínio: **https://www.minhasaves.com.br**  
Nome interno do sistema: **Apollo — Gestão de Criatórios**


## Stack
- Next.js App Router + React
- Supabase Auth, Postgres, RLS e Storage
- Stripe Checkout + Webhook

## Planos
- Grátis: até 5 aves (+ bônus promocional se configurado)
- Criatório Amador: R$ 149,90/ano, aves ilimitadas
- Criatório Profissional: R$ 249,90/ano, aves ilimitadas
- Criador Lenda: R$ 349,90/ano, aves ilimitadas + 1 consulta veterinária para uma ave por período anual pago

## Veterinário parceiro
- Qualquer plano pode solicitar atendimento.
- O Criador Lenda recebe uma consulta inclusa por período anual pago.
- A consulta pode ser online ou presencial, conforme disponibilidade e agendamento direto com o veterinário.
- Demais aves e consultas são particulares e combinadas diretamente com o veterinário.
- O veterinário acessa somente criadores Lenda, seus dados necessários e o plantel dessas contas.
- O histórico de assinaturas Lenda registra ativações, renovações, alterações, cancelamentos e chargebacks.
- O repasse inicial é R$ 100 por assinatura/período Lenda; o owner controla o pagamento.
- Chargeback cancela repasse pendente.
- Cada consulta concluída exige dois PDFs: prontuário e receita.
- Os PDFs ficam em bucket privado e o download é autorizado por API.

## Patrocinadores
- Até 5 ativos na home.
- Cada patrocinador pode ter logo, site e WhatsApp.
- A home registra cliques via `/api/sponsors/click`.
- FM Eletrônica já é cadastrada pela migration; a logo pode ser colocada em `public/sponsors/` e vinculada pelo campo `logo_url`.

## SQL
Ordem recomendada:
1. `supabase/schema.sql` (somente em projeto novo)
2. `supabase/migration_modules_unlimited.sql`
3. `supabase/migration_veterinario_patrocinadores_lenda.sql`
4. `supabase/veterinario_setup_template.sql` depois de substituir os placeholders.

## Stripe
Crie preços anuais e configure:
- `STRIPE_PRICE_AMADOR`
- `STRIPE_PRICE_PROFISSIONAL`
- `STRIPE_PRICE_LENDA`

Webhook recomendado:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
- charge.dispute.created

O webhook deve apontar para `/api/stripe/webhook`.
