-- Apollo / Minhas Aves — Calendário reprodutivo e desempenho em torneios
-- Execute no Supabase SQL Editor do projeto de produção.
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bird_id uuid not null references public.birds(id) on delete cascade,
  event_type text not null check (event_type in ('postura','gala','nascimento','anilhamento','torneio')),
  event_date date not null,
  title text not null,
  location text,
  egg_count integer check (egg_count is null or egg_count >= 0),
  chick_count integer check (chick_count is null or chick_count >= 0),
  song_count integer check (song_count is null or song_count >= 0),
  ring_days_after integer check (ring_days_after is null or ring_days_after between 3 and 7),
  source_event_id uuid references public.calendar_events(id) on delete cascade,
  result text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.calendar_events add column if not exists source_event_id uuid references public.calendar_events(id) on delete cascade;
create index if not exists calendar_events_user_date_idx on public.calendar_events(user_id,event_date);
create index if not exists calendar_events_bird_date_idx on public.calendar_events(bird_id,event_date);
drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at before update on public.calendar_events
for each row execute procedure public.set_updated_at();
alter table public.calendar_events enable row level security;
drop policy if exists "Users can view own calendar events" on public.calendar_events;
drop policy if exists "Users can create own calendar events" on public.calendar_events;
drop policy if exists "Users can update own calendar events" on public.calendar_events;
drop policy if exists "Users can delete own calendar events" on public.calendar_events;
create policy "Users can view own calendar events" on public.calendar_events for select using (auth.uid() = user_id);
create policy "Users can create own calendar events" on public.calendar_events for insert with check (auth.uid() = user_id and exists(select 1 from public.birds b where b.id=bird_id and b.user_id=auth.uid()));
create policy "Users can update own calendar events" on public.calendar_events for update using (auth.uid() = user_id and exists(select 1 from public.birds b where b.id=bird_id and b.user_id=auth.uid())) with check (auth.uid() = user_id and exists(select 1 from public.birds b where b.id=bird_id and b.user_id=auth.uid()));
create policy "Users can delete own calendar events" on public.calendar_events for delete using (auth.uid() = user_id);
