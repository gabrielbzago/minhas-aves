# Apollo v0.5.17 — links diretos da Stripe

Os botões de assinatura agora apontam diretamente para os Payment Links fornecidos pelo proprietário, sem passar pela rota `/api/stripe/checkout` e sem exigir login antes de abrir o checkout.

- Amador: https://buy.stripe.com/eVqbJ096F9U6aRjdz41B600
- Profissional: https://buy.stripe.com/cNieVcdmV5DQe3v3Yu1B601
- Lenda: https://buy.stripe.com/dRm14m1Ed5DQgbD7aG1B602

Aplicado em:
- Página inicial / seção de planos.
- Dashboard / Assinatura.
- Links de upgrade dos módulos em Dashboard / Recursos.

Os links abrem o checkout hospedado pela Stripe em nova aba. Não foi feita alteração no Supabase nem nas chaves de ambiente. A rota API antiga foi mantida no projeto, mas os botões acima não a utilizam mais.
