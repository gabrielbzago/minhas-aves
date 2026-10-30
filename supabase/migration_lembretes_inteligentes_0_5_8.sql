-- Apollo / Minhas Aves v0.5.8
-- Lembretes inteligentes de choco e anilhamento.
-- Execute no SQL Editor do MESMO projeto Supabase usado pelo Apollo.
-- Esta migration preserva todos os eventos existentes.

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS incubation_start_date date NULL;

COMMENT ON COLUMN public.calendar_events.incubation_start_date IS
  'Data real em que a fêmea iniciou o choco; base para alertas no 11º, 12º e 13º dia.';

CREATE INDEX IF NOT EXISTS calendar_events_incubation_start_idx
  ON public.calendar_events (user_id, bird_id, incubation_start_date)
  WHERE event_type = 'postura' AND incubation_start_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS calendar_events_birth_reminder_idx
  ON public.calendar_events (user_id, bird_id, event_date)
  WHERE event_type IN ('nascimento', 'anilhamento');

-- A partir desta versão, os lembretes são calculados no painel:
-- • nascimento: 11º, 12º e 13º dia de choco;
-- • anilhamento: 3º ao 7º dia após o nascimento;
-- • o registro de nascimento/anilhamento encerra os alertas correspondentes.
-- Não é criada uma linha artificial por dia, evitando eventos duplicados.
