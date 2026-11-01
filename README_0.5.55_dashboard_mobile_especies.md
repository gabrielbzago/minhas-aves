# Apollo 0.5.55 — Dashboard mobile e distribuição por espécie

## Alterações
- No celular, o dashboard de distribuição por sexo aparece no topo, logo após o cabeçalho.
- Criado gráfico de rosca de distribuição por espécie, independente do sexo.
- Todas as espécies presentes no plantel são exibidas na legenda, com cores distintas e percentuais.
- Os cartões de resumo numérico (aves no plantel, aves ativas, plano e limite) foram movidos para o final do dashboard somente em telas de até 700px.
- A disposição do dashboard em desktop não foi alterada.

## Dados e banco
- Usa os registros atuais de `birds` e a relação `species:species_id(common_name)`.
- Não adiciona tabelas, colunas, políticas ou migrations.
- Não altera dados existentes.
