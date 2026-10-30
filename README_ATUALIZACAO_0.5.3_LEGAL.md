# Minhas Aves / Apollo — v0.5.3

Atualização das páginas públicas e informações legais.

## O que entrou
- Política de Privacidade completa, com informações sobre LGPD, login Google, Supabase, Stripe, retenção, segurança, direitos e contato.
- Termos de Uso ampliados, com regras da plataforma, responsabilidade pelo conteúdo, planos anuais, pagamento e cancelamento.
- Página pública de Cancelamento e Reembolso, com procedimento de solicitação e direito de arrependimento legal de 7 dias.
- Página pública de Exclusão de Conta, acessível mesmo sem login.
- Links para todas as páginas no rodapé da landing page.
- Metadados SEO para as páginas legais.

## Rotas
- https://www.minhasaves.com.br/politica-privacidade
- https://www.minhasaves.com.br/termos
- https://www.minhasaves.com.br/cancelamento
- https://www.minhasaves.com.br/excluir-conta

## Atenção antes do deploy
A página de exclusão é um canal público por e-mail, não um mecanismo automático de exclusão. Confirme o e-mail de suporte e complete os dados jurídicos do controlador que forem aplicáveis. Leia `docs/PUBLICACAO_LEGAL_E_GOOGLE.md`.

O build não foi executado neste ambiente: a dependência `next` não está instalada em `node_modules`. Execute `npm ci` e `npm run build` no ambiente local/CI antes de publicar.
