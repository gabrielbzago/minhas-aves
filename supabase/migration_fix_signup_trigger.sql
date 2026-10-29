-- Apollo / Minhas Aves — reparo definitivo do cadastro Supabase
-- Execute no SQL Editor ANTES de tentar criar a conta novamente.
-- Esta migration mantém o trigger simples e compatível com o schema principal.

begin;

-- Colunas que o cadastro atual utiliza ou que migrations comerciais esperam.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists criatorio_name text;
alter table public.profiles add column if not exists ctf_number text;
alter table public.profiles add column if not exists amador_trial_eligible boolean not null default false;
alter table public.profiles add column if not exists amador_trial_started_at timestamptz;
alter table public.profiles add column if not exists amador_trial_ends_at timestamptz;
alter table public.profiles add column if not exists role text not null default 'creator';
alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles add column if not exists bonus_birds integer not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- O trigger cria somente o perfil básico. Campos promocionais e de veterinário
-- usam defaults/atualizações posteriores, evitando que uma coluna opcional ou
-- uma atualização de perfil impeça a criação da conta em auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, full_name, criatorio_name, ctf_number)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    nullif(trim(new.raw_user_meta_data ->> 'criatorio_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'ctf_number'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- Garante um único trigger de criação de perfil.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

commit;

-- Resultado esperado: uma linha chamada on_auth_user_created.
select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
  and trigger_name = 'on_auth_user_created';
