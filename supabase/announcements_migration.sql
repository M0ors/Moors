-- Run once in Supabase SQL Editor.
-- Admin announcements + voting support.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(trim(body)) between 1 and 10000),
  author_id uuid not null references public.profiles (id) on delete cascade,
  like_count integer not null default 0,
  dislike_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_created_at_idx
  on public.announcements (created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "Announcements are viewable by everyone" on public.announcements;
create policy "Announcements are viewable by everyone"
  on public.announcements for select using (true);

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Allow votes on announcements
alter table public.votes drop constraint if exists votes_target_type_check;
alter table public.votes
  add constraint votes_target_type_check
  check (target_type in ('thread', 'post', 'announcement'));

create or replace function public.refresh_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_type text;
  t_id uuid;
begin
  t_type := coalesce(new.target_type, old.target_type);
  t_id := coalesce(new.target_id, old.target_id);

  if t_type = 'thread' then
    update public.threads set
      like_count = (select count(*)::int from public.votes where target_type = 'thread' and target_id = t_id and value = 1),
      dislike_count = (select count(*)::int from public.votes where target_type = 'thread' and target_id = t_id and value = -1)
    where id = t_id;
  elsif t_type = 'post' then
    update public.posts set
      like_count = (select count(*)::int from public.votes where target_type = 'post' and target_id = t_id and value = 1),
      dislike_count = (select count(*)::int from public.votes where target_type = 'post' and target_id = t_id and value = -1)
    where id = t_id;
  elsif t_type = 'announcement' then
    update public.announcements set
      like_count = (select count(*)::int from public.votes where target_type = 'announcement' and target_id = t_id and value = 1),
      dislike_count = (select count(*)::int from public.votes where target_type = 'announcement' and target_id = t_id and value = -1),
      updated_at = now()
    where id = t_id;
  end if;

  return coalesce(new, old);
end;
$$;
