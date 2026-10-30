# Apollo 0.5.21 — links diretos de assinatura
Os botões de assinatura da página inicial, painel Assinatura e módulos bloqueados apontam diretamente aos Payment Links fornecidos. Não exigem login para abrir o Stripe.
Amador: https://buy.stripe.com/eVqbJ096F9U6aRjdz41B600
Profissional: https://buy.stripe.com/cNieVcdmV5DQe3v3Yu1B601
Lenda: https://buy.stripe.com/dRm14m1Ed5DQgbD7aG1B602

ATENÇÃO: o webhook existente requer user_id nos metadados ou client_reference_id para vincular uma compra ao perfil Supabase. Os Payment Links estáticos NÃO fornecem esse identificador para visitantes anônimos. Portanto a atualização automática do perfil após compra anônima NÃO está garantida. É necessário implementar uma etapa de associação segura pós-pagamento. Não associe uma conta somente pelo e-mail informado no checkout.
