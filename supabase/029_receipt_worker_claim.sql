-- Atomic claim for receipt PDF worker (SKIP LOCKED, single row).
-- Edge Function `receipt-worker` calls this via RPC.

begin;

create or replace function public.claim_handover_receipt_job()
returns setof public.handover
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  select h.id into hid
  from public.handover h
  where h.receipt_status = 'pending'
    and h.status in ('received', 'accepted')
    and (h.receipt_url is null or trim(h.receipt_url) = '')
  order by h.received_at asc nulls last, h.created_at asc nulls last
  limit 1
  for update skip locked;

  if hid is null then
    return;
  end if;

  update public.handover
  set receipt_status = 'generating'
  where id = hid;

  return query select * from public.handover where id = hid;
end;
$$;

grant execute on function public.claim_handover_receipt_job() to service_role;

commit;
