-- ============================================================
-- Minhas Aves — SCHEMA INICIAL SUPABASE
-- Crie um projeto Supabase NOVO e execute este arquivo no SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create type public.plan_code as enum ('free','amador','profissional');
create type public.bird_sex as enum ('macho','femea','indeterminado');
create type public.bird_status as enum ('ativo','falecido','transferido','arquivado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text,
  state text,
  plan public.plan_code not null default 'free',
  bonus_birds integer not null default 0,
  criatorio_name text,
  criatorio_logo_path text,
  ctf_number text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.species (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text not null unique,
  family text,
  order_name text,
  genus text,
  origin text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.birds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species_id uuid references public.species(id) on delete set null,
  name text not null,
  sex public.bird_sex not null default 'indeterminado',
  birth_date date,
  death_date date,
  transfer_date date,
  status public.bird_status not null default 'ativo',
  ring_number text,
  reference_ring_number text,
  ibama_registration_number text,
  ibama_record_type text,
  father_id uuid references public.birds(id) on delete set null,
  mother_id uuid references public.birds(id) on delete set null,
  genetic_line text,
  genetics jsonb not null default '{}'::jsonb,
  breeder_matrix boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint birds_not_own_father check (father_id is null or father_id <> id),
  constraint birds_not_own_mother check (mother_id is null or mother_id <> id)
);

create index birds_user_idx on public.birds(user_id);
create index birds_species_idx on public.birds(species_id);
create index birds_father_idx on public.birds(father_id);
create index birds_mother_idx on public.birds(mother_id);
create index birds_ring_idx on public.birds(user_id, ring_number);

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Cria perfil automaticamente após signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, criatorio_name, ctf_number)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'criatorio_name',''), nullif(new.raw_user_meta_data->>'ctf_number',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Atualização de timestamp.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger birds_updated_at before update on public.birds
for each row execute procedure public.set_updated_at();

-- Limite comercial de aves por plano: grátis 5 / planos pagos sem limite de quantidade de aves.
create or replace function public.check_bird_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan public.plan_code;
  current_count integer;
  max_allowed integer;
begin
  select plan into current_plan from public.profiles where id = new.user_id;
  current_plan := coalesce(current_plan, 'free');
  select coalesce(bonus_birds,0) into current_count from public.profiles where id = new.user_id;
  max_allowed := case when current_plan = 'free' then 5 + coalesce(current_count,0) else null end;

  -- Serializa cadastros concorrentes do mesmo usuário para impedir que
  -- duas requisições simultâneas ultrapassem o limite do plano.
  if max_allowed is not null then
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select count(*) into current_count from public.birds where user_id = new.user_id;
    if current_count >= max_allowed then
      raise exception 'LIMITE_DE_AVES_ATINGIDO: o plano % permite até % aves.', current_plan, max_allowed;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_bird_limit on public.birds;
create trigger enforce_bird_limit
before insert on public.birds
for each row execute procedure public.check_bird_limit();

-- RLS.
alter table public.profiles enable row level security;
alter table public.species enable row level security;
alter table public.birds enable row level security;
alter table public.subscription_events enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "species_read_authenticated" on public.species for select to authenticated using (is_active = true);

create policy "birds_select_own" on public.birds for select to authenticated using ((select auth.uid()) = user_id);
create policy "birds_insert_own" on public.birds for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "birds_update_own" on public.birds for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "birds_delete_own" on public.birds for delete to authenticated using ((select auth.uid()) = user_id);

-- Webhook usa service_role e não precisa de policy.
revoke all on public.subscription_events from anon, authenticated;

-- Catálogo inicial: exemplos para validar o sistema.
-- IMPORTANTE: este bloco NÃO pretende ser uma lista taxonômica completa.
insert into public.species(common_name, scientific_name, family, order_name, genus, origin) values
('Coleiro','Sporophila caerulescens','Thraupidae','Passeriformes','Sporophila','América do Sul'),
('Papa-capim','Sporophila nigricollis','Thraupidae','Passeriformes','Sporophila','América do Sul'),
('Curió','Sporophila angolensis','Thraupidae','Passeriformes','Sporophila','América do Sul'),
('Canário-da-terra','Sicalis flaveola','Thraupidae','Passeriformes','Sicalis','América do Sul'),
('Azulão','Cyanoloxia brissonii','Cardinalidae','Passeriformes','Cyanoloxia','América do Sul'),
('Trinca-ferro','Saltator similis','Thraupidae','Passeriformes','Saltator','América do Sul'),
('Pintassilgo','Spinus magellanicus','Fringillidae','Passeriformes','Spinus','América do Sul'),
('Tico-tico','Zonotrichia capensis','Passerellidae','Passeriformes','Zonotrichia','América do Sul'),
('Tico-tico-rei','Coryphospingus cucullatus','Thraupidae','Passeriformes','Coryphospingus','América do Sul'),
('Sabiá-laranjeira','Turdus rufiventris','Turdidae','Passeriformes','Turdus','América do Sul'),
('Sabiá-do-campo','Mimus saturninus','Mimidae','Passeriformes','Mimus','América do Sul'),
('Bigodinho','Sporophila lineola','Thraupidae','Passeriformes','Sporophila','América do Sul'),
('Caboclinho','Sporophila bouvreuil','Thraupidae','Passeriformes','Sporophila','América do Sul'),
('Pássaro-preto','Gnorimopsar chopi','Icteridae','Passeriformes','Gnorimopsar','América do Sul')
on conflict (scientific_name) do nothing;

-- Para o catálogo completo, importe uma base taxonômica validada
-- no formato (common_name, scientific_name, family, order_name, genus, origin).


-- ============================================================
-- MÓDULOS DO PRODUTO — recursos inspirados na matriz comercial
-- ============================================================
create table if not exists public.bird_module_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bird_id uuid references public.birds(id) on delete cascade,
  module_code text not null,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  event_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bird_module_records_user_idx on public.bird_module_records(user_id, module_code);
create index if not exists bird_module_records_bird_idx on public.bird_module_records(bird_id, module_code);
drop trigger if exists bird_module_records_updated_at on public.bird_module_records;
create trigger bird_module_records_updated_at before update on public.bird_module_records
for each row execute procedure public.set_updated_at();

create table if not exists public.bird_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bird_id uuid references public.birds(id) on delete cascade,
  kind text not null check (kind in ('foto','documento')),
  title text,
  storage_path text not null,
  mime_type text,
  created_at timestamptz not null default now()
);
create index if not exists bird_media_user_idx on public.bird_media(user_id, kind);
create index if not exists bird_media_bird_idx on public.bird_media(bird_id, kind);

alter table public.bird_module_records enable row level security;
alter table public.bird_media enable row level security;

drop policy if exists "module_records_select_own" on public.bird_module_records;
drop policy if exists "module_records_insert_own" on public.bird_module_records;
drop policy if exists "module_records_update_own" on public.bird_module_records;
drop policy if exists "module_records_delete_own" on public.bird_module_records;
create policy "module_records_select_own" on public.bird_module_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "module_records_insert_own" on public.bird_module_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "module_records_update_own" on public.bird_module_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "module_records_delete_own" on public.bird_module_records for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "bird_media_select_own" on public.bird_media;
drop policy if exists "bird_media_insert_own" on public.bird_media;
drop policy if exists "bird_media_delete_own" on public.bird_media;
create policy "bird_media_select_own" on public.bird_media for select to authenticated using ((select auth.uid()) = user_id);
create policy "bird_media_insert_own" on public.bird_media for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "bird_media_delete_own" on public.bird_media for delete to authenticated using ((select auth.uid()) = user_id);

-- Identidade visual do criatório: bucket privado para logos.
insert into storage.buckets (id, name, public) values ('criatorio-brand','criatorio-brand',false)
on conflict (id) do nothing;

drop policy if exists "criatorio_brand_select" on storage.objects;
drop policy if exists "criatorio_brand_insert" on storage.objects;
drop policy if exists "criatorio_brand_update" on storage.objects;
drop policy if exists "criatorio_brand_delete" on storage.objects;
create policy "criatorio_brand_select" on storage.objects for select to authenticated using (bucket_id='criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "criatorio_brand_insert" on storage.objects for insert to authenticated with check (bucket_id='criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "criatorio_brand_update" on storage.objects for update to authenticated using (bucket_id='criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id='criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "criatorio_brand_delete" on storage.objects for delete to authenticated using (bucket_id='criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Bucket privado para fotos e documentos.
insert into storage.buckets (id, name, public) values ('bird-media','bird-media',false)
on conflict (id) do nothing;

drop policy if exists "bird_media_storage_select" on storage.objects;
drop policy if exists "bird_media_storage_insert" on storage.objects;
drop policy if exists "bird_media_storage_delete" on storage.objects;
create policy "bird_media_storage_select" on storage.objects for select to authenticated using (bucket_id='bird-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "bird_media_storage_insert" on storage.objects for insert to authenticated with check (bucket_id='bird-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "bird_media_storage_delete" on storage.objects for delete to authenticated using (bucket_id='bird-media' and (storage.foldername(name))[1] = (select auth.uid()::text));


-- Proteção de recursos no banco: não confia apenas na interface.
create or replace function public.check_module_feature()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.plan_code; required text;
begin
 select plan into p from public.profiles where id = new.user_id; p := coalesce(p,'free');
 required := case
   when new.module_code in ('gestao-ave','historico-ave','genealogia','painel','cartao-gaiola','especies') then 'free'
   when new.module_code in ('importacao-anilha','gestao-anilhas','galeria-fotos','gestao-documentos','gestao-gaiola','comportamento') then 'amador'
   else 'profissional' end;
 if required='amador' and p='free' then raise exception 'RECURSO_DO_PLANO: assine o Criatório Amador para usar este módulo.'; end if;
 if required='profissional' and p<>'profissional' then raise exception 'RECURSO_DO_PLANO: assine o Criatório Profissional para usar este módulo.'; end if;
 return new;
end; $$;
drop trigger if exists enforce_module_feature on public.bird_module_records;
create trigger enforce_module_feature before insert or update on public.bird_module_records for each row execute procedure public.check_module_feature();

create or replace function public.check_media_feature()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.plan_code;
begin
 select plan into p from public.profiles where id=new.user_id; p:=coalesce(p,'free');
 if p='free' then raise exception 'RECURSO_DO_PLANO: fotos e documentos estão disponíveis a partir do Criatório Amador.'; end if;
 return new;
end; $$;
drop trigger if exists enforce_media_feature on public.bird_media;
create trigger enforce_media_feature before insert on public.bird_media for each row execute procedure public.check_media_feature();
