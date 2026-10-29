# Minhas Aves v0.4.2 — Veterinário/Owner Preview

Correção do modo de simulação do Owner.

- A lista agora inclui perfis ativos que podem possuir plantel.
- O próprio usuário Owner aparece no seletor para teste.
- A busca funciona por nome, criatório, CPF, cidade e UF.
- O plantel é carregado após selecionar o usuário.
- O Owner pode registrar consulta em modo de teste inclusive para a própria conta.
- **Na versão 0.4.3 isso foi ampliado:** o veterinário parceiro atende qualquer criador ativo, inclusive consultas particulares.
- Nenhuma migration nova é necessária.


> Para o comportamento atual, execute também `supabase/migration_veterinario_acesso_total_0_4_3.sql`.
