-- Run once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_moderator from public.profiles where id = uid), false);
$$;

create or replace function public.can_moderate_content(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select is_admin or is_moderator
      from public.profiles
      where id = uid
    ),
    false
  );
$$;

create or replace function public.protect_profile_flags()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin(auth.uid()) then
    new.is_admin := old.is_admin;
    new.is_banned := old.is_banned;
    new.nsfw_enabled := old.nsfw_enabled;
    new.is_moderator := old.is_moderator;
  end if;

  return new;
end;
$$;

-- Image approval: admins and moderators
create or replace function public.protect_post_image_approval()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.can_moderate_content(auth.uid()) then
    if tg_op = 'INSERT' then
      new.image_approved := false;
    elsif tg_op = 'UPDATE' then
      new.image_approved := old.image_approved;
    end if;
  end if;

  return new;
end;
$$;

drop policy if exists "Admins can moderate posts" on public.posts;
drop policy if exists "Staff can moderate posts" on public.posts;
create policy "Staff can moderate posts"
  on public.posts for update
  using (public.can_moderate_content(auth.uid()))
  with check (public.can_moderate_content(auth.uid()));

drop policy if exists "Authors or admins can delete posts" on public.posts;
drop policy if exists "Authors or staff can delete posts" on public.posts;
create policy "Authors or staff can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or public.can_moderate_content(auth.uid()));

drop policy if exists "Authors or admins can delete threads" on public.threads;
drop policy if exists "Authors or staff can delete threads" on public.threads;
create policy "Authors or staff can delete threads"
  on public.threads for delete
  using (auth.uid() = author_id or public.can_moderate_content(auth.uid()));
