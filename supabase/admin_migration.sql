-- Run once in Supabase SQL Editor (New query).
-- Then promote yourself:
--   update public.profiles set is_admin = true where username = 'YOUR_USERNAME';

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  add column if not exists is_banned boolean not null default false;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

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

drop trigger if exists profiles_protect_flags on public.profiles;
create trigger profiles_protect_flags
  before update on public.profiles
  for each row execute function public.protect_profile_flags();

drop policy if exists "Authors can delete their threads" on public.threads;
create policy "Authors or admins can delete threads"
  on public.threads for delete
  using (auth.uid() = author_id or public.is_admin(auth.uid()));

drop policy if exists "Authors can update their posts" on public.posts;
create policy "Authors can update their posts"
  on public.posts for update
  using (auth.uid() = author_id);

drop policy if exists "Authors can delete their posts" on public.posts;
create policy "Authors or admins can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin(auth.uid()));

drop policy if exists "Authenticated users can create threads" on public.threads;
create policy "Authenticated non-banned users can create threads"
  on public.threads for insert
  with check (
    auth.uid() = author_id
    and coalesce((select is_banned from public.profiles where id = auth.uid()), false) = false
  );

drop policy if exists "Authenticated users can create posts" on public.posts;
create policy "Authenticated non-banned users can create posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and coalesce((select is_banned from public.profiles where id = auth.uid()), false) = false
  );

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin(auth.uid()));
