-- ============================================================
-- Minhas Aves — VETERINÁRIO PARCEIRO + PLANO LENDA + PATROCINADORES
-- Execute depois do schema.sql + migration_modules_unlimited.sql.
-- ============================================================

-- 1) Perfis e assinatura
alter table public.profiles add column if not exists role text not null default 'creator';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('creator','veterinarian','owner'));
alter table public.profiles add column if not exists subscription_status text not null default 'inactive';
alter table public.profiles add column if not exists current_period_start timestamptz;
alter table public.profiles add column if not exists current_period_end timestamptz;
alter table public.profiles add column if not exists lenda_consultation_used boolean not null default false;
alter table public.profiles add column if not exists lenda_consultation_used_at timestamptz;
alter table public.profiles add column if not exists cpf text;

-- Mantemos a compatibilidade do banco existente, mas transformamos a coluna comercial
-- em texto para permitir novos níveis sem depender de ALTER TYPE em futuras migrações.
alter table public.profiles alter column plan type text using plan::text;
alter table public.profiles alter column plan set default 'free';
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free','amador','profissional','lenda'));

-- 2) Perfil público do veterinário parceiro.
create table if not exists public.vet_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  crmv text,
  photo_url text,
  bio text,
  specialties text,
  address text,
  city text,
  state text,
  whatsapp text,
  online_available boolean not null default true,
  in_person_available boolean not null default true,
  partnership_terms text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vet_profiles_active_idx on public.vet_profiles(is_active);

-- 3) Solicitações/consultas veterinárias.
create table if not exists public.vet_consultations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  bird_id uuid not null references public.birds(id) on delete cascade,
  vet_id uuid references auth.users(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','scheduled','completed','cancelled')),
  modality text not null default 'a_combinar' check (modality in ('online','presencial','a_combinar')),
  requested_at timestamptz not null default now(),
  scheduled_at timestamptz,
  consultation_date date,
  included_in_lenda boolean not null default false,
  entitlement_period_start timestamptz,
  entitlement_period_end timestamptz,
  description text,
  vet_notes text,
  record_pdf_path text,
  prescription_pdf_path text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vet_consult_creator_idx on public.vet_consultations(creator_id, created_at desc);
create index if not exists vet_consult_bird_idx on public.vet_consultations(bird_id, created_at desc);
create index if not exists vet_consult_vet_idx on public.vet_consultations(vet_id, created_at desc);

-- 4) Repasse ao veterinário. O valor inicial acordado é R$100 por assinatura Lenda,
-- independentemente do preço comercial da assinatura.
create table if not exists public.vet_payouts (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  subscription_id text,
  consultation_id uuid references public.vet_consultations(id) on delete set null,
  amount_cents integer not null default 10000,
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  due_date date,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists vet_payouts_vet_idx on public.vet_payouts(vet_id, created_at desc);
create index if not exists vet_payouts_creator_idx on public.vet_payouts(creator_id, created_at desc);

-- 5) Patrocinadores. A interface pública mostra no máximo 5 ativos.
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  logo_url text,
  website_url text,
  whatsapp_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sponsors_active_idx on public.sponsors(is_active, sort_order);

-- 6) Clique rastreável dos patrocinadores.
create table if not exists public.sponsor_clicks (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  destination text,
  created_at timestamptz not null default now()
);
create index if not exists sponsor_clicks_sponsor_idx on public.sponsor_clicks(sponsor_id, created_at desc);

-- 7) Storage privado dos documentos veterinários.
insert into storage.buckets (id,name,public) values ('vet-records','vet-records',false)
on conflict (id) do nothing;

-- O acesso aos PDFs passa pelas APIs do projeto, que validam criador/veterinário/owner.
-- Não damos SELECT/INSERT público ao bucket.
drop policy if exists "vet_records_select" on storage.objects;
drop policy if exists "vet_records_insert" on storage.objects;
drop policy if exists "vet_records_update" on storage.objects;
drop policy if exists "vet_records_delete" on storage.objects;

-- 8) RLS das novas tabelas.
alter table public.vet_profiles enable row level security;
alter table public.vet_consultations enable row level security;
alter table public.vet_payouts enable row level security;
alter table public.sponsors enable row level security;
alter table public.sponsor_clicks enable row level security;

-- Função segura para saber o papel do usuário sem depender da tabela auth no front.
create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path=public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'creator');
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

-- Veterinário público: qualquer usuário autenticado pode consultar o perfil ativo;
-- a página pública usa service role no servidor para funcionar sem login.
drop policy if exists "vet_profile_authenticated_read" on public.vet_profiles;
create policy "vet_profile_authenticated_read" on public.vet_profiles for select to authenticated using (is_active = true or id = auth.uid());
create policy "vet_profile_self_update" on public.vet_profiles for update to authenticated using (id = auth.uid() and public.current_profile_role()='veterinarian') with check (id = auth.uid() and public.current_profile_role()='veterinarian');

-- Criador só vê as próprias consultas; veterinário vê somente as consultas ligadas a ele;
-- owner vê tudo.
drop policy if exists "vet_consult_creator_read" on public.vet_consultations;
drop policy if exists "vet_consult_creator_insert" on public.vet_consultations;
drop policy if exists "vet_consult_creator_update" on public.vet_consultations;
create policy "vet_consult_creator_read" on public.vet_consultations for select to authenticated
using (creator_id=auth.uid() or vet_id=auth.uid() or public.current_profile_role()='owner');
create policy "vet_consult_creator_insert" on public.vet_consultations for insert to authenticated
with check (creator_id=auth.uid() and public.current_profile_role()='creator');
create policy "vet_consult_creator_update" on public.vet_consultations for update to authenticated
using (creator_id=auth.uid() or vet_id=auth.uid() or public.current_profile_role()='owner')
with check (creator_id=auth.uid() or vet_id=auth.uid() or public.current_profile_role()='owner');

-- Repasse: somente owner/veterinário próprio.
drop policy if exists "vet_payout_read" on public.vet_payouts;
create policy "vet_payout_read" on public.vet_payouts for select to authenticated
using (vet_id=auth.uid() or public.current_profile_role()='owner');

-- Patrocinadores: leitura pública para os ativos; alterações somente owner.
drop policy if exists "sponsors_public_read" on public.sponsors;
create policy "sponsors_public_read" on public.sponsors for select to anon, authenticated using (is_active=true);
drop policy if exists "sponsors_owner_write" on public.sponsors;
create policy "sponsors_owner_write" on public.sponsors for all to authenticated
using (public.current_profile_role()='owner') with check (public.current_profile_role()='owner');

-- Cliques podem ser registrados pela própria API com service role. Usuários não precisam de INSERT direto.
revoke all on public.sponsor_clicks from anon, authenticated;

-- 9) Limite gratuito continua em 5 + bônus; qualquer plano pago, inclusive Lenda, ilimitado.
create or replace function public.check_bird_limit()
returns trigger language plpgsql security definer set search_path=public as $$
declare current_plan text; current_count integer; max_allowed integer; bonus integer;
begin
 select plan, coalesce(bonus_birds,0) into current_plan, bonus from public.profiles where id=new.user_id;
 current_plan := coalesce(current_plan,'free');
 max_allowed := case when current_plan='free' then 5+coalesce(bonus,0) else null end;
 if max_allowed is not null then
   perform pg_advisory_xact_lock(hashtext(new.user_id::text));
   select count(*) into current_count from public.birds where user_id=new.user_id;
   if current_count >= max_allowed then raise exception 'LIMITE_DE_AVES_ATINGIDO: o plano % permite até % aves.', current_plan, max_allowed; end if;
 end if;
 return new;
end; $$;

-- 10) Regras de módulos: Lenda herda todos os módulos profissionais.
create or replace function public.check_module_feature()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text; required text;
begin
 select plan into p from public.profiles where id = new.user_id; p := coalesce(p,'free');
 required := case
   when new.module_code in ('gestao-ave','historico-ave','genealogia','painel','cartao-gaiola','especies') then 'free'
   when new.module_code in ('importacao-anilha','gestao-anilhas','galeria-fotos','gestao-documentos','gestao-gaiola','comportamento') then 'amador'
   else 'profissional' end;
 if required='amador' and p='free' then raise exception 'RECURSO_DO_PLANO: assine o Criatório Amador para usar este módulo.'; end if;
 if required='profissional' and p not in ('profissional','lenda') then raise exception 'RECURSO_DO_PLANO: assine o Criatório Profissional para usar este módulo.'; end if;
 return new;
end; $$;

-- 11) Função transacional: conclui consulta e, se ela for a consulta inclusa do Lenda,
-- consome uma única vez o benefício do período e gera o repasse de R$100.

-- Repasse comercial da assinatura Lenda: o owner pode gerar/registrar o repasse de R$100
-- no momento da assinatura/renovação, independentemente de a consulta já ter sido usada.
create or replace function public.create_lenda_payout(
  p_creator_id uuid,
  p_subscription_id text,
  p_period_start timestamptz default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid; vet uuid;
begin
 select id into vet from public.vet_profiles where is_active=true order by created_at limit 1;
 if vet is null then raise exception 'VETERINARIO_INDISPONIVEL'; end if;
 if not exists(select 1 from public.profiles where id=p_creator_id and plan='lenda') then raise exception 'ASSINATURA_LENDA_NAO_ENCONTRADA'; end if;
 if exists(select 1 from public.vet_payouts where creator_id=p_creator_id and subscription_id=p_subscription_id and period_start is not distinct from p_period_start and status<>'cancelled') then
   select id into v_id from public.vet_payouts where creator_id=p_creator_id and subscription_id=p_subscription_id and period_start is not distinct from p_period_start order by created_at desc limit 1;
   return v_id;
 end if;
 insert into public.vet_payouts(vet_id,creator_id,subscription_id,period_start,amount_cents,status,note)
 values(vet,p_creator_id,p_subscription_id,p_period_start,10000,'pending','Repasse da assinatura Criador Lenda; devido mesmo sem uso da consulta, salvo chargeback/disputa.')
 returning id into v_id;
 return v_id;
end; $$;
revoke all on function public.create_lenda_payout(uuid,text,timestamptz) from public;
grant execute on function public.create_lenda_payout(uuid,text,timestamptz) to service_role;

create or replace function public.complete_vet_consultation(
  p_consultation_id uuid,
  p_vet_notes text,
  p_description text,
  p_consultation_date date,
  p_modality text,
  p_record_pdf_path text,
  p_prescription_pdf_path text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare c public.vet_consultations; pr public.profiles; v_role text;
begin
 select role into v_role from public.profiles where id=auth.uid();
 if coalesce(v_role,'') not in ('veterinarian','owner') then raise exception 'PERMISSAO_NEGADA'; end if;
 select * into c from public.vet_consultations where id=p_consultation_id for update;
 if c.id is null then raise exception 'CONSULTA_NAO_ENCONTRADA'; end if;
 if v_role='veterinarian' and c.vet_id<>auth.uid() then raise exception 'PERMISSAO_NEGADA'; end if;
 select * into pr from public.profiles where id=c.creator_id for update;
 if c.included_in_lenda then
   if pr.plan <> 'lenda' then raise exception 'BENEFICIO_LENDA_INDISPONIVEL'; end if;
   if pr.current_period_end is not null and now() > pr.current_period_end then raise exception 'PERIODO_LENDA_EXPIRADO'; end if;
   if pr.lenda_consultation_used then raise exception 'CONSULTA_LENDA_JA_UTILIZADA'; end if;
   update public.profiles set lenda_consultation_used=true,lenda_consultation_used_at=now() where id=pr.id;
 end if;
 update public.vet_consultations set status='completed',vet_notes=p_vet_notes,description=p_description,consultation_date=p_consultation_date,
 modality=p_modality,included_in_lenda=c.included_in_lenda,record_pdf_path=p_record_pdf_path,prescription_pdf_path=p_prescription_pdf_path,completed_at=now(),updated_at=now()
 where id=c.id;
 return jsonb_build_object('ok',true,'included_in_lenda',c.included_in_lenda);
end; $$;
revoke all on function public.complete_vet_consultation(uuid,text,text,date,text,text,text) from public;
grant execute on function public.complete_vet_consultation(uuid,text,text,date,text,text,text) to authenticated;

-- 12) Seed do patrocinador já fechado. Logo fica em branco para você subir depois.
insert into public.sponsors(name,tagline,logo_url,website_url,sort_order,is_active)
select 'FM Eletrônica','Faça parte do time campeão de encarte do Brasil.',null,'https://fmeletronica.com.br',1,true
where not exists (select 1 from public.sponsors where name='FM Eletrônica');

-- 13) Configuração inicial do veterinário: preencha o id real do usuário criado no Supabase.
-- Exemplo:
-- update public.profiles set role='veterinarian' where id='UUID_DO_VETERINARIO';
-- insert into public.vet_profiles(id,display_name,crmv,bio,specialties,address,city,state,whatsapp,partnership_terms)
-- values('UUID_DO_VETERINARIO','NOME DO VETERINÁRIO','CRMV/UF XXXXX','BIO...','Aves silvestres','ENDEREÇO','CIDADE','UF','5511999999999','TERMOS...');

-- Para o owner:
-- update public.profiles set role='owner' where id='SEU_UUID';

-- 14) Solicitação transacional para reservar o benefício Lenda sem consumir a consulta ainda.
create or replace function public.request_vet_consultation(p_bird_id uuid, p_modality text default 'a_combinar')
returns uuid language plpgsql security definer set search_path=public as $$
declare pr public.profiles; vet uuid; cid uuid; included boolean := false;
begin
 select * into pr from public.profiles where id=auth.uid() for update;
 if pr.id is null then raise exception 'PERMISSAO_NEGADA'; end if;
 if not exists(select 1 from public.birds where id=p_bird_id and user_id=auth.uid()) then raise exception 'AVE_NAO_ENCONTRADA'; end if;
 select id into vet from public.vet_profiles where is_active=true order by created_at limit 1;
 if vet is null then raise exception 'VETERINARIO_INDISPONIVEL'; end if;
 if pr.plan='lenda' and not coalesce(pr.lenda_consultation_used,false) then
   if pr.current_period_end is null or now() <= pr.current_period_end then
     if not exists(select 1 from public.vet_consultations where creator_id=auth.uid() and included_in_lenda=true and status in ('requested','scheduled')) then
       included := true;
     end if;
   end if;
 end if;
 insert into public.vet_consultations(creator_id,bird_id,vet_id,status,modality,included_in_lenda,entitlement_period_start,entitlement_period_end)
 values(auth.uid(),p_bird_id,vet,'requested',p_modality,included,pr.current_period_start,pr.current_period_end)
 returning id into cid;
 return cid;
end; $$;
revoke all on function public.request_vet_consultation(uuid,text) from public;
grant execute on function public.request_vet_consultation(uuid,text) to authenticated;

-- 15) Visibilidade clínica: o veterinário parceiro pode consultar os dados dos
-- criadores Lenda (e apenas deles), incluindo o plantel dessas contas.
drop policy if exists "profiles_vet_read_lenda" on public.profiles;
create policy "profiles_vet_read_lenda" on public.profiles for select to authenticated
using (public.current_profile_role()='veterinarian' and plan='lenda');

drop policy if exists "birds_vet_read_lenda" on public.birds;
create policy "birds_vet_read_lenda" on public.birds for select to authenticated
using (public.current_profile_role()='veterinarian' and exists(select 1 from public.profiles p where p.id=birds.user_id and p.plan='lenda'));

drop policy if exists "profiles_owner_read_all" on public.profiles;
create policy "profiles_owner_read_all" on public.profiles for select to authenticated using (public.current_profile_role()='owner');

-- Owner também pode consultar o plantel para reproduzir a visão do veterinário no modo de teste.
drop policy if exists "birds_owner_read_all" on public.birds;
create policy "birds_owner_read_all" on public.birds for select to authenticated
using (public.current_profile_role()='owner');

-- 16) Histórico comercial visível ao veterinário apenas para a modalidade Lenda.
create table if not exists public.vet_subscription_history (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  event_type text not null,
  status text,
  subscription_id text,
  period_start timestamptz,
  period_end timestamptz,
  occurred_at timestamptz not null default now(),
  note text
);
create index if not exists vet_subscription_history_creator_idx on public.vet_subscription_history(creator_id, occurred_at desc);
alter table public.vet_subscription_history enable row level security;
drop policy if exists "vet_subscription_history_read" on public.vet_subscription_history;
create policy "vet_subscription_history_read" on public.vet_subscription_history for select to authenticated
using (creator_id=auth.uid() or public.current_profile_role()='veterinarian' or public.current_profile_role()='owner');
revoke insert,update,delete on public.vet_subscription_history from anon,authenticated;

-- Mantém o histórico comercial no webhook via função segura.
create or replace function public.record_vet_subscription_history(
  p_creator_id uuid,p_plan text,p_event_type text,p_status text,p_subscription_id text,p_period_start timestamptz,p_period_end timestamptz,p_note text default null
) returns void language sql security definer set search_path=public as $$
  insert into public.vet_subscription_history(creator_id,plan,event_type,status,subscription_id,period_start,period_end,note)
  values(p_creator_id,p_plan,p_event_type,p_status,p_subscription_id,p_period_start,p_period_end,p_note);
$$;
revoke all on function public.record_vet_subscription_history(uuid,text,text,text,text,timestamptz,timestamptz,text) from public;
grant execute on function public.record_vet_subscription_history(uuid,text,text,text,text,timestamptz,timestamptz,text) to service_role;

-- O criador não altera prontuário, receita, descrição ou status clínico. Essas alterações
-- são feitas pelo veterinário (ou owner) por API segura.
drop policy if exists "vet_consult_creator_update" on public.vet_consultations;
drop policy if exists "vet_consult_vet_owner_update" on public.vet_consultations;
create policy "vet_consult_vet_owner_update" on public.vet_consultations for update to authenticated
using (vet_id=auth.uid() or public.current_profile_role()='owner')
with check (vet_id=auth.uid() or public.current_profile_role()='owner');

alter table public.vet_payouts add column if not exists period_start timestamptz;
create index if not exists vet_payouts_period_idx on public.vet_payouts(creator_id,subscription_id,period_start);
