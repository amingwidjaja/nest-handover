begin;

-- =========================
-- 1. STATUS CONSTRAINT
-- =========================

alter table if exists handover
drop constraint if exists handover_status_check;

alter table if exists handover
add constraint handover_status_check
check (status in ('draft','created','received','accepted'));



-- =========================
-- 2. RECEIVE_EVENT STRUCTURE
-- =========================

alter table if exists receive_event
add column if not exists receiver_type text;

alter table if exists receive_event
drop constraint if exists receive_event_receiver_type_check;

alter table if exists receive_event
add constraint receive_event_receiver_type_check
check (receiver_type in ('direct','proxy'));



-- =========================
-- 3. DROP OLD TRIGGER
-- =========================

drop trigger if exists trg_receive_event_update_handover on receive_event;
drop function if exists mark_handover_received;



-- =========================
-- 4. NEW DERIVATION FUNCTION
-- =========================

create or replace function derive_handover_status()
returns trigger
language plpgsql
as $$
begin

  -- FINAL state guard (no override accepted)
  if exists (
    select 1 from handover
    where id = new.handover_id
      and status = 'accepted'
  ) then
    return new;
  end if;

  -- DIRECT → ACCEPTED (highest priority)
  if new.receiver_type = 'direct' then

    update handover
    set
      status = 'accepted',
      received_at = coalesce(received_at, now())
    where id = new.handover_id;

    return new;
  end if;

  -- PROXY → RECEIVED (only if still created)
  if new.receiver_type = 'proxy' then

    update handover
    set
      status = 'received',
      received_at = coalesce(received_at, now())
    where id = new.handover_id
      and status = 'created';

    return new;
  end if;

  return new;

end;
$$;



-- =========================
-- 5. ATTACH TRIGGER
-- =========================

create trigger trg_receive_event_update_handover
after insert on receive_event
for each row
execute function derive_handover_status();



commit;