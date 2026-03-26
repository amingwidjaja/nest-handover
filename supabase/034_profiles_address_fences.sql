-- Structured address "fences" for logistics (street, district, city, postal)
begin;

alter table public.profiles
  add column if not exists street_address text;

alter table public.profiles
  add column if not exists district text;

alter table public.profiles
  add column if not exists city text;

alter table public.profiles
  add column if not exists postal_code text;

commit;
