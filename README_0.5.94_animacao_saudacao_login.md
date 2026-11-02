# Apollo 0.5.94 — Saudação animada

- Adiciona uma animação breve e discreta ao emoji de cumprimento no dashboard.
- Executa uma única vez por autenticação na aba atual; atualizar a página ou navegar entre módulos não repete a animação.
- Uma nova tentativa de autenticação limpa a marca da sessão para permitir a animação no próximo login concluído.
- Respeita `prefers-reduced-motion` e mantém a saudação estática se `sessionStorage` estiver indisponível.
- Não altera dados, banco ou calendário. Nenhuma migração SQL necessária.
