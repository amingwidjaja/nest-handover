-- Tanda Terima Digital: human-readable serial per user (Initials-YYMM-Seq)
begin;

alter table public.handover
  add column if not exists serial_number text;

-- Same display value may exist for different users; enforce uniqueness per owner.
drop index if exists handover_serial_number_key;
create unique index if not exists handover_user_serial_key
  on public.handover (user_id, serial_number)
  where serial_number is not null;

create table if not exists public.handover_serial_counter (
  user_id uuid not null references auth.users (id) on delete cascade,
  yymm text not null,
  last_seq integer not null default 0,
  primary key (user_id, yymm)
);

create or replace function public.next_handover_serial_number(
  p_user_id uuid,
  p_sender_name text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type public.user_type_enum;
  v_company text;
  v_label text;
  v_initials text;
  v_clean text;
  v_yymm text;
  v_next int;
begin
  if auth.uid() is not null and auth.uid() is distinct from p_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select user_type, company_name into v_type, v_company
  from public.profiles
  where id = p_user_id;

  if v_type is not null
     and v_type::text = 'umkm'
     and v_company is not null
     and trim(v_company) <> '' then
    v_label := trim(v_company);
  else
    v_label := coalesce(nullif(trim(p_sender_name), ''), 'User');
  end if;

  v_clean := upper(regexp_replace(v_label, '[^a-zA-Z]', '', 'g'));
  if v_clean is null or length(v_clean) < 1 then
    v_initials := 'XX';
  elsif length(v_clean) = 1 then
    v_initials := v_clean || 'X';
  else
    v_initials := substring(v_clean from 1 for 2);
  end if;

  v_yymm := to_char((now() at time zone 'Asia/Jakarta'), 'YYMM');

  insert into public.handover_serial_counter (user_id, yymm, last_seq)
  values (p_user_id, v_yymm, 1)
  on conflict (user_id, yymm)
  do update set last_seq = public.handover_serial_counter.last_seq + 1
  returning last_seq into v_next;

  return v_initials || '-' || v_yymm || '-' || lpad(v_next::text, 4, '0');
end;
$$;

grant execute on function public.next_handover_serial_number(uuid, text) to service_role;

commit;
