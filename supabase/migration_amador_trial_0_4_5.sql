-- ============================================================
-- Minhas Aves 0.4.5 — TESTE DE 30 DIAS DO CRIATÓRIO AMADOR
--
-- Regra comercial:
--   • A assinatura do Amador continua sendo paga.
--   • Usuários elegíveis recebem 30 dias de teste dos recursos
--     exclusivos do Amador, iniciados SOMENTE no primeiro uso.
--   • Depois de 30 dias, os dados permanecem intactos, mas os
--     recursos Amador ficam bloqueados até upgrade.
--   • Agendamento veterinário continua FREE.
--   • A consulta gratuita continua EXCLUSIVA do Lenda e não é
--     afetada por esta promoção.
--   • Veterinário parceiro e Owner não participam do trial.
--
-- Correção: remove a promoção anterior de 3 meses do módulo veterinário.
-- ============================================================

alter table public.profiles
  add column if not exists amador_trial_eligible boolean not null default false;

alter table public.profiles
  add column if not exists amador_trial_started_at timestamptz;

alter table public.profiles
  add column if not exists amador_trial_ends_at timestamptz;

-- Contas que receberam a elegibilidade da migration 0.4.4 continuam
-- elegíveis, mas agora para o teste correto de 30 dias.
update public.profiles
set amador_trial_eligible = true
where coalesce(vet_module_trial_eligible,false) = true
  and coalesce(role,'creator') = 'creator'
  and coalesce(plan,'free') = 'free';

-- A promoção veterinária antiga deixa de existir.
update public.profiles
set vet_module_trial_eligible = false,
    vet_module_trial_started_at = null,
    vet_module_trial_ends_at = null
where true;

create index if not exists profiles_amador_trial_idx
  on public.profiles(amador_trial_eligible, amador_trial_ends_at);

create or replace function public.start_amador_trial_on_first_use(p_user_id uuid)
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
  if p.id is null then return null; end if;
  if coalesce(p.role,'creator') <> 'creator' then return null; end if;
  if coalesce(p.plan,'free') <> 'free' then return null; end if;
  if not coalesce(p.amador_trial_eligible,false) then return null; end if;
  if p.amador_trial_started_at is not null then return p.amador_trial_ends_at; end if;

  v_start := now();
  v_end := v_start + interval '30 days';

  update public.profiles
     set amador_trial_started_at = v_start,
         amador_trial_ends_at = v_end,
         updated_at = now()
   where id = p_user_id;
  return v_end;
end;
$$;

revoke all on function public.start_amador_trial_on_first_use(uuid) from public;
grant execute on function public.start_amador_trial_on_first_use(uuid) to authenticated;
grant execute on function public.start_amador_trial_on_first_use(uuid) to service_role;

-- Novos usuários recebem a elegibilidade; o relógio só começa no primeiro uso.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,full_name,criatorio_name,ctf_number,amador_trial_eligible)
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

-- Atualiza a proteção de registros de módulos. O trial libera somente
-- os recursos que são exclusivos do Amador; o módulo veterinário não
-- ganha trial por causa desta regra.
create or replace function public.check_module_feature()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  p text; r text; trial_start timestamptz; trial_end timestamptz; eligible boolean; allowed boolean := true;
begin
  select plan, role, amador_trial_eligible, amador_trial_started_at, amador_trial_ends_at
    into p, r, eligible, trial_start, trial_end
    from public.profiles where id=new.user_id;
  p := coalesce(p,'free');

  if new.module_code in ('gestao-ave','historico-ave','genealogia','painel','cartao-gaiola','especies','agendar-veterinario') then
    allowed := true;
  elsif new.module_code in ('importacao-anilha','gestao-anilhas','galeria-fotos','gestao-documentos','gestao-gaiola','comportamento','imprimir-ficha','imprimir-plantel','imprimir-genealogia') then
    allowed := p in ('amador','profissional','lenda') or r in ('veterinarian','owner')
      or (p='free' and coalesce(eligible,false) and trial_start is not null and trial_end is not null and now() >= trial_start and now() < trial_end);
  elsif new.module_code = 'modulo-veterinario' then
    allowed := p in ('profissional','lenda') or r in ('veterinarian','owner');
  elsif new.module_code in ('sms','reproducao','doencas','medicamentos','genotipagem','sexagem') then
    allowed := p in ('profissional','lenda') or r in ('veterinarian','owner');
  elsif new.module_code = 'consulta-veterinaria-inclusa' then
    allowed := p='lenda' or r in ('veterinarian','owner');
  end if;

  if not allowed then raise exception 'RECURSO_DO_PLANO: o módulo % não está disponível para este perfil.', new.module_code; end if;
  return new;
end;
$$;

drop trigger if exists enforce_module_feature on public.bird_module_records;
create trigger enforce_module_feature
before insert or update on public.bird_module_records
for each row execute function public.check_module_feature();

-- A função da promoção antiga de 3 meses deixa de ser utilizada.
drop function if exists public.start_vet_module_trial(uuid);
