-- Receipt PDF worker: claim jobs + index for accepted handovers missing receipt
begin;

alter table public.handover
  add column if not exists receipt_status text default 'pending';

comment on column public.handover.receipt_status is
  'pending | processing | done | failed — PDF worker state (Edge Function).';

-- Fast lookup for cron: accepted, no receipt yet, eligible to claim
create index if not exists idx_handover_accepted_no_receipt
  on public.handover (created_at asc)
  where status = 'accepted' and receipt_url is null;

-- Atomically claim one handover for PDF generation (SKIP LOCKED for concurrent workers)
create or replace function public.claim_handover_receipt_job()
returns uuid
language sql
security definer
set search_path = public
as $$
  with picked as (
    select id
    from public.handover
    where status = 'accepted'
      and receipt_url is null
      and (receipt_status is null or receipt_status in ('pending', 'failed'))
    order by received_at asc nulls last, created_at asc
    limit 1
    for update skip locked
  ),
  upd as (
    update public.handover h
    set receipt_status = 'processing'
    from picked
    where h.id = picked.id
    returning h.id
  )
  select id from upd limit 1;
$$;

revoke all on function public.claim_handover_receipt_job() from public;
grant execute on function public.claim_handover_receipt_job() to service_role;

commit;

-- Optional: invoke Edge Function on a schedule (Supabase Dashboard → Integrations → Cron, or pg_cron):
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/generate-receipts',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
-- Or use Supabase "Scheduled Functions" / external cron hitting the function URL with anon/service JWT.
