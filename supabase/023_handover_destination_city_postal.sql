begin;

alter table handover
  add column if not exists destination_city text;

alter table handover
  add column if not exists destination_postal_code text;

commit;
