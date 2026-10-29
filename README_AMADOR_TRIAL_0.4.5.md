# Minhas Aves 0.4.5 — Teste de 30 dias do Criatório Amador

## Regra comercial

- O Free continua com até 5 aves.
- O agendamento veterinário continua liberado para qualquer plano.
- A consulta veterinária gratuita continua sendo exclusiva do Criador Lenda: 1 ave por período anual pago. Esta regra NÃO participa do teste de 30 dias.
- Usuários novos elegíveis recebem 30 dias de teste dos recursos exclusivos do Criatório Amador.
- O relógio começa somente no primeiro uso de um recurso Amador.
- Depois de 30 dias, os recursos Amador são bloqueados e a tela apresenta o upgrade para o plano Amador.
- Nenhum dado é apagado ou arquivado por causa do fim do teste.
- Profissional e Lenda possuem seus recursos normalmente.
- Veterinário parceiro e Owner não entram no teste.

## Correção da promoção anterior

A migration 0.4.5 desativa a promoção incorreta de 3 meses do Módulo Veterinário criada na 0.4.4, zerando seus campos de elegibilidade/início/fim. Os campos antigos permanecem no banco para não quebrar instalações existentes, mas não são mais usados pela aplicação.

## Aplicação

1. Substitua o projeto pelo ZIP 0.4.5.
2. Execute `supabase/migration_amador_trial_0_4_5.sql` no SQL Editor.
3. Reinicie o Next.js.
4. Crie uma conta nova para testar.
5. Entre em Recursos e clique em um recurso marcado como Amador.
6. Nesse primeiro uso, o banco grava início e fim em `profiles.amador_trial_started_at` e `profiles.amador_trial_ends_at`.
7. Durante os 30 dias, os recursos Amador ficam liberados.
8. Após o fim, o acesso volta a exigir plano e os dados permanecem no banco.
