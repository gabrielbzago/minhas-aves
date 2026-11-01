-- Apollo 0.5.57 — controle de uso mensal do Cadastro Inteligente por Foto
create table if not exists public.ai_bird_scan_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_month text not null,
  created_at timestamptz not null default now(),
  constraint ai_bird_scan_usage_month_format check (usage_month ~ '^[0-9]{4}-[0-9]{2}$')
);

create index if not exists idx_ai_bird_scan_usage_user_month
  on public.ai_bird_scan_usage (user_id, usage_month);

alter table public.ai_bird_scan_usage enable row level security;

drop policy if exists "Users can read own AI bird scan usage" on public.ai_bird_scan_usage;
create policy "Users can read own AI bird scan usage"
  on public.ai_bird_scan_usage for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI bird scan usage" on public.ai_bird_scan_usage;
create policy "Users can insert own AI bird scan usage"
  on public.ai_bird_scan_usage for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Sem permissões de UPDATE/DELETE para usuários comuns.
revoke all on table public.ai_bird_scan_usage from anon;
grant select, insert on table public.ai_bird_scan_usage to authenticated;
