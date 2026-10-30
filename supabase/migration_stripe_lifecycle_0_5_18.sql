-- Apollo 0.5.18 — controle e auditoria do ciclo de assinaturas Stripe
-- Execute no Supabase SQL Editor após as migrations anteriores.
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists subscription_status text not null default 'inactive';
alter table public.profiles add column if not exists current_period_start timestamptz;
alter table public.profiles add column if not exists current_period_end timestamptz;

create table if not exists public.stripe_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_price_id text,
  plan text not null check (plan in ('amador','profissional','lenda')),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  latest_event_type text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists stripe_subscriptions_user_idx
  on public.stripe_subscriptions(user_id, created_at desc);
create index if not exists stripe_subscriptions_customer_idx
  on public.stripe_subscriptions(stripe_customer_id);

alter table public.stripe_subscriptions enable row level security;
drop policy if exists "stripe_subscriptions_read_own" on public.stripe_subscriptions;
create policy "stripe_subscriptions_read_own" on public.stripe_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.stripe_subscriptions from anon, authenticated;

-- A tabela de eventos é privada: somente service_role (webhook) pode escrever/ler.
alter table public.subscription_events enable row level security;
revoke all on public.subscription_events from anon, authenticated;
