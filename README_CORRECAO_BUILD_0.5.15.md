# Apollo v0.5.15 — correção de sintaxe

- Corrigido o literal de expressão regular em `lib/supabase/auth-redirect.ts`.
- A expressão correta para remover barras finais da URL é `.replace(/\\/+$/, "")` no código-fonte TypeScript.
- Testado o padrão em Node.js com `https://minhasaves.com.br///`, resultando em `https://minhasaves.com.br/auth/confirm`.
- Não foram alteradas configurações do Supabase nem chaves.
- Dependências não estão instaladas neste ambiente; execute `npm install` e `npm run build` após extrair.
