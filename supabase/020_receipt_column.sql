alter table handover
add column if not exists receipt_url text;

alter table handover
add column if not exists receipt_generated_at timestamp;