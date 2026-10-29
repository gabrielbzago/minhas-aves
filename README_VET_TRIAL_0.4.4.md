# Minhas Aves 0.4.4 — Bônus Veterinário de 3 Meses

## Regra comercial
- Somente contas criadas depois da migration 0.4.4 recebem `vet_module_trial_eligible = true`.
- O bônus começa automaticamente quando uma conta elegível contrata o Criatório Amador.
- Duração: 3 meses corridos a partir da confirmação do pagamento/assinatura pelo Stripe.
- Depois do prazo, o módulo fica bloqueado no Amador.
- Profissional e Lenda possuem o Módulo Veterinário permanentemente.
- Contas antigas não recebem o bônus retroativamente.
- Veterinário parceiro e Owner não participam da promoção comercial.

## O que o Módulo Veterinário libera
- Histórico clínico por ave
- Prontuários anexados em PDF
- Receitas em PDF
- Documentos vinculados às consultas
- Acesso integrado ao veterinário parceiro

## Aplicação
1. Execute `supabase/migration_vet_module_trial_0_4_4.sql` no SQL Editor do Supabase.
2. Confirme que o webhook Stripe está configurado.
3. A nova conta deve ser criada **depois** da migration para receber a elegibilidade.
4. Para testar a promoção real, crie uma conta nova e contrate Amador em modo de teste do Stripe.

## Observação
A assinatura Amador continua com o preço configurado no projeto. O bônus é um benefício promocional sem custo adicional durante os primeiros 3 meses da assinatura.
