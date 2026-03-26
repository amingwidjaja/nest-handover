-- ============================================================
-- 035_auto_accept_cron.sql  
-- Versi final — tidak butuh app.service_key config
-- Menggunakan anon key untuk pg_net (Edge Fn verify via custom header)
-- ============================================================

begin;

-- ============================================================
-- PART 1: AUTO-ACCEPT via pg_cron (setiap jam)
-- ============================================================

select cron.schedule(
  'auto-accept-stale-handovers',
  '0 * * * *',
  $$
    update public.handover
    set status = 'accepted'
    where
      status = 'received'
      and received_at < now() - interval '3 days'
      and record_status = 'active';
  $$
);

-- ============================================================
-- PART 2: pg_net trigger on status → 'accepted'
-- Pakai anon key (aman karena Edge Fn verify x-internal-secret)
-- Anon key tidak sensitif — boleh ada di DB function
-- ============================================================

create or replace function fn_on_handover_accepted()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_fn_url text := 'https://hvuvtepwwjpovzauxrjg.supabase.co/functions/v1/notify-handover';
  -- Anon key: aman untuk dipakai di sini karena Edge Fn verify x-internal-secret
  anon_key    text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXZ0ZXB3d2pwb3Z6YXV4cmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzc5NjcsImV4cCI6MjA4ODk1Mzk2N30.m9SL91Y_JUE5RGTBnXBMvMqEjwxv8Yd0nLMCAjuNmoo';
  -- Internal secret untuk verifikasi di Edge Fn (set di Supabase Secrets)
  int_secret  text := 'nest76-internal-2026';
begin
  if (OLD.status = NEW.status) or (NEW.status <> 'accepted') then
    return NEW;
  end if;

  if NEW.receipt_status = 'done' then
    return NEW;
  end if;

  perform net.http_post(
    url     := edge_fn_url,
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'Authorization',     'Bearer ' || anon_key,
      'x-internal-secret', int_secret
    ),
    body    := jsonb_build_object(
      'handover_id', NEW.id,
      'new_status',  'accepted',
      'old_status',  OLD.status
    )
  );

  return NEW;

exception when others then
  raise warning '[fn_on_handover_accepted] error: %', sqlerrm;
  return NEW;
end;
$$;

drop trigger if exists trg_on_handover_accepted on public.handover;

create trigger trg_on_handover_accepted
after update of status on public.handover
for each row
execute function fn_on_handover_accepted();

commit;
