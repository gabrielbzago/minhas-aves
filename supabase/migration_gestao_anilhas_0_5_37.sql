-- Apollo 0.5.37: estoque individual e aplicação rastreável de anilhas
create table if not exists public.ring_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ring_number text not null,
  species_id uuid references public.species(id) on delete set null,
  father_id uuid references public.birds(id) on delete set null,
  mother_id uuid references public.birds(id) on delete set null,
  sex text not null default 'indeterminado' check (sex in ('indeterminado','macho','femea')),
  status text not null default 'disponivel' check (status in ('disponivel','aplicada','cancelada')),
  notes text,
  applied_to_bird_id uuid references public.birds(id) on delete set null,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ring_inventory_unique_per_user unique(user_id, ring_number),
  constraint ring_inventory_parents_distinct check (father_id is null or mother_id is null or father_id <> mother_id)
);
create unique index if not exists ring_inventory_number_normalized_idx on public.ring_inventory(user_id, lower(btrim(ring_number)));
create index if not exists ring_inventory_user_status_idx on public.ring_inventory(user_id,status);
create index if not exists ring_inventory_species_idx on public.ring_inventory(user_id,species_id);
create index if not exists ring_inventory_bird_idx on public.ring_inventory(applied_to_bird_id);
alter table public.ring_inventory enable row level security;
drop policy if exists ring_inventory_select_own on public.ring_inventory;
create policy ring_inventory_select_own on public.ring_inventory for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists ring_inventory_insert_own on public.ring_inventory;
create policy ring_inventory_insert_own on public.ring_inventory for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists ring_inventory_update_own on public.ring_inventory;
create policy ring_inventory_update_own on public.ring_inventory for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists ring_inventory_delete_own on public.ring_inventory;
create policy ring_inventory_delete_own on public.ring_inventory for delete to authenticated using ((select auth.uid())=user_id);
drop trigger if exists ring_inventory_updated_at on public.ring_inventory;
create trigger ring_inventory_updated_at before update on public.ring_inventory
for each row execute procedure public.set_updated_at();

-- A aplicação é transacional: reserva a anilha, atualiza a ave e grava o vínculo.
create or replace function public.apply_ring_to_bird(p_ring_id uuid, p_bird_id uuid, p_sex text default null)
returns public.ring_inventory
language plpgsql
security invoker
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_ring public.ring_inventory;
  v_bird public.birds;
begin
  if v_user is null then raise exception 'Sessão inválida.'; end if;
  select * into v_ring from public.ring_inventory
    where id=p_ring_id and user_id=v_user for update;
  if not found then raise exception 'Anilha não encontrada no estoque.'; end if;
  if v_ring.status <> 'disponivel' then raise exception 'Esta anilha não está disponível.'; end if;
  select * into v_bird from public.birds where id=p_bird_id and user_id=v_user for update;
  if not found then raise exception 'Filhote não encontrado no plantel.'; end if;
  if v_bird.ring_number is not null and btrim(v_bird.ring_number) <> '' then
    raise exception 'Esta ave já possui uma anilha cadastrada.';
  end if;
  if v_ring.species_id is not null and v_bird.species_id is distinct from v_ring.species_id then
    raise exception 'A espécie da ave não corresponde à espécie da anilha.';
  end if;
  if p_sex is not null and p_sex not in ('indeterminado','macho','femea') then
    raise exception 'Sexo inválido.';
  end if;
  update public.birds set ring_number=v_ring.ring_number,
    father_id=coalesce(v_bird.father_id,v_ring.father_id),
    mother_id=coalesce(v_bird.mother_id,v_ring.mother_id),
    sex=coalesce(p_sex,v_bird.sex)
    where id=p_bird_id and user_id=v_user;
  update public.ring_inventory set status='aplicada',applied_to_bird_id=p_bird_id,applied_at=now(),
    sex=coalesce(p_sex,'indeterminado')
    where id=p_ring_id returning * into v_ring;
  return v_ring;
end;
$$;

create or replace function public.update_ring_sex(p_ring_id uuid,p_sex text)
returns public.ring_inventory
language plpgsql
security invoker
set search_path=public
as $$
declare v_user uuid := auth.uid(); v_ring public.ring_inventory;
begin
  if v_user is null then raise exception 'Sessão inválida.'; end if;
  if p_sex not in ('indeterminado','macho','femea') then raise exception 'Sexo inválido.'; end if;
  update public.ring_inventory set sex=p_sex
   where id=p_ring_id and user_id=v_user returning * into v_ring;
  if not found then raise exception 'Anilha não encontrada.'; end if;
  if v_ring.applied_to_bird_id is not null then
    update public.birds set sex=p_sex where id=v_ring.applied_to_bird_id and user_id=v_user;
  end if;
  return v_ring;
end;
$$;
grant execute on function public.apply_ring_to_bird(uuid,uuid,text) to authenticated;
grant execute on function public.update_ring_sex(uuid,text) to authenticated;


-- Garante que pai e mãe vinculados ao lote/anilha pertencem ao mesmo criador.
create or replace function public.validate_ring_inventory_parents()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.father_id is not null and not exists (
    select 1 from public.birds where id=new.father_id and user_id=new.user_id
  ) then raise exception 'O pai selecionado não pertence ao seu plantel.'; end if;
  if new.mother_id is not null and not exists (
    select 1 from public.birds where id=new.mother_id and user_id=new.user_id
  ) then raise exception 'A mãe selecionada não pertence ao seu plantel.'; end if;
  return new;
end;
$$;
drop trigger if exists ring_inventory_validate_parents on public.ring_inventory;
create trigger ring_inventory_validate_parents before insert or update of father_id,mother_id,user_id
on public.ring_inventory for each row execute procedure public.validate_ring_inventory_parents();

-- Se o criador definir/corrigir o sexo diretamente na ficha da ave, mantém o estoque histórico sincronizado.
create or replace function public.sync_applied_ring_sex()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.sex is distinct from old.sex then
    update public.ring_inventory
      set sex=new.sex::text
      where applied_to_bird_id=new.id and user_id=new.user_id
        and new.sex::text in ('indeterminado','macho','femea');
  end if;
  return new;
end;
$$;
drop trigger if exists birds_sync_applied_ring_sex on public.birds;
create trigger birds_sync_applied_ring_sex after update of sex on public.birds
for each row execute procedure public.sync_applied_ring_sex();
