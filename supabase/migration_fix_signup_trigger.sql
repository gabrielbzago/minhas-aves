-- Apollo / Minhas Aves — corrigir o trigger de criação de conta
-- Execute no Supabase SQL Editor se o cadastro retornar "Database error saving new user".
-- Garante os campos usados pelo trigger mesmo em projetos que aplicaram
-- somente parte das migrations anteriores.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists criatorio_name text;
alter table public.profiles add column if not exists ctf_number text;
alter table public.profiles add column if not exists amador_trial_eligible boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, criatorio_name, ctf_number, amador_trial_eligible)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'criatorio_name', ''),
    nullif(new.raw_user_meta_data->>'ctf_number', ''),
    true
  )
  on conflict (id) do update set
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    criatorio_name = coalesce(public.profiles.criatorio_name, excluded.criatorio_name),
    ctf_number = coalesce(public.profiles.ctf_number, excluded.ctf_number);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Confirma que o trigger está instalado.
select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
  and trigger_name = 'on_auth_user_created';
