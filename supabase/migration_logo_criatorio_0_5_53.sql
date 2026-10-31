-- Apollo 0.5.53: garante armazenamento privado e vínculo da logo do criatório.
-- Execute uma única vez no SQL Editor do Supabase.

alter table public.profiles add column if not exists criatorio_logo_path text;

insert into storage.buckets (id, name, public)
values ('criatorio-brand', 'criatorio-brand', false)
on conflict (id) do update set public = false;

drop policy if exists "criatorio_brand_select" on storage.objects;
drop policy if exists "criatorio_brand_insert" on storage.objects;
drop policy if exists "criatorio_brand_update" on storage.objects;
drop policy if exists "criatorio_brand_delete" on storage.objects;

create policy "criatorio_brand_select"
on storage.objects for select to authenticated
using (bucket_id = 'criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "criatorio_brand_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "criatorio_brand_update"
on storage.objects for update to authenticated
using (bucket_id = 'criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "criatorio_brand_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'criatorio-brand' and (storage.foldername(name))[1] = (select auth.uid()::text));

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
