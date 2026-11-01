# Apollo 0.5.86 — espécie automática por matriz

- Removida a exigência de uma única espécie para todo o lote.
- Cada linha exige a anilha da mãe/matriz correspondente.
- A tela mostra nome da matriz e espécie vinculada ao cadastro da ave.
- API valida a matriz no banco: deve existir, pertencer ao usuário, estar marcada como fêmea e possuir espécie.
- A espécie da anilha em estoque é copiada diretamente de `birds.species_id` da matriz correspondente.
- Cada anilha permanece com sexo `indeterminado` e status `disponivel`.
- Salvamento individual continua ativo, com progresso por registro e confirmação baseada no retorno do banco.
- Sem alteração de schema; não requer SQL.
