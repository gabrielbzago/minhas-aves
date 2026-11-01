# Apollo 0.5.87 — Correção TypeScript da matriz

- Corrigida a tipagem de `mother_ring_number` na rota de importação por foto.
- Normalização segura do número da matriz antes da consulta.
- Verificação defensiva caso a matriz não esteja no mapa, evitando acesso a propriedades de `undefined`.
- Mantida a regra: cada anilha recebe a espécie e o vínculo da própria matriz; sexo inicial `indeterminado`, status `disponivel`.
- Sem alteração de SQL.
