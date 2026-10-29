-- ============================================================
-- Minhas Aves 0.4.3 — VETERINÁRIO PARCEIRO COM ACESSO TOTAL
-- Execute DEPOIS de:
--   schema.sql
--   migration_veterinario_patrocinadores_lenda.sql
--
-- Objetivo:
-- 1. O veterinário parceiro usa o Minhas Aves como criador.
-- 2. Para uso próprio, recebe acesso equivalente ao Criador Lenda.
-- 3. No ambiente veterinário, pode consultar todos os criadores ativos,
--    todos os plantéis e todo o histórico clínico disponível.
-- 4. Consultas particulares não dependem do plano do criador.
-- 5. O veterinário pode cadastrar suas próprias aves sem limite de 5.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Perfil veterinário: acesso de leitura a todos os criadores.
-- ------------------------------------------------------------
drop policy if exists "profiles_vet_read_lenda" on public.profiles;
drop policy if exists "profiles_vet_read_all" on public.profiles;
create policy "profiles_vet_read_all" on public.profiles
for select to authenticated
using (public.current_profile_role()='veterinarian');

-- ------------------------------------------------------------
-- 2) Plantel: veterinário consegue consultar aves de qualquer criador.
--    A gravação continua restrita ao próprio usuário pelas políticas
--    birds_insert_own / birds_update_own.
-- ------------------------------------------------------------
drop policy if exists "birds_vet_read_lenda" on public.birds;
drop policy if exists "birds_vet_read_all" on public.birds;
create policy "birds_vet_read_all" on public.birds
for select to authenticated
using (public.current_profile_role()='veterinarian');

-- ------------------------------------------------------------
-- 3) Histórico veterinário: o parceiro é o veterinário operacional único
--    da plataforma e pode consultar os registros clínicos de qualquer
--    criador. Alterações continuam passando pela API/função segura.
-- ------------------------------------------------------------
drop policy if exists "vet_consult_creator_read" on public.vet_consultations;
create policy "vet_consult_creator_read" on public.vet_consultations
for select to authenticated
using (creator_id=auth.uid() or vet_id=auth.uid() or public.current_profile_role() in ('owner','veterinarian'));

drop policy if exists "vet_consult_vet_owner_update" on public.vet_consultations;
create policy "vet_consult_vet_owner_update" on public.vet_consultations
for update to authenticated
using (vet_id=auth.uid() or public.current_profile_role() in ('owner','veterinarian'))
with check (vet_id=auth.uid() or public.current_profile_role() in ('owner','veterinarian'));

-- ------------------------------------------------------------
-- 4) Histórico comercial: o veterinário pode visualizar o contexto
--    de assinatura de qualquer criador para identificar Lenda/particular.
-- ------------------------------------------------------------
drop policy if exists "vet_subscription_history_read" on public.vet_subscription_history;
create policy "vet_subscription_history_read" on public.vet_subscription_history
for select to authenticated
using (creator_id=auth.uid() or public.current_profile_role() in ('owner','veterinarian'));

-- ------------------------------------------------------------
-- 5) Veterinário parceiro = acesso comercial equivalente ao Lenda para
--    uso próprio. O frontend usa effectivePlan(...), mas o banco também
--    precisa deixar o cadastro de aves sem o limite gratuito de 5.
-- ------------------------------------------------------------
create or replace function public.check_bird_limit()
returns trigger
language plpgsql
security definer
set search_path=public
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
   where id=new.user_id;

  current_plan := coalesce(current_plan,'free');

  -- Veterinário parceiro e Owner não sofrem limite comercial do plano.
  if exists (
    select 1 from public.profiles p
    where p.id=new.user_id and p.role in ('veterinarian','owner')
  ) then
    return new;
  end if;

  max_allowed := case
    when current_plan = 'free' then 5 + coalesce(bonus,0)
    else null
  end;

  if max_allowed is not null then
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select count(*) into current_count
      from public.birds
     where user_id=new.user_id;
    if current_count >= max_allowed then
      raise exception 'LIMITE_DE_AVES_ATINGIDO: o plano % permite até % aves.', current_plan, max_allowed;
    end if;
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 6) Função clínica: qualquer veterinário parceiro ativo pode finalizar
--    uma consulta que esteja no ambiente operacional.
-- ------------------------------------------------------------
create or replace function public.complete_vet_consultation(
  p_consultation_id uuid,
  p_vet_notes text,
  p_description text,
  p_consultation_date date,
  p_modality text,
  p_record_pdf_path text,
  p_prescription_pdf_path text
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  c public.vet_consultations;
  pr public.profiles;
  v_role text;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if coalesce(v_role,'') not in ('veterinarian','owner') then
    raise exception 'PERMISSAO_NEGADA';
  end if;

  select * into c from public.vet_consultations where id=p_consultation_id for update;
  if c.id is null then raise exception 'CONSULTA_NAO_ENCONTRADA'; end if;

  -- O ambiente pertence ao veterinário parceiro operacional. Não exigimos
  -- que registros históricos tenham sido atribuídos ao UUID atual.
  if v_role='veterinarian' and c.vet_id is null then
    update public.vet_consultations set vet_id=auth.uid() where id=c.id;
    select * into c from public.vet_consultations where id=p_consultation_id for update;
  end if;

  select * into pr from public.profiles where id=c.creator_id for update;

  if c.included_in_lenda then
    if pr.plan <> 'lenda' then raise exception 'BENEFICIO_LENDA_INDISPONIVEL'; end if;
    if pr.current_period_end is not null and now() > pr.current_period_end then raise exception 'PERIODO_LENDA_EXPIRADO'; end if;
    if pr.lenda_consultation_used then raise exception 'CONSULTA_LENDA_JA_UTILIZADA'; end if;
    update public.profiles
       set lenda_consultation_used=true,
           lenda_consultation_used_at=now()
     where id=pr.id;
  end if;

  update public.vet_consultations
     set status='completed',
         vet_notes=p_vet_notes,
         description=p_description,
         consultation_date=p_consultation_date,
         modality=p_modality,
         included_in_lenda=c.included_in_lenda,
         record_pdf_path=p_record_pdf_path,
         prescription_pdf_path=p_prescription_pdf_path,
         completed_at=now(),
         updated_at=now()
   where id=c.id;

  return jsonb_build_object('ok',true,'included_in_lenda',c.included_in_lenda);
end;
$$;

revoke all on function public.complete_vet_consultation(uuid,text,text,date,text,text,text) from public;
grant execute on function public.complete_vet_consultation(uuid,text,text,date,text,text,text) to authenticated;

-- ------------------------------------------------------------
-- 7) Segurança do histórico clínico permanece centralizada na API.
-- ------------------------------------------------------------
comment on table public.vet_consultations is
  'Histórico veterinário. O veterinário parceiro pode atender consultas particulares e benefícios Lenda.';

