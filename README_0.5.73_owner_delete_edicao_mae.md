# Apollo 0.5.73 — edição de matriz e exclusão Owner

- Estoque de anilhas: permite alterar manualmente a matriz vinculada a cada anilha, inclusive remover o vínculo. A API valida propriedade da ave, sexo feminino, espécie e evita referências genealógicas.
- Plantel: Owner pode selecionar uma ou várias aves e excluí-las do próprio plantel com confirmação explícita. Endpoint valida role/email Owner no servidor e restringe a exclusão ao user_id autenticado.
- Não altera dados de outras contas e não adiciona SQL.
- Build Next.js não executado neste ambiente.
