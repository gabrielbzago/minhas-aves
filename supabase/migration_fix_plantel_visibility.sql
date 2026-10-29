-- Minhas Aves — correção de visibilidade do plantel após a migration de transferências
-- Execute uma vez no Supabase SQL Editor.
-- Não altera proprietários nem dados das aves.

alter table public.birds
  add column if not exists is_genealogy_reference boolean not null default false;

-- Aves reais nunca devem ser ocultadas pelo marcador de referência genealógica.
-- As referências criadas pelo fluxo de transferência têm source_bird_id e/ou transfer_origin_id.
update public.birds
   set is_genealogy_reference = false
 where is_genealogy_reference is null
    or (is_genealogy_reference = true
        and source_bird_id is null
        and transfer_origin_id is null);

-- Garante que novas aves normais entrem sempre como aves reais do plantel.
alter table public.birds
  alter column is_genealogy_reference set default false;

