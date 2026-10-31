# Apollo 0.5.43 — Correção ao editar aves

## Problema corrigido
O formulário de edição enviava `ring_inventory_id` junto com os dados da ave. Esse campo é auxiliar do formulário/fluxo de cadastro e não existe na tabela `public.birds`. A rota PATCH repassava o campo ao Supabase, causando erro ao atualizar uma ave.

## Correção
- A rota `PATCH /api/birds` remove `ring_inventory_id` antes do UPDATE.
- Campos internos de transferência/referência genealógica não são alterados pelo formulário comum.
- A edição mantém o vínculo de propriedade com o usuário autenticado.

## SQL
Não é necessário executar SQL para esta correção.

## Validação
Inspeção estática da rota, formulário e schema `public.birds`. Não foi possível executar `npm run build` nem testar contra o Supabase neste ambiente; valide em homologação antes da publicação.
