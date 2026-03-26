-- Personal onboarding: GPS coordinates (float8 / double precision)
begin;

alter table public.profiles
  add column if not exists latitude double precision;

alter table public.profiles
  add column if not exists longitude double precision;

commit;
