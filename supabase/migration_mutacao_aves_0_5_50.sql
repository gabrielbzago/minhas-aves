-- Apollo 0.5.50: identificação de mutações de aves
-- Campo opcional; NULL significa que a ave não foi marcada como mutação.
alter table public.birds add column if not exists mutation_type text;

alter table public.birds drop constraint if exists birds_mutation_type_check;
alter table public.birds add constraint birds_mutation_type_check
  check (mutation_type is null or mutation_type in (
    'Lutino','Branco','Preto','Canela','Diluido','Laranjeira','Ardesiaca'
  ));
