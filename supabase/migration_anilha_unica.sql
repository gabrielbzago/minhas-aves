-- Minhas Aves — ANILHA GLOBALMENTE ÚNICA
-- Execute uma vez no Supabase depois das migrations anteriores.
-- Regra: um número de anilha não pode pertencer a duas aves reais,
-- independentemente do criador, plano, status, arquivamento ou transferência.

alter table public.birds
  add column if not exists reference_ring_number text;

-- Referências genealógicas não são novas aves e não podem "reservar" uma anilha.
-- Preservamos a anilha original apenas como informação histórica da referência.
update public.birds
   set reference_ring_number = coalesce(reference_ring_number, ring_number),
       ring_number = null
 where coalesce(is_genealogy_reference, false) = true
   and ring_number is not null;

create or replace function public.capture_genealogy_reference_ring()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.is_genealogy_reference, false) then
    if new.ring_number is not null and btrim(new.ring_number) <> '' then
      new.reference_ring_number := coalesce(new.reference_ring_number, new.ring_number);
    end if;
    new.ring_number := null;
  end if;
  return new;
end;
$$;

drop trigger if exists birds_genealogy_reference_ring_trigger on public.birds;
create trigger birds_genealogy_reference_ring_trigger
before insert or update of ring_number, is_genealogy_reference
on public.birds
for each row execute function public.capture_genealogy_reference_ring();


create or replace function public.is_bird_ring_available(p_ring text, p_exclude uuid default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
      from public.birds
     where coalesce(is_genealogy_reference,false) = false
       and ring_number is not null
       and btrim(ring_number) <> ''
       and regexp_replace(upper(btrim(ring_number)), E'\\s+', '', 'g') = regexp_replace(upper(btrim(coalesce(p_ring,''))), E'\\s+', '', 'g')
       and (p_exclude is null or id <> p_exclude)
  );
$$;
revoke all on function public.is_bird_ring_available(text,uuid) from public;
grant execute on function public.is_bird_ring_available(text,uuid) to authenticated;

-- Se já houver duplicidade real no banco, a criação do índice falha de propósito.
-- Use a consulta abaixo para identificar os números conflitantes e corrigir os registros.
-- select regexp_replace(upper(btrim(ring_number)), E'\\s+', '', 'g') as anilha_normalizada,
--        count(*) as quantidade
-- from public.birds
-- where coalesce(is_genealogy_reference,false)=false
--   and ring_number is not null and btrim(ring_number)<>''
-- group by 1 having count(*) > 1;

create unique index if not exists birds_ring_number_global_unique_idx
on public.birds (
  regexp_replace(upper(btrim(ring_number)), E'\\s+', '', 'g')
)
where coalesce(is_genealogy_reference, false) = false
  and ring_number is not null
  and btrim(ring_number) <> '';

create index if not exists birds_ring_lookup_idx
on public.birds (regexp_replace(upper(btrim(ring_number)), E'\\s+', '', 'g'));
