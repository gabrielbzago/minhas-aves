-- Minhas Aves — CTF opcional + cartão de gaiola frente/verso
-- Execute uma vez no Supabase SQL Editor.
alter table public.profiles add column if not exists ctf_number text;

-- Atualiza o trigger de criação para guardar o CTF informado no cadastro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, criatorio_name, ctf_number)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'criatorio_name',''),
    nullif(new.raw_user_meta_data->>'ctf_number','')
  )
  on conflict (id) do update set
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    criatorio_name = coalesce(public.profiles.criatorio_name, excluded.criatorio_name),
    ctf_number = coalesce(public.profiles.ctf_number, excluded.ctf_number);
  return new;
end;
$$;

-- Recria o trigger para usar a função atualizada.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
