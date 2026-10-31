-- Apollo 0.5.38: validação do vínculo genealógico das anilhas
-- Execute após migration_gestao_anilhas_0_5_37.sql.

create or replace function public.validate_ring_inventory_lineage()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_father public.birds;
  v_mother public.birds;
begin
  if new.species_id is null then
    raise exception 'Selecione uma espécie cadastrada no catálogo do Apollo.';
  end if;

  if new.father_id is not null then
    select * into v_father from public.birds
      where id=new.father_id and user_id=new.user_id;
    if not found then raise exception 'O pai selecionado não pertence ao seu plantel.'; end if;
    if v_father.sex::text <> 'macho' then raise exception 'O pai precisa estar cadastrado como macho.'; end if;
    if v_father.species_id is distinct from new.species_id then
      raise exception 'O pai precisa ser da mesma espécie da anilha.';
    end if;
  end if;

  if new.mother_id is not null then
    select * into v_mother from public.birds
      where id=new.mother_id and user_id=new.user_id;
    if not found then raise exception 'A mãe selecionada não pertence ao seu plantel.'; end if;
    if v_mother.sex::text <> 'femea' then raise exception 'A mãe precisa estar cadastrada como fêmea.'; end if;
    if v_mother.species_id is distinct from new.species_id then
      raise exception 'A mãe precisa ser da mesma espécie da anilha.';
    end if;
  end if;

  if new.father_id is not null and new.mother_id is not null and new.father_id=new.mother_id then
    raise exception 'Pai e mãe não podem ser a mesma ave.';
  end if;
  return new;
end;
$$;

drop trigger if exists ring_inventory_validate_lineage on public.ring_inventory;
create trigger ring_inventory_validate_lineage
before insert or update of species_id,father_id,mother_id,user_id
on public.ring_inventory
for each row execute procedure public.validate_ring_inventory_lineage();
