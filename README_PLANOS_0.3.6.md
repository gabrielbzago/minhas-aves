# Minhas Aves 0.3.6 — Descoberta de planos

## Alteração principal
Todos os módulos agora aparecem no menu lateral para todos os planos. O usuário pode explorar qualquer módulo.

Quando o módulo exige um plano superior:
- a navegação continua funcionando;
- o sistema não abre o recurso premium;
- aparece uma tela central explicando que o recurso está bloqueado;
- mostra o plano exigido;
- mostra os principais benefícios daquele plano;
- mostra o preço anual configurado;
- oferece botão **Fazer upgrade agora**, direcionando diretamente para `/api/stripe/checkout?plan=...`;
- oferece comparação completa em Assinatura.

A autorização real continua baseada em `hasFeature()` no servidor. A mudança é de UX/discovery: ocultar módulos não é mais usado como mecanismo de venda.
