-- Apollo 0.5.44 — Campo CTF nas configurações do criador
-- Execute no SQL Editor do Supabase caso a coluna ainda não exista.
alter table public.profiles
  add column if not exists ctf_number text;

comment on column public.profiles.ctf_number is
  'Número de registro do criador no Cadastro Técnico Federal (CTF/IBAMA), usado nos cartões de identificação.';
