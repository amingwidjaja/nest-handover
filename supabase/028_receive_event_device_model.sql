-- Friendly device label (e.g. platform / model) alongside device_id (fingerprint / UA)
alter table public.receive_event
  add column if not exists device_model text;
