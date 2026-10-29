alter table public.profiles add column if not exists bonus_birds integer not null default 0;

-- Execute este arquivo em um banco Minhas Aves já criado.
-- Ele torna os planos pagos ilimitados em quantidade de aves e adiciona os módulos.

create or replace function public.check_bird_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare current_plan public.plan_code; current_count integer; max_allowed integer;
begin
  select plan into current_plan from public.profiles where id = new.user_id;
  current_plan := coalesce(current_plan, 'free');
  select coalesce(bonus_birds,0) into current_count from public.profiles where id = new.user_id;
  max_allowed := case when current_plan = 'free' then 5 + coalesce(current_count,0) else null end;
  if max_allowed is not null then
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select count(*) into current_count from public.birds where user_id = new.user_id;
    if current_count >= max_allowed then raise exception 'LIMITE_DE_AVES_ATINGIDO: o plano % permite até % aves.', current_plan, max_allowed; end if;
  end if;
  return new;
end; $$;

create table if not exists public.bird_module_records (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 bird_id uuid references public.birds(id) on delete cascade, module_code text not null, title text not null,
 data jsonb not null default '{}'::jsonb, event_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists bird_module_records_user_idx on public.bird_module_records(user_id,module_code);
create index if not exists bird_module_records_bird_idx on public.bird_module_records(bird_id,module_code);
drop trigger if exists bird_module_records_updated_at on public.bird_module_records;
create trigger bird_module_records_updated_at before update on public.bird_module_records for each row execute procedure public.set_updated_at();

create table if not exists public.bird_media (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, bird_id uuid references public.birds(id) on delete cascade,
 kind text not null check (kind in ('foto','documento')), title text, storage_path text not null, mime_type text, created_at timestamptz not null default now()
);
create index if not exists bird_media_user_idx on public.bird_media(user_id,kind);
create index if not exists bird_media_bird_idx on public.bird_media(bird_id,kind);

alter table public.bird_module_records enable row level security; alter table public.bird_media enable row level security;
drop policy if exists "module_records_select_own" on public.bird_module_records; drop policy if exists "module_records_insert_own" on public.bird_module_records; drop policy if exists "module_records_update_own" on public.bird_module_records; drop policy if exists "module_records_delete_own" on public.bird_module_records;
create policy "module_records_select_own" on public.bird_module_records for select to authenticated using ((select auth.uid())=user_id);
create policy "module_records_insert_own" on public.bird_module_records for insert to authenticated with check ((select auth.uid())=user_id);
create policy "module_records_update_own" on public.bird_module_records for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "module_records_delete_own" on public.bird_module_records for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "bird_media_select_own" on public.bird_media; drop policy if exists "bird_media_insert_own" on public.bird_media; drop policy if exists "bird_media_delete_own" on public.bird_media;
create policy "bird_media_select_own" on public.bird_media for select to authenticated using ((select auth.uid())=user_id);
create policy "bird_media_insert_own" on public.bird_media for insert to authenticated with check ((select auth.uid())=user_id);
create policy "bird_media_delete_own" on public.bird_media for delete to authenticated using ((select auth.uid())=user_id);

insert into storage.buckets (id,name,public) values ('bird-media','bird-media',false) on conflict (id) do nothing;
drop policy if exists "bird_media_storage_select" on storage.objects; drop policy if exists "bird_media_storage_insert" on storage.objects; drop policy if exists "bird_media_storage_delete" on storage.objects;
create policy "bird_media_storage_select" on storage.objects for select to authenticated using (bucket_id='bird-media' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "bird_media_storage_insert" on storage.objects for insert to authenticated with check (bucket_id='bird-media' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "bird_media_storage_delete" on storage.objects for delete to authenticated using (bucket_id='bird-media' and (storage.foldername(name))[1]=(select auth.uid()::text));


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


-- IDENTIDADE DO CRIATÓRIO E LOGO
alter table public.profiles add column if not exists criatorio_name text;
alter table public.profiles add column if not exists criatorio_logo_path text;

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


-- Atualiza o trigger de cadastro para salvar também o nome do criatório informado no signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, criatorio_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'criatorio_name',''))
  on conflict (id) do update set
    full_name = coalesce(nullif(public.profiles.full_name,''), excluded.full_name),
    criatorio_name = coalesce(public.profiles.criatorio_name, excluded.criatorio_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- CTF opcional para identidade e documentos impressos.
alter table public.profiles add column if not exists ctf_number text;
