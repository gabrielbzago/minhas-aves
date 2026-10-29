-- Minhas Aves — REGRAS FREE + IMPRESSÃO + PLANO LENDA
-- Execute depois das migrations existentes.
-- Google OAuth é configurado no Supabase Dashboard; este arquivo não contém credenciais.

-- 1) Crachá/cartão é recurso pago.
create or replace function public.check_module_feature()
returns trigger
language plpgsql security definer set search_path=public
as $$
declare p text; required text;
begin
  select plan into p from public.profiles where id = new.user_id;
  p := coalesce(p,'free');

  required := case
    when new.module_code in ('gestao-ave','historico-ave','genealogia','painel','especies') then 'free'
    when new.module_code in ('importacao-anilha','gestao-anilhas','galeria-fotos','gestao-documentos','gestao-gaiola','comportamento') then 'amador'
    else 'profissional'
  end;

  if required='amador' and p='free' then
    raise exception 'RECURSO_DO_PLANO: este recurso está disponível nos planos pagos.';
  end if;

  if required='profissional' and p not in ('profissional','lenda') then
    raise exception 'RECURSO_DO_PLANO: assine o Criatório Profissional para usar este módulo.';
  end if;

  return new;
end;
$$;

-- 2) Aves: free = até 5; qualquer plano pago = ilimitado.
create or replace function public.check_bird_limit()
returns trigger
language plpgsql security definer set search_path=public
as $$
declare current_plan text; current_count integer; max_allowed integer; bonus integer;
begin
  select plan, coalesce(bonus_birds,0) into current_plan, bonus
  from public.profiles where id=new.user_id;

  current_plan := coalesce(current_plan,'free');
  max_allowed := case when current_plan='free' then 5+coalesce(bonus,0) else null end;

  if max_allowed is not null then
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select count(*) into current_count from public.birds where user_id=new.user_id;
    if current_count >= max_allowed then
      raise exception 'LIMITE_DE_AVES_ATINGIDO: o plano grátis permite até % aves.', max_allowed;
    end if;
  end if;
  return new;
end;
$$;

-- 3) Reforço da regra para registros de crachá.
drop trigger if exists enforce_module_feature on public.bird_module_records;
create trigger enforce_module_feature
before insert or update on public.bird_module_records
for each row execute procedure public.check_module_feature();

-- 4) Garanta que o plano Lenda continue aceito quando a migration anterior já criou o check.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid='public.profiles'::regclass
      and conname='profiles_plan_check'
  ) then
    alter table public.profiles drop constraint profiles_plan_check;
  end if;
exception when undefined_object then null;
end $$;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free','amador','profissional','lenda'));

-- Google OAuth:
-- Supabase Dashboard > Authentication > Providers > Google:
-- habilite Google e informe Client ID + Client Secret.
-- Authorized redirect URI do Google:
-- https://SEU-PROJETO.supabase.co/auth/v1/callback
-- Para desenvolvimento, use também o callback local do Supabase conforme exibido no Dashboard.
