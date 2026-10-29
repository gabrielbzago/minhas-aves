-- Diagnóstico somente de leitura para falha no cadastro do Apollo.
-- Não retorna senhas, tokens ou chaves.

-- 1) Trigger ativo em auth.users.
select trigger_name, event_manipulation, action_timing, action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
order by trigger_name;

-- 2) Colunas e defaults de public.profiles.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 3) Constraints da tabela profiles.
select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass
order by conname;

-- 4) Confirme se a conta correta já existe (não mostra credenciais).
select id, email, created_at, email_confirmed_at
from auth.users
where lower(email) = lower('kaique_marquess@hotmail.com');
