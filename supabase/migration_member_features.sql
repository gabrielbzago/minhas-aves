-- ============================================================
-- Minhas Aves — RECURSOS EXCLUSIVOS PARA MEMBROS DO CANAL
-- O Owner libera recursos individualmente por usuário.
-- ============================================================
alter table public.profiles
  add column if not exists exclusive_features jsonb not null default '{}'::jsonb;

create index if not exists profiles_exclusive_features_gin_idx
  on public.profiles using gin (exclusive_features);

comment on column public.profiles.exclusive_features is
  'Recursos especiais liberados individualmente pelo Owner. Ex.: {"placas-gaiola-membros": true}';
