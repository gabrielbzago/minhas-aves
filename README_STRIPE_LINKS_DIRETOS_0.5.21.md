# Apollo 0.5.21 — botões Assinar sem login

Os botões da homepage, painel de assinatura e upsell de recursos agora apontam DIRETAMENTE para os três Payment Links do Stripe fornecidos pelo proprietário. Não passam mais por /api/stripe/checkout e não exigem login para abrir o pagamento.

Amador: https://buy.stripe.com/eVqbJ096F9U6aRjdz41B600
Profissional: https://buy.stripe.com/cNieVcdmV5DQe3v3Yu1B601
Lenda: https://buy.stripe.com/dRm14m1Ed5DQgbD7aG1B602

ATENÇÃO — limite do webhook existente:
O webhook de checkout.session.completed atualmente espera `client_reference_id` com UUID do usuário e plano, ou metadados user_id e plan. Payment Links estáticos abertos por visitantes NÃO fornecem esses identificadores automaticamente. Portanto o webhook NÃO conseguirá atualizar o perfil de um visitante anônimo somente com este ajuste. A compra será realizada no Stripe, mas a ativação automática no Supabase para novos compradores exige um fluxo adicional de vinculação segura da conta após pagamento. Não vincule assinatura a contas existentes apenas por coincidência de e-mail sem confirmação de posse da conta.

As demais rotas Stripe e a migration 0.5.18 foram preservadas. Não foi feito build completo nesta sessão.
