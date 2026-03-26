-- ============================================================
-- 035_auto_accept_and_notify.sql
-- Purpose:
--   1. pg_cron job: auto-accept handovers received > 3 days ago
--   2. pg_net trigger: fire Edge Function notify-handover on status change
-- ============================================================

begin;

-- ============================================================
-- PART 1: AUTO-ACCEPT via pg_cron
-- Runs every hour. Sets status = 'accepted' for handovers
-- that have been in 'received' state for > 3 days.
-- The existing DB trigger (trg_receive_event_update_handover)
-- handles direct → accepted. This handles the proxy timeout.
-- ============================================================

select cron.schedule(
  'auto-accept-stale-handovers',
  '0 * * * *',  -- every hour
  $$
    update public.handover
    set
      status = 'accepted',
      receipt_status = case
        when receipt_status = 'pending' then 'pending'
        else receipt_status
      end
    where
      status = 'received'
      and received_at < now() - interval '3 days'
      and record_status = 'active';
  $$
);


-- ============================================================
-- PART 2: pg_net trigger on handover status → received/accepted
-- Calls Edge Function notify-handover with the handover id.
-- The Edge Function handles all routing (WA, PDF, etc.)
-- ============================================================

create or replace function fn_notify_handover_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_url text;
  service_key text;
begin
  -- Only fire on meaningful status transitions
  if (OLD.status = NEW.status) then
    return NEW;
  end if;

  if (NEW.status not in ('received', 'accepted')) then
    return NEW;
  end if;

  -- Get env vars from vault or config
  edge_url := current_setting('app.supabase_edge_url', true);
  service_key := current_setting('app.supabase_service_key', true);

  if edge_url is null or service_key is null then
    raise warning '[fn_notify_handover_status_change] edge_url or service_key not configured';
    return NEW;
  end if;

  -- Fire-and-forget HTTP to Edge Function
  perform net.http_post(
    url     := edge_url || '/notify-handover',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body    := jsonb_build_object(
      'handover_id', NEW.id,
      'new_status',  NEW.status,
      'old_status',  OLD.status
    )
  );

  return NEW;

exception when others then
  -- Never block the status update
  raise warning '[fn_notify_handover_status_change] pg_net error: %', sqlerrm;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_handover_status_change on public.handover;

create trigger trg_notify_handover_status_change
after update of status on public.handover
for each row
execute function fn_notify_handover_status_change();


commit;
