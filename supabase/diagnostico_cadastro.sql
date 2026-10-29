-- Apollo / Minhas Aves — diagnóstico do erro de cadastro
-- Execute no Supabase SQL Editor e envie os resultados (sem compartilhar senhas/chaves).

-- 1) Todos os triggers instalados em auth.users, não apenas o trigger esperado.
select t.tgname as trigger_name, pg_get_triggerdef(t.oid) as trigger_definition,
       p.proname as function_name, pg_get_functiondef(p.oid) as function_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal
order by t.tgname;

-- 2) Colunas obrigatórias da tabela profiles.
select column_name, data_type, is_nullable, column_default, udt_name
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 3) Restrições de profiles que podem rejeitar o perfil recém-criado.
select conname as constraint_name, contype as constraint_type, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.profiles'::regclass
order by conname;

-- 4) Verifique se a conta já existe. Ajuste o e-mail para a conta que foi tentada.
select id, email, created_at, email_confirmed_at
from auth.users
where lower(email) = lower('kaique_marquess@hotmail.com');
