# Apollo 0.5.71 — Correção do build da importação de anilhas

Corrigida a estrutura de fechamento do objeto `JSON.stringify` na chamada à API OpenAI em `app/api/rings/import-photo/route.ts`. O payload foi reformatado em múltiplas linhas para deixar explícitos os arrays `messages` e `content`.

A lógica de OCR, limites de plano, validação de duplicidades e gravação em lote foi preservada. Não há alteração de banco de dados nem SQL.
