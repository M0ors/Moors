-- Run once in Supabase SQL Editor (New query).

-- Sub-boards
create table if not exists public.sub_boards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  is_adult boolean not null default false,
  sort_order integer not null default 0,
  max_threads_per_user integer,
  op_only_replies boolean not null default false,
  allow_anonymous boolean not null default false,
  unique (board_id, slug)
);

create index if not exists sub_boards_board_id_idx on public.sub_boards (board_id, sort_order);

insert into public.boards (slug, name, description, is_adult, sort_order)
values ('other', 'Other', 'Gaming, coding, and miscellaneous', false, 3)
on conflict (slug) do nothing;

update public.boards set sort_order = 4 where slug = 'adult' and sort_order < 4;

insert into public.sub_boards (board_id, slug, name, description, is_adult, sort_order, max_threads_per_user, op_only_replies, allow_anonymous)
select b.id, v.slug, v.name, v.description, v.is_adult, v.sort_order, v.max_threads_per_user, v.op_only_replies, v.allow_anonymous
from public.boards b
join (
  values
    ('general', 'site-updates', 'Site updates', 'Announcements and site news', false, 1, null::integer, false, false),
    ('general', 'suggestions', 'Suggestions', 'Ideas and feedback', false, 2, null, false, false),
    ('stories', 'blogs', 'Blogs', 'Personal blogs — one thread per user; only the OP can reply', false, 1, 1, true, false),
    ('stories', 'quick-storytime', 'Quick storytime', 'Short stories and storytime posts', false, 2, null, false, false),
    ('stories', 'i-need-opinions', 'I need opinions', 'Ask for advice and opinions', false, 3, null, false, false),
    ('stories', 'confessions', 'Confessions', 'Adult confessions (NSFW)', true, 4, null, false, true),
    ('other', 'gaming', 'Gaming', 'Games and gaming discussion', false, 1, null, false, false),
    ('other', 'coding', 'Coding', 'Code, tools, and technical talk', false, 2, null, false, false),
    ('adult', 'images', 'Images', 'Adult images', true, 1, null, false, false),
    ('adult', 'cum', 'Cum', 'Adult discussion', true, 2, null, false, false),
    ('adult', 'deepthroat', 'Deepthroat', 'Adult discussion', true, 3, null, false, false),
    ('adult', 'camgirls', 'Camgirls', 'Adult discussion', true, 4, null, false, false),
    ('adult', 'bwc', 'BWC', 'Adult discussion', true, 5, null, false, false),
    ('adult', 'bbc', 'BBC', 'Adult discussion', true, 6, null, false, false)
) as v(board_slug, slug, name, description, is_adult, sort_order, max_threads_per_user, op_only_replies, allow_anonymous)
  on b.slug = v.board_slug
on conflict (board_id, slug) do nothing;

alter table public.threads
  add column if not exists sub_board_id uuid references public.sub_boards (id),
  add column if not exists is_anonymous boolean not null default false;

-- Backfill threads without a sub-board to each board's first sub-board
update public.threads t
set sub_board_id = sb.id
from public.sub_boards sb
where t.sub_board_id is null
  and sb.board_id = t.board_id
  and sb.sort_order = (
    select min(sb2.sort_order) from public.sub_boards sb2 where sb2.board_id = t.board_id
  );

alter table public.profiles
  add column if not exists top_likes text[] not null default '{}',
  add column if not exists top_dislikes text[] not null default '{}',
  add column if not exists display_badge_id uuid;

-- Badges
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  is_nsfw boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.profiles
  drop constraint if exists profiles_display_badge_id_fkey;

alter table public.profiles
  add constraint profiles_display_badge_id_fkey
  foreign key (display_badge_id) references public.badges (id) on delete set null;

insert into public.badges (slug, name, description, is_nsfw, sort_order)
values
  ('first_thread', 'First thread', 'Created your first thread', false, 1),
  ('first_reply', 'First reply', 'Posted your first reply', false, 2),
  ('first_like_received', 'First like received', 'Received your first like', false, 3),
  ('joined_adult', 'Joined adult board', 'Granted NSFW / Adult access', true, 4),
  ('coder', 'Coder', 'Created a thread in Coding', false, 5),
  ('writer', 'Writer', 'Created a thread in Quick storytime', false, 6),
  ('blogger', 'Blogger', 'Created a thread in Blogs', false, 7),
  ('staff', 'Staff', 'Site admin', false, 8),
  ('lots_of_love', 'Lots of love', 'Received 10 likes on one thread or reply', false, 9),
  ('bleached', 'Bleached', 'Posted in the BWC sub-board', true, 10),
  ('blacked', 'Blacked', 'Posted in the BBC sub-board', true, 11)
on conflict (slug) do nothing;

-- Username: letters, numbers, dot, underscore only (no spaces/other symbols)
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[A-Za-z0-9._]{3,24}$');

-- RLS
alter table public.sub_boards enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "Sub-boards are viewable by everyone" on public.sub_boards;
create policy "Sub-boards are viewable by everyone"
  on public.sub_boards for select using (true);

drop policy if exists "Admins manage sub-boards" on public.sub_boards;
create policy "Admins manage sub-boards"
  on public.sub_boards for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Badges are viewable by everyone" on public.badges;
create policy "Badges are viewable by everyone"
  on public.badges for select using (true);

drop policy if exists "Admins manage badges" on public.badges;
create policy "Admins manage badges"
  on public.badges for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "User badges are viewable by everyone" on public.user_badges;
create policy "User badges are viewable by everyone"
  on public.user_badges for select using (true);

drop policy if exists "Admins manage user badges" on public.user_badges;
create policy "Admins manage user badges"
  on public.user_badges for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users can insert own earned badges" on public.user_badges;
create policy "Users can insert own earned badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

-- Staff badge for existing admins
insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
cross join public.badges b
where p.is_admin = true and b.slug = 'staff'
on conflict do nothing;

-- Joined adult for users who already have NSFW
insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
cross join public.badges b
where p.nsfw_enabled = true and b.slug = 'joined_adult'
on conflict do nothing;
