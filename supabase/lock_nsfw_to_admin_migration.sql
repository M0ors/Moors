-- Run once in Supabase SQL Editor.
-- Locks profiles.nsfw_enabled so only admins (or SQL Editor) can change it.

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
    new.nsfw_enabled := old.nsfw_enabled;
  end if;

  return new;
end;
$$;
