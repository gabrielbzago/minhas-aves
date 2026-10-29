# Minhas Aves v0.3.1 — correção de visibilidade do plantel

Esta versão corrige um problema introduzido pela migration de transferências em que aves reais poderiam deixar de aparecer no plantel por causa do campo `is_genealogy_reference`.

## O que foi corrigido

- Novas aves criadas pelo usuário recebem explicitamente `is_genealogy_reference = false`.
- A lista do plantel aceita `false` e `NULL` para manter compatibilidade com registros antigos.
- A API de aves usa a mesma regra.
- A página do plantel agora mostra o erro real do Supabase em vez de simplesmente apresentar uma lista vazia.
- Foi adicionada uma migration de reparo que transforma em aves reais os registros que não são referências genealógicas de transferência.
- Referências genealógicas legítimas continuam identificadas por `source_bird_id`/`transfer_origin_id`.

## Supabase

Execute uma vez:

`supabase/migration_fix_plantel_visibility.sql`

Depois reinicie o Next.js:

`npm run dev`
