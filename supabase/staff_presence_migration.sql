-- Run once in Supabase SQL Editor.
-- Tracks recent click/activity for staff presence dots.

alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists profiles_last_active_at_idx
  on public.profiles (last_active_at desc nulls last);

create index if not exists profiles_staff_idx
  on public.profiles (is_admin, is_moderator)
  where is_admin = true or is_moderator = true;
