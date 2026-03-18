-- 018_receive_status_single_source.sql
-- Purpose:
-- - Make DB the single source of truth for handover status after receive_event insert
-- - Allow valid status values including 'accepted'
-- - Ensure receiver_type exists and is validated
-- - Replace old trigger with deterministic status update logic

begin;

-- 1) handover.status constraint
alter table if exists handover
drop constraint if exists handover_status_check;

alter table if exists handover
add constraint handover_status_check
check (status in ('draft', 'created', 'received', 'accepted'));

-- 2) ensure receive_event.receiver_type exists
alter table if exists receive_event
add column if not exists receiver_type text;

-- 3) receiver_type constraint
alter table if exists receive_event
drop constraint if exists receive_event_receiver_type_check;

alter table if exists receive_event
add constraint receive_event_receiver_type_check
check (receiver_type in ('direct', 'proxy'));

-- 4) replace trigger function
create or replace function mark_handover_received()
returns trigger
language plpgsql
as $$
begin
  update handover
  set
    status = case
      when new.receiver_type = 'direct' then 'accepted'
      else 'received'
    end,
    received_at = coalesce(received_at, now())
  where id = new.handover_id
    and status in ('created', 'received');

  return new;
end;
$$;

-- 5) replace trigger
drop trigger if exists trg_receive_event_update_handover on receive_event;

create trigger trg_receive_event_update_handover
after insert on receive_event
for each row
execute function mark_handover_received();

commit;