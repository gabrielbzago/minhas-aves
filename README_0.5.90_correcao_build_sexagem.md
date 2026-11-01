# Apollo 0.5.90 — Correção TS da Gestão de Sexagem

- Corrigido o objeto de atualização dos campos do formulário de nascimento.
- Os valores padrão são inicializados apenas quando ainda não existe rascunho; atualizações posteriores preservam os demais campos.
- Eliminadas as propriedades duplicadas `name`, `birth_date`, `father_id` e `mother_id` que bloqueavam o TypeScript.
- Mantidas as funcionalidades de nascimento, aplicação da anilha e gráfico por matriz.
- Sem alteração de SQL.
