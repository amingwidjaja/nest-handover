begin;

alter table handover
  add column if not exists destination_address text;

commit;
