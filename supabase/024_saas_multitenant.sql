-- NEST SaaS: multi-tenant prep, wipe handover data, profiles, ownership, archive flag
begin;

-- ---------------------------------------------------------------------------
-- 1) Clean slate: remove all handover rows (and dependent receive_event / items)
-- ---------------------------------------------------------------------------
truncate table public.handover cascade;

-- ---------------------------------------------------------------------------
-- 2) User type enum + profiles
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.user_type_enum as enum ('personal', 'umkm');
exception
  when duplicate_object then null;
end$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_type public.user_type_enum not null default 'personal',
  company_name text,
  company_logo_url text,
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists user_type public.user_type_enum not null default 'personal';

alter table public.profiles
  add column if not exists company_name text;

alter table public.profiles
  add column if not exists company_logo_url text;

-- ---------------------------------------------------------------------------
-- 3) Auto-create profile row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4) handover: owner, sender address blob, SaaS record status (active vs archived)
-- ---------------------------------------------------------------------------
alter table public.handover
  add column if not exists sender_address_info jsonb not null default '{}'::jsonb;

alter table public.handover
  add column if not exists record_status text not null default 'active';

do $$
begin
  alter table public.handover
    drop constraint if exists handover_record_status_check;
exception
  when undefined_object then null;
end$$;

alter table public.handover
  add constraint handover_record_status_check
  check (record_status in ('active', 'archived'));

-- Owner: empty table after truncate; NOT NULL is valid
alter table public.handover
  add column if not exists user_id uuid not null references auth.users (id) on delete cascade;

create index if not exists idx_handover_user_record_active
  on public.handover (user_id, record_status)
  where record_status = 'active';

commit;
