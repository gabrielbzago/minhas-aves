-- Apollo 0.5.63 — avaliações, sugestões e feedback dos usuários
create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  criatorio_name text,
  plan text not null default 'free' check (plan in ('free','amador','profissional','lenda')),
  priority text not null default 'normal' check (priority in ('normal','prioritaria','vip')),
  category text not null check (category in ('Avaliação do produto','Sugestão de melhoria','Problema ou erro','Nova funcionalidade','Experiência de uso')),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 8 and 3000),
  status text not null default 'novo' check (status in ('novo','em_analise','planejado','concluido','arquivado')),
  created_at timestamptz not null default now()
);

create index if not exists product_feedback_created_at_idx on public.product_feedback (created_at desc);
create index if not exists product_feedback_priority_status_idx on public.product_feedback (priority, status, created_at desc);
create index if not exists product_feedback_user_id_idx on public.product_feedback (user_id, created_at desc);

alter table public.product_feedback enable row level security;
drop policy if exists "Users can submit own product feedback" on public.product_feedback;
create policy "Users can submit own product feedback"
  on public.product_feedback for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users can read own product feedback" on public.product_feedback;
create policy "Users can read own product feedback"
  on public.product_feedback for select to authenticated
  using (auth.uid() = user_id);
