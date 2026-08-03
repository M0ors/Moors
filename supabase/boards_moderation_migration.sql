-- Run once in Supabase SQL Editor (New query).

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  is_adult boolean not null default false,
  sort_order integer not null default 0
);

insert into public.boards (slug, name, description, is_adult, sort_order)
values
  ('general', 'General', 'General discussion', false, 1),
  ('stories', 'Stories', 'Stories and creative writing', false, 2),
  ('adult', 'Adult', 'Adult content for NSFW-enabled users 18+', true, 3)
on conflict (slug) do nothing;

alter table public.threads
  add column if not exists board_id uuid references public.boards (id);

update public.threads t
set board_id = b.id
from public.boards b
where t.board_id is null and b.slug = 'general';

alter table public.threads
  alter column board_id set not null;

create index if not exists threads_board_id_idx on public.threads (board_id);

alter table public.profiles
  add column if not exists nsfw_enabled boolean not null default false;

alter table public.posts
  add column if not exists image_approved boolean not null default false;

-- Existing images stay visible; new uploads start unapproved.
update public.posts
set image_approved = true
where image_url is not null and image_approved = false;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 120),
  age integer not null check (age >= 13 and age <= 120),
  access_wanted text not null check (char_length(trim(access_wanted)) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists access_requests_status_idx
  on public.access_requests (status, created_at desc);

alter table public.boards enable row level security;
alter table public.access_requests enable row level security;

drop policy if exists "Boards are viewable by everyone" on public.boards;
create policy "Boards are viewable by everyone"
  on public.boards for select using (true);

drop policy if exists "Users can view own access requests" on public.access_requests;
create policy "Users can view own access requests"
  on public.access_requests for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can create access requests" on public.access_requests;
create policy "Users can create access requests"
  on public.access_requests for insert
  with check (
    auth.uid() = user_id
    and coalesce((select is_banned from public.profiles where id = auth.uid()), false) = false
  );

drop policy if exists "Admins can update access requests" on public.access_requests;
create policy "Admins can update access requests"
  on public.access_requests for update
  using (public.is_admin(auth.uid()));

-- Only admins can approve images; new uploads always start unapproved.
create or replace function public.protect_post_image_approval()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin(auth.uid()) then
    if tg_op = 'INSERT' then
      new.image_approved := false;
    elsif tg_op = 'UPDATE' then
      new.image_approved := old.image_approved;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_protect_image_approval on public.posts;
create trigger posts_protect_image_approval
  before insert or update on public.posts
  for each row execute function public.protect_post_image_approval();

drop policy if exists "Admins can moderate posts" on public.posts;
create policy "Admins can moderate posts"
  on public.posts for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create index if not exists posts_pending_images_idx
  on public.posts (created_at desc)
  where image_url is not null and image_approved = false;
