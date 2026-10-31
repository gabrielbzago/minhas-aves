# Apollo 0.5.50 — Mutações e identificação dos cartões

## Alterações
- Cadastro e edição de aves: checkbox Mutação e seletor com Lutino, Branco, Preto, Canela, Diluido, Laranjeira e Ardesiaca.
- Cartão dobrável: nome científico sozinho abaixo do nome da ave; campo renomeado para Nome popular.
- Cartão individual e placas de gaiola: estrela colorida no canto superior direito com legenda Mutação e o nome da mutação.
- Cabeçalho de impressão informa 140 × 100 mm aberto, 70 × 100 mm fechado e até 4 por A4 paisagem, coerente com o CSS de impressão.
- Transferência genealógica preserva a mutação.

## SQL
Execute `supabase/migration_mutacao_aves_0_5_50.sql` no Supabase antes de publicar.

Impressão: A4 paisagem, escala 100% / tamanho real, sem ajustar à página.
