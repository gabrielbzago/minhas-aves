# Apollo 0.5.46 — correção TypeScript do cartão individual

## Correção
Na rota `app/api/birds/card/[id]/route.ts`, a composição do perfil após `ensureAmadorTrialOnFirstUse` agora define explicitamente `ctf_number`, preservando o valor retornado pela consulta original ou usando `null` quando ausente. Isso evita que o spread deixe a propriedade opcional, incompatível com o tipo inferido pelo Supabase.

## Banco de dados
Nenhuma migration SQL adicional.

## Publicação
Substitua a versão anterior pelo conteúdo deste ZIP e execute um novo deploy na Vercel.

A compilação local não foi executada neste ambiente porque as dependências (`node_modules`) não estão instaladas. A correção foi aplicada diretamente ao ponto indicado pelo erro TypeScript.
