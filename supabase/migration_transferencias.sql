-- ============================================================
-- Minhas Aves — TRANSFERÊNCIA DE AVE ENTRE CRIADORES
-- Execute depois do schema.sql e das migrations existentes.
-- A transferência usa CPF para localizar o destinatário e exige
-- confirmação do criador que receberá a ave.
-- ============================================================

alter table public.profiles add column if not exists cpf text;

-- CPF armazenado somente com dígitos. A aplicação também valida o dígito verificador.
create unique index if not exists profiles_cpf_unique_idx
  on public.profiles(cpf)
  where cpf is not null and cpf <> '';

alter table public.birds add column if not exists is_genealogy_reference boolean not null default false;
alter table public.birds add column if not exists source_bird_id uuid references public.birds(id) on delete set null;
alter table public.birds add column if not exists source_owner_id uuid references auth.users(id) on delete set null;
alter table public.birds add column if not exists transfer_origin_id uuid;

-- Reparo de compatibilidade: aves reais existentes antes desta migration
-- não podem desaparecer do plantel por causa do novo campo genealógico.
-- Referências criadas pela transferência possuem source_bird_id/transfer_origin_id.
update public.birds
   set is_genealogy_reference = false
 where coalesce(is_genealogy_reference, false) = false
    or (is_genealogy_reference = true and source_bird_id is null and transfer_origin_id is null);


create index if not exists birds_genealogy_reference_idx
  on public.birds(user_id, is_genealogy_reference);
create index if not exists birds_source_bird_idx
  on public.birds(source_bird_id);

create table if not exists public.bird_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  bird_id uuid not null references public.birds(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  recipient_cpf text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  scope text not null default 'bird_and_genealogy',
  note text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz,
  constraint transfer_sender_recipient_different check (sender_id <> recipient_id)
);

create index if not exists bird_transfer_recipient_idx
  on public.bird_transfer_requests(recipient_id, status, created_at desc);
create index if not exists bird_transfer_sender_idx
  on public.bird_transfer_requests(sender_id, status, created_at desc);
create unique index if not exists bird_transfer_one_pending_per_bird_idx
  on public.bird_transfer_requests(bird_id)
  where status = 'pending';

create table if not exists public.bird_transfer_history (
  id uuid primary key default gen_random_uuid(),
  transfer_request_id uuid references public.bird_transfer_requests(id) on delete set null,
  bird_id uuid not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  transfer_date date not null default current_date,
  ancestor_count integer not null default 0,
  note text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists bird_transfer_history_bird_idx on public.bird_transfer_history(bird_id, created_at desc);
create index if not exists bird_transfer_history_sender_idx on public.bird_transfer_history(sender_id, created_at desc);
create index if not exists bird_transfer_history_recipient_idx on public.bird_transfer_history(recipient_id, created_at desc);

alter table public.bird_transfer_requests enable row level security;
alter table public.bird_transfer_history enable row level security;

drop policy if exists "transfer_request_read_participants" on public.bird_transfer_requests;
create policy "transfer_request_read_participants" on public.bird_transfer_requests
for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Solicitações são criadas e respondidas pelas funções seguras abaixo.
revoke insert, update, delete on public.bird_transfer_requests from anon, authenticated;
revoke insert, update, delete on public.bird_transfer_history from anon, authenticated;

drop policy if exists "transfer_history_read_participants" on public.bird_transfer_history;
create policy "transfer_history_read_participants" on public.bird_transfer_history
for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Garante que o limite de aves não conte cópias puramente genealógicas.
create or replace function public.check_bird_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text;
  current_count integer;
  max_allowed integer;
  bonus integer;
begin
  select plan, coalesce(bonus_birds,0)
    into current_plan, bonus
    from public.profiles
   where id = new.user_id;

  current_plan := coalesce(current_plan, 'free');
  if coalesce(new.is_genealogy_reference, false) then
    return new;
  end if;

  max_allowed := case when current_plan = 'free' then 5 + coalesce(bonus,0) else null end;

  if max_allowed is not null then
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select count(*) into current_count
      from public.birds
     where user_id = new.user_id
       and coalesce(is_genealogy_reference,false) = false;
    if current_count >= max_allowed then
      raise exception 'LIMITE_DE_AVES_ATINGIDO: o plano % permite até % aves.', current_plan, max_allowed;
    end if;
  end if;
  return new;
end;
$$;

-- Cria uma solicitação usando o CPF exato do destinatário.
create or replace function public.create_bird_transfer_request(
  p_bird_id uuid,
  p_recipient_cpf text,
  p_note text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_sender_cpf text;
  v_recipient uuid;
  v_cpf text;
  v_id uuid;
  v_bird public.birds;
begin
  if v_sender is null then raise exception 'PERMISSAO_NEGADA'; end if;

  v_cpf := regexp_replace(coalesce(p_recipient_cpf,''), '[^0-9]', '', 'g');
  if length(v_cpf) <> 11 then raise exception 'CPF_DESTINATARIO_INVALIDO'; end if;

  select cpf into v_sender_cpf from public.profiles where id=v_sender;
  if coalesce(regexp_replace(coalesce(v_sender_cpf,''),'[^0-9]','','g'),'') = '' then
    raise exception 'CPF_REMETENTE_NAO_CADASTRADO';
  end if;

  select * into v_bird
    from public.birds
   where id=p_bird_id and user_id=v_sender and coalesce(is_genealogy_reference,false)=false
   for update;
  if v_bird.id is null then raise exception 'AVE_NAO_ENCONTRADA'; end if;
  if v_bird.status <> 'ativo' then raise exception 'AVE_NAO_PODE_SER_TRANSFERIDA'; end if;

  select id into v_recipient
    from public.profiles
   where cpf=v_cpf
     and id<>v_sender
     and coalesce(role,'creator')='creator'
   limit 1;
  if v_recipient is null then raise exception 'CRIADOR_DESTINATARIO_NAO_ENCONTRADO'; end if;

  if exists(select 1 from public.bird_transfer_requests where bird_id=p_bird_id and status='pending') then
    raise exception 'TRANSFERENCIA_JA_PENDENTE';
  end if;

  insert into public.bird_transfer_requests(bird_id,sender_id,recipient_id,recipient_cpf,note)
  values(p_bird_id,v_sender,v_recipient,v_cpf,nullif(trim(coalesce(p_note,'')),''))
  returning id into v_id;

  return v_id;
end;
$$;
revoke all on function public.create_bird_transfer_request(uuid,text,text) from public;
grant execute on function public.create_bird_transfer_request(uuid,text,text) to authenticated;

-- Aceita a transferência e:
-- 1) move a ave real para o novo criador;
-- 2) copia todos os ancestrais para registros genealógicos, sem consumir plantel;
-- 3) mantém os descendentes do cedente apontando para um registro histórico da ave transferida;
-- 4) move módulos e histórico veterinário da ave real;
-- 5) registra auditoria da operação.
create or replace function public.respond_bird_transfer_request(
  p_request_id uuid,
  p_accept boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.bird_transfer_requests;
  b public.birds;
  v_ancestor_count integer := 0;
  v_sender_reference uuid := null;
  v_father_reference uuid := null;
  v_mother_reference uuid := null;
  v_bird_new_father uuid := null;
  v_bird_new_mother uuid := null;
  v_map record;
  v_new_id uuid;
  v_recipient_plan text;
  v_recipient_bonus integer;
  v_recipient_count integer;
begin
  if auth.uid() is null then raise exception 'PERMISSAO_NEGADA'; end if;

  select * into r
    from public.bird_transfer_requests
   where id=p_request_id
   for update;

  if r.id is null then raise exception 'TRANSFERENCIA_NAO_ENCONTRADA'; end if;
  if r.recipient_id <> auth.uid() then raise exception 'PERMISSAO_NEGADA'; end if;
  if r.status <> 'pending' then raise exception 'TRANSFERENCIA_NAO_PENDENTE'; end if;

  if not p_accept then
    update public.bird_transfer_requests
       set status='rejected', responded_at=now()
     where id=r.id;
    return jsonb_build_object('ok',true,'status','rejected');
  end if;

  select * into b
    from public.birds
   where id=r.bird_id and user_id=r.sender_id and coalesce(is_genealogy_reference,false)=false
   for update;
  if b.id is null then raise exception 'AVE_NAO_DISPONIVEL_PARA_TRANSFERENCIA'; end if;
  if b.status <> 'ativo' then raise exception 'AVE_NAO_PODE_SER_TRANSFERIDA'; end if;

  -- A transferência também respeita o limite do plano de quem recebe.
  select plan, coalesce(bonus_birds,0) into v_recipient_plan, v_recipient_bonus from public.profiles where id=r.recipient_id;
  if coalesce(v_recipient_plan,'free')='free' then
    select count(*) into v_recipient_count from public.birds where user_id=r.recipient_id and coalesce(is_genealogy_reference,false)=false;
    if v_recipient_count >= 5 + coalesce(v_recipient_bonus,0) then
      raise exception 'LIMITE_DE_AVES_DESTINATARIO';
    end if;
  end if;

  -- Se o cedente possui descendentes dessa ave, preserva uma referência histórica
  -- no plantel dele para não quebrar a árvore dos demais registros.
  if exists(select 1 from public.birds where user_id=r.sender_id and coalesce(is_genealogy_reference,false)=false and (father_id=b.id or mother_id=b.id)) then
    insert into public.birds(
      user_id,species_id,name,sex,birth_date,death_date,transfer_date,status,ring_number,
      ibama_registration_number,ibama_record_type,father_id,mother_id,genetic_line,genetics,
      breeder_matrix,notes,is_genealogy_reference,source_bird_id,source_owner_id,transfer_origin_id
    ) values (
      r.sender_id,b.species_id,b.name,b.sex,b.birth_date,b.death_date,b.transfer_date,b.status,b.ring_number,
      b.ibama_registration_number,b.ibama_record_type,b.father_id,b.mother_id,b.genetic_line,b.genetics,
      b.breeder_matrix,b.notes,true,b.id,r.sender_id,r.id
    ) returning id into v_sender_reference;

    update public.birds
       set father_id=case when father_id=b.id then v_sender_reference else father_id end,
           mother_id=case when mother_id=b.id then v_sender_reference else mother_id end
     where user_id=r.sender_id and coalesce(is_genealogy_reference,false)=false
       and (father_id=b.id or mother_id=b.id);
  end if;

  -- Mapa de todos os ancestrais da ave. As cópias são registros genealógicos,
  -- não contam como aves do plantel e não são transferências físicas.
  create temporary table if not exists transfer_map(
    old_id uuid primary key,
    new_id uuid not null
  ) on commit drop;
  truncate transfer_map;

  insert into transfer_map(old_id,new_id)
  with recursive ancestors(id) as (
    select father_id from public.birds where id=b.id and father_id is not null
    union
    select mother_id from public.birds where id=b.id and mother_id is not null
    union
    select p.father_id from public.birds p join ancestors a on p.id=a.id where p.father_id is not null
    union
    select p.mother_id from public.birds p join ancestors a on p.id=a.id where p.mother_id is not null
  )
  select id, gen_random_uuid() from ancestors;

  select count(*) into v_ancestor_count from transfer_map;

  insert into public.birds(
    id,user_id,species_id,name,sex,birth_date,death_date,transfer_date,status,ring_number,
    ibama_registration_number,ibama_record_type,father_id,mother_id,genetic_line,genetics,
    breeder_matrix,notes,is_genealogy_reference,source_bird_id,source_owner_id,transfer_origin_id
  )
  select
    m.new_id,r.recipient_id,src.species_id,src.name,src.sex,src.birth_date,src.death_date,null,src.status,src.ring_number,
    src.ibama_registration_number,src.ibama_record_type,
    fm.new_id,mm.new_id,src.genetic_line,src.genetics,src.breeder_matrix,src.notes,
    true,src.id,r.sender_id,r.id
  from public.birds src
  join transfer_map m on m.old_id=src.id
  left join transfer_map fm on fm.old_id=src.father_id
  left join transfer_map mm on mm.old_id=src.mother_id;

  select new_id into v_bird_new_father from transfer_map where old_id=b.father_id;
  select new_id into v_bird_new_mother from transfer_map where old_id=b.mother_id;

  -- Move a ave real, mantendo o mesmo ID e todos os seus vínculos.
  update public.birds
     set user_id=r.recipient_id,
         father_id=v_bird_new_father,
         mother_id=v_bird_new_mother,
         transfer_date=current_date,
         status='ativo',
         transfer_origin_id=r.id,
         is_genealogy_reference=false,
         source_bird_id=null,
         source_owner_id=null,
         updated_at=now()
   where id=b.id;

  update public.bird_module_records
     set user_id=r.recipient_id, updated_at=now()
   where bird_id=b.id and user_id=r.sender_id;

  update public.bird_media
     set user_id=r.recipient_id
   where bird_id=b.id and user_id=r.sender_id;

  update public.vet_consultations
     set creator_id=r.recipient_id, updated_at=now()
   where bird_id=b.id and creator_id=r.sender_id;

  insert into public.bird_module_records(user_id,bird_id,module_code,title,data,event_date)
  values(r.recipient_id,b.id,'historico-ave','Transferência recebida',jsonb_build_object(
    'tipo','transferencia_recebida','solicitacao',r.id,'cedente',r.sender_id,'observacao',r.note
  ),current_date);

  update public.bird_transfer_requests
     set status='accepted', responded_at=now(), completed_at=now()
   where id=r.id;

  insert into public.bird_transfer_history(
    transfer_request_id,bird_id,sender_id,recipient_id,transfer_date,ancestor_count,note,details
  ) values(
    r.id,b.id,r.sender_id,r.recipient_id,current_date,v_ancestor_count,r.note,
    jsonb_build_object('scope',r.scope,'sender_reference_id',v_sender_reference,'ancestor_count',v_ancestor_count)
  );

  return jsonb_build_object(
    'ok',true,
    'status','accepted',
    'bird_id',b.id,
    'ancestor_count',v_ancestor_count,
    'sender_reference_id',v_sender_reference
  );
end;
$$;
revoke all on function public.respond_bird_transfer_request(uuid,boolean) from public;
grant execute on function public.respond_bird_transfer_request(uuid,boolean) to authenticated;

-- Histórico de transferência pode ser consultado pelos participantes.
