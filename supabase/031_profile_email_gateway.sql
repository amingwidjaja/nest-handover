begin;

create or replace function public.profile_exists_for_email(p_email text)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1
    from auth.users u
    inner join public.profiles p on p.id = u.id
    where lower(trim(u.email::text)) = lower(trim(p_email))
  );
$$;

revoke all on function public.profile_exists_for_email(text) from public;
grant execute on function public.profile_exists_for_email(text) to service_role;

commit;
