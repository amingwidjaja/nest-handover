-- Personal profile: WhatsApp + address for receipts / integrity
begin;

alter table public.profiles
  add column if not exists whatsapp text;

alter table public.profiles
  add column if not exists address text;

commit;
