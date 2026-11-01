# Apollo 0.5.92 — Nascimento integrado ao plantel

- Ao declarar nascimento pela Gestão de Sexagem, o Apollo valida no servidor se a anilha ainda está disponível e se pai/mãe pertencem ao plantel, têm os sexos corretos e são compatíveis com a espécie.
- O filhote é criado como ave real do plantel (`is_genealogy_reference = false`), com nome, data de nascimento, espécie, pai, mãe e sexo inicialmente indefinido.
- A anilha é aplicada à ficha do filhote; o registro de estoque passa para `aplicada`, recebe `applied_to_bird_id` e mantém os mesmos vínculos de pai, mãe e espécie.
- Se a aplicação da anilha falhar, o cadastro do filhote é revertido e o estoque permanece disponível.
- Após o sucesso, a tela atualiza a lista de anilhas e atualiza os dados do plantel. O estoque de anilhas abre filtrado em Disponíveis; o histórico de aplicadas continua acessível em “Todas (inclui histórico)”.

Não requer nova migração SQL; utiliza a função `apply_ring_to_bird` já existente na migração de Gestão de Anilhas.
