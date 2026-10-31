-- Minhas Aves Apollo 0.5.37 — Estoque individual e aplicação de anilhas
-- Execute no Supabase SQL Editor uma única vez.

create table if not exists public.bird_ring_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ring_number text not null,
  species_id uuid references public.species(id) on delete set null,
  father_id uuid references public.birds(id) on delete set null,
  mother_id uuid references public.birds(id) on delete set null,
  notes text,
  status text not null default 'available' check (status in ('available','applied')),
  sex public.bird_sex not null default 'indeterminado',
  bird_id uuid references public.birds(id) on delete set null,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  constraint bird_ring_inventory_number_not_blank check (btrim(ring_number) <> ''),
  constraint bird_ring_inventory_parents_distinct check (father_id is null or mother_id is null or father_id <> mother_id)
);

create unique index if not exists bird_ring_inventory_number_unique_idx
  on public.bird_ring_inventory (regexp_replace(upper(btrim(ring_number)), E'\\s+', '', 'g'));
create unique index if not exists bird_ring_inventory_bird_unique_idx
  on public.bird_ring_inventory (bird_id) where bird_id is not null;
create index if not exists bird_ring_inventory_user_status_idx
  on public.bird_ring_inventory(user_id,status,created_at desc);

alter table public.bird_ring_inventory enable row level security;
drop policy if exists bird_ring_inventory_select_own on public.bird_ring_inventory;
drop policy if exists bird_ring_inventory_insert_own on public.bird_ring_inventory;
drop policy if exists bird_ring_inventory_update_own on public.bird_ring_inventory;
drop policy if exists bird_ring_inventory_delete_own on public.bird_ring_inventory;
create policy bird_ring_inventory_select_own on public.bird_ring_inventory for select to authenticated using (auth.uid() = user_id);
create policy bird_ring_inventory_insert_own on public.bird_ring_inventory for insert to authenticated with check (auth.uid() = user_id);
create policy bird_ring_inventory_update_own on public.bird_ring_inventory for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy bird_ring_inventory_delete_own on public.bird_ring_inventory for delete to authenticated using (auth.uid() = user_id and status = 'available');

grant select,insert,update,delete on public.bird_ring_inventory to authenticated;

-- Impede cadastro no estoque de número que já esteja aplicado a uma ave real.
create or replace function public.guard_bird_ring_inventory_number()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.birds b
    where coalesce(b.is_genealogy_reference,false)=false
      and b.ring_number is not null
      and regexp_replace(upper(btrim(b.ring_number)), E'\\s+', '', 'g') = regexp_replace(upper(btrim(new.ring_number)), E'\\s+', '', 'g')
  ) then
    raise exception 'Este número de anilha já está aplicado a uma ave.';
  end if;
  return new;
end;
$$;
drop trigger if exists bird_ring_inventory_number_guard on public.bird_ring_inventory;
create trigger bird_ring_inventory_number_guard before insert or update of ring_number on public.bird_ring_inventory for each row execute function public.guard_bird_ring_inventory_number();


-- Também bloqueia que uma anilha reservada no estoque seja digitada manualmente no plantel.
create or replace function public.guard_bird_ring_against_inventory()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.ring_number is not null and btrim(new.ring_number)<>'' and exists (
    select 1 from public.bird_ring_inventory i
    where regexp_replace(upper(btrim(i.ring_number)), E'\\s+', '', 'g') = regexp_replace(upper(btrim(new.ring_number)), E'\\s+', '', 'g')
      and not (i.status='applied' and i.bird_id=new.id)
  ) then
    raise exception 'Este número de anilha está reservado no estoque de anilhas.';
  end if;
  return new;
end; $$;
drop trigger if exists birds_ring_inventory_guard on public.birds;
create trigger birds_ring_inventory_guard before insert or update of ring_number on public.birds for each row execute function public.guard_bird_ring_against_inventory();

-- Aplicação transacional: cria o filhote ou vincula ave existente e baixa a anilha
-- na mesma transação. Se qualquer validação falhar, nada é alterado.
create or replace function public.apply_bird_ring(
  p_ring_id uuid,
  p_bird_id uuid default null,
  p_name text default null,
  p_birth_date date default null,
  p_sex public.bird_sex default 'indeterminado'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ring public.bird_ring_inventory%rowtype;
  v_bird_id uuid;
  v_name text;
begin
  if v_user is null then raise exception 'É necessário estar autenticado.'; end if;
  select * into v_ring from public.bird_ring_inventory
   where id=p_ring_id and user_id=v_user for update;
  if not found then raise exception 'Anilha não encontrada no seu estoque.'; end if;
  if v_ring.status <> 'available' then raise exception 'Esta anilha já foi aplicada.'; end if;
  if p_sex not in ('macho','femea','indeterminado') then raise exception 'Sexo inválido.'; end if;
  if v_ring.father_id is not null and not exists(select 1 from public.birds where id=v_ring.father_id and user_id=v_user) then raise exception 'O pai selecionado não pertence ao seu criatório.'; end if;
  if v_ring.mother_id is not null and not exists(select 1 from public.birds where id=v_ring.mother_id and user_id=v_user) then raise exception 'A mãe selecionada não pertence ao seu criatório.'; end if;

  if p_bird_id is null then
    v_bird_id := gen_random_uuid();
    update public.bird_ring_inventory set status='applied',bird_id=v_bird_id,sex=p_sex,applied_at=now() where id=p_ring_id and user_id=v_user;
    v_name := nullif(btrim(p_name),'');
    if v_name is null then raise exception 'Informe o nome ou identificação do filhote.'; end if;
    insert into public.birds(id,user_id,species_id,name,sex,birth_date,status,ring_number,father_id,mother_id)
    values(v_bird_id,v_user,v_ring.species_id,v_name,p_sex,p_birth_date,'ativo',v_ring.ring_number,v_ring.father_id,v_ring.mother_id);
  else
    select id into v_bird_id from public.birds
     where id=p_bird_id and user_id=v_user and coalesce(is_genealogy_reference,false)=false
       and (ring_number is null or btrim(ring_number)='')
     for update;
    if v_bird_id is null then raise exception 'Ave não encontrada, não pertence ao seu criatório ou já possui anilha.'; end if;
    update public.bird_ring_inventory set status='applied',bird_id=v_bird_id,sex=p_sex,applied_at=now() where id=p_ring_id and user_id=v_user;
    update public.birds set ring_number=v_ring.ring_number,
      species_id=coalesce(v_ring.species_id,species_id),
      father_id=coalesce(v_ring.father_id,father_id),
      mother_id=coalesce(v_ring.mother_id,mother_id),
      sex=p_sex,
      birth_date=coalesce(p_birth_date,birth_date)
    where id=v_bird_id and user_id=v_user;
  end if;

  return jsonb_build_object('bird_id',v_bird_id,'ring_number',v_ring.ring_number,'status','applied');
end;
$$;
revoke all on function public.apply_bird_ring(uuid,uuid,text,date,public.bird_sex) from public;
grant execute on function public.apply_bird_ring(uuid,uuid,text,date,public.bird_sex) to authenticated;


-- Permite definir ou corrigir o sexo posteriormente, inclusive após a aplicação.
create or replace function public.set_bird_ring_sex(p_ring_id uuid,p_sex public.bird_sex)
returns void language plpgsql security invoker set search_path=public as $$
declare v_ring public.bird_ring_inventory%rowtype; v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'É necessário estar autenticado.'; end if;
  if p_sex not in ('macho','femea','indeterminado') then raise exception 'Sexo inválido.'; end if;
  select * into v_ring from public.bird_ring_inventory where id=p_ring_id and user_id=v_user for update;
  if not found then raise exception 'Anilha não encontrada.'; end if;
  update public.bird_ring_inventory set sex=p_sex where id=p_ring_id and user_id=v_user;
  if v_ring.status='applied' and v_ring.bird_id is not null then
    update public.birds set sex=p_sex where id=v_ring.bird_id and user_id=v_user;
  end if;
end; $$;
revoke all on function public.set_bird_ring_sex(uuid,public.bird_sex) from public;
grant execute on function public.set_bird_ring_sex(uuid,public.bird_sex) to authenticated;
