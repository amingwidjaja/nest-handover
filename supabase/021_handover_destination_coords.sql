-- Delivery destination for GPS radius validation (location confirm API)
begin;

alter table handover
  add column if not exists destination_lat numeric;

alter table handover
  add column if not exists destination_lng numeric;

commit;
