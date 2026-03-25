-- Notes + explicit receiver_* fields for receipt UI (WhatsApp / email mapping).
begin;

alter table public.handover add column if not exists notes text;

alter table public.handover add column if not exists receiver_whatsapp text;

alter table public.handover add column if not exists receiver_contact text;

alter table public.handover add column if not exists receiver_email text;

-- One-time backfill from legacy columns (does not change receiver_target_*).
update public.handover
set receiver_contact = receiver_target_phone
where receiver_contact is null
  and receiver_target_phone is not null
  and trim(receiver_target_phone) <> '';

update public.handover
set receiver_email = receiver_target_email
where receiver_email is null
  and receiver_target_email is not null
  and trim(receiver_target_email) <> '';

commit;
