# Apollo 0.5.91 — Correção definitiva do TS2783

- O rascunho por anilha agora é inicializado com valores padrão somente quando ainda não existe.
- A atualização subsequente aplica apenas o campo alterado, sem declarar novamente `name`, `birth_date`, `father_id` ou `mother_id`.
- Elimina a origem do TS2783 na função `setDraft`.
- Preserva os demais campos digitados pelo usuário.
- Nenhuma alteração de SQL.
