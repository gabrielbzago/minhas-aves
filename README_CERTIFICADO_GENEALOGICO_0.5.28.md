# Apollo 0.5.28 — Certificado genealógico ampliado

- Novo endpoint autenticado `/api/print/certificado/[id]`.
- Certificado individual A4 paisagem para qualquer ave do próprio usuário.
- Árvore genealógica com quatro gerações de ancestrais: pais, avós, bisavós e trisavós.
- Todos os espaços genealógicos são exibidos mesmo quando não há registro; os campos vazios mostram `Não informado`.
- Acesso exclusivo a Criatório Amador, Profissional e Lenda; Free recebe HTTP 403 também no endpoint.
- Atalhos no plantel, ficha individual e página de genealogia.
- Cartão dobrável atualizado para mostrar pais, avós, bisavós e trisavós, com espaços vazios visíveis.
- Mantido o fluxo de autenticação Google, perfil e assinatura da versão 0.5.27.

Impressão: A4 paisagem, escala 100%, margens padrão do navegador desativadas.
