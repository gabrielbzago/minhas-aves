# Apollo 0.5.74 — Correção TypeScript na importação de anilhas

Corrige o narrowing de `mother_ring_number` ao montar a lista de matrizes na API `app/api/rings/import-photo/route.ts`. A lista é tipada explicitamente como `string[]` e filtra valores ausentes/vazios com um type predicate. Não altera regras de vínculo, permissões ou limites de plano.
