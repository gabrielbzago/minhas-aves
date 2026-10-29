-- ============================================================
-- Minhas Aves 0.4.4 — BÔNUS DE 3 MESES DO MÓDULO VETERINÁRIO
--
-- Regra comercial:
--   • SOMENTE contas novas recebem elegibilidade para o bônus.
--   • Ao contratar o Criatório Amador pela primeira vez, a conta
--     nova recebe 3 meses do Módulo Veterinário Completo.
--   • Depois do término, o módulo fica bloqueado no Amador.
--   • Profissional e Lenda possuem o módulo permanentemente.
--   • Veterinário parceiro e Owner não entram na promoção comercial.
--   • Contas existentes antes desta migration NÃO recebem o bônus.
-- ============================================================

alter table public.profiles
  add column if not exists vet_module_trial_eligible boolean not null default false;

alter table public.profiles
  add column if not exists vet_module_trial_started_at timestamptz;

alter table public.profiles
  add column if not exists vet_module_trial_ends_at timestamptz;

create index if not exists profiles_vet_module_trial_idx
  on public.profiles(vet_module_trial_eligible, vet_module_trial_ends_at);

-- Função chamada pelo webhook do Stripe depois que o plano Amador
-- foi confirmado. A operação é idempotente: o bônus nunca reinicia.
create or replace function public.start_vet_module_trial(p_user_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles;
  v_start timestamptz;
  v_end timestamptz;
begin
  select * into p from public.profiles where id = p_user_id for update;
  if p.id is null then
    return null;
  end if;

  if coalesce(p.role,'creator') <> 'creator' then
    return null;
  end if;

  if p.plan <> 'amador' then
    return null;
  end if;

  if not coalesce(p.vet_module_trial_eligible,false) then
    return null;
  end if;

  if p.vet_module_trial_started_at is not null then
    return p.vet_module_trial_ends_at;
  end if;

  v_start := now();
  v_end := v_start + interval '3 months';

  update public.profiles
     set vet_module_trial_started_at = v_start,
         vet_module_trial_ends_at = v_end,
         updated_at = now()
   where id = p_user_id;

  return v_end;
end;
$$;

revoke all on function public.start_vet_module_trial(uuid) from public;
grant execute on function public.start_vet_module_trial(uuid) to service_role;

-- Substitui o trigger de criação pelo último formato do projeto,
-- preservando CTF e habilitando a elegibilidade somente para NOVAS contas.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(
    id,
    full_name,
    criatorio_name,
    ctf_number,
    vet_module_trial_eligible
  )
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'criatorio_name',''),
    nullif(new.raw_user_meta_data->>'ctf_number',''),
    true
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(public.profiles.full_name,''), excluded.full_name),
    criatorio_name = coalesce(public.profiles.criatorio_name, excluded.criatorio_name),
    ctf_number = coalesce(public.profiles.ctf_number, excluded.ctf_number);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Regras do módulo persistente no banco para registros que eventualmente
-- usem bird_module_records.
create or replace function public.check_module_feature()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare p text; r text; trial_start timestamptz; trial_end timestamptz; allowed boolean := true;
begin
  select plan, role, vet_module_trial_started_at, vet_module_trial_ends_at
    into p, r, trial_start, trial_end
    from public.profiles where id=new.user_id;
  p := coalesce(p,'free');

  if new.module_code in ('gestao-ave','historico-ave','genealogia','painel','cartao-gaiola','especies') then
    allowed := true;
  elsif new.module_code in ('importacao-anilha','gestao-anilhas','galeria-fotos','gestao-documentos','gestao-gaiola','comportamento') then
    allowed := p in ('amador','profissional','lenda') or r in ('veterinarian','owner');
  elsif new.module_code = 'modulo-veterinario' then
    allowed := p in ('profissional','lenda')
      or r in ('veterinarian','owner')
      or (p='amador' and trial_start is not null and trial_end is not null and now() >= trial_start and now() < trial_end);
  elsif new.module_code in ('sms','reproducao','doencas','medicamentos','genotipagem','sexagem') then
    allowed := p in ('profissional','lenda') or r in ('veterinarian','owner');
  elsif new.module_code = 'consulta-veterinaria-inclusa' then
    allowed := p='lenda' or r in ('veterinarian','owner');
  end if;

  if not allowed then
    raise exception 'RECURSO_DO_PLANO: o módulo % não está disponível para este perfil.', new.module_code;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_module_feature on public.bird_module_records;
create trigger enforce_module_feature
before insert or update on public.bird_module_records
for each row execute procedure public.check_module_feature();
