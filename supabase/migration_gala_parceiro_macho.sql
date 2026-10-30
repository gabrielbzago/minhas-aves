-- Apollo / Minhas Aves — Vincular a gala à fêmea e ao macho do plantel
-- Execute no SQL Editor do MESMO projeto Supabase já utilizado pelo Apollo.
-- A alteração preserva os eventos antigos; galas antigas continuam com partner_bird_id nulo.

alter table public.calendar_events
  add column if not exists partner_bird_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'calendar_events_partner_bird_id_fkey'
      and conrelid = 'public.calendar_events'::regclass
  ) then
    alter table public.calendar_events
      add constraint calendar_events_partner_bird_id_fkey
      foreign key (partner_bird_id) references public.birds(id) on delete set null;
  end if;
end $$;

create index if not exists calendar_events_partner_bird_date_idx
  on public.calendar_events(partner_bird_id, event_date)
  where partner_bird_id is not null;

-- Reforça o isolamento por usuário também para o macho parceiro.
drop policy if exists "Users can create own calendar events" on public.calendar_events;
create policy "Users can create own calendar events"
on public.calendar_events for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.birds b
    where b.id = bird_id and b.user_id = auth.uid()
  )
  and (
    partner_bird_id is null
    or exists (
      select 1 from public.birds p
      where p.id = partner_bird_id and p.user_id = auth.uid() and p.sex = 'macho'
    )
  )
);

drop policy if exists "Users can update own calendar events" on public.calendar_events;
create policy "Users can update own calendar events"
on public.calendar_events for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.birds b
    where b.id = bird_id and b.user_id = auth.uid()
  )
  and (
    partner_bird_id is null
    or exists (
      select 1 from public.birds p
      where p.id = partner_bird_id and p.user_id = auth.uid() and p.sex = 'macho'
    )
  )
);
