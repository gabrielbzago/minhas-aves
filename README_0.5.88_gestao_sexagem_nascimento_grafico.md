# Apollo 0.5.88 — Gestão de Sexagem, nascimento e gráfico por matriz

- A Gestão de Sexagem lista anilhas cujo sexo permanece `indeterminado`.
- O painel resume o total de anilhas indefinidas, disponíveis e já aplicadas.
- Gráfico de barras por matriz, com divisão entre anilhas disponíveis e aplicadas.
- Para cada anilha disponível, permite declarar nascimento, informar nome e data, e vincular pai e mãe.
- A seleção de pai e mãe respeita o sexo cadastrado e filtra pela espécie da anilha quando conhecida.
- O cadastro do filhote usa `POST /api/birds` com `ring_inventory_id`, acionando a aplicação transacional existente `apply_ring_to_bird`.
- O filhote e a anilha permanecem com sexo `indeterminado` até o resultado de sexagem.
- Para anilhas aplicadas, a tela permite registrar o resultado macho/fêmea pela RPC `update_ring_sex`, sincronizando o sexo da ave e da anilha.
- Sem migração SQL.
