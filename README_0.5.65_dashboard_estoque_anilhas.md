# Apollo 0.5.65 — Dashboard de estoque de anilhas

- Painel de estoque agrupado por espécie, com total, disponíveis e aplicadas.
- Barras proporcionais para visualizar a composição do estoque por espécie.
- Painel de matrizes/fêmeas: mostra os números das anilhas vinculadas a cada mãe cadastrada na anilha.
- Indicadores calculados a partir dos registros existentes em `ring_inventory`; não exige migração SQL.
- Mantém cadastro, aplicação, baixa, filtros e alteração de sexo existentes.

Atualização visual/consulta; nenhuma alteração de schema ou variável de ambiente.
