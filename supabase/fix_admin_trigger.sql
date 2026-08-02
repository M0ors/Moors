-- Run this in Supabase SQL Editor, then promote yourself again.

create or replace function public.protect_profile_flags()
returns trigger
language plpgsql
as $$
begin
  -- SQL Editor / service role have no JWT; allow those updates.
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin(auth.uid()) then
    new.is_admin := old.is_admin;
    new.is_banned := old.is_banned;
  end if;

  return new;
end;
$$;

-- Replace YOUR_USERNAME with your real username:
update public.profiles
set is_admin = true
where username = 'YOUR_USERNAME';

-- Confirm it stuck:
select id, username, is_admin from public.profiles;
