-- Apollo 0.5.99: auditoria de pagamentos Pix e aviso de vencimento
alter table public.profiles
  add column if not exists pix_last_paid_at timestamptz,
  add column if not exists pix_payment_intent_id text,
  add column if not exists pix_expiry_notice_sent_at timestamptz;

create index if not exists profiles_pix_expiry_idx
  on public.profiles (current_period_end)
  where subscription_status = 'pix_active';
