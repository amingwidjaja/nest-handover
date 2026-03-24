-- Onboarding fields: display name, UMKM address, completion marker
begin;

alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  add column if not exists company_address text;

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

-- Akun yang sudah ada sebelum fitur ini dianggap sudah onboarding.
update public.profiles
  set onboarded_at = coalesce(onboarded_at, now())
  where onboarded_at is null;

commit;
