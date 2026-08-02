-- Run once in Supabase SQL Editor (New query).

alter table public.posts
  add column if not exists is_pinned boolean not null default false;

alter table public.posts
  add column if not exists like_count integer not null default 0;

alter table public.posts
  add column if not exists dislike_count integer not null default 0;

alter table public.threads
  add column if not exists like_count integer not null default 0;

alter table public.threads
  add column if not exists dislike_count integer not null default 0;

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('thread', 'post')),
  target_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists votes_target_idx on public.votes (target_type, target_id);

alter table public.votes enable row level security;

drop policy if exists "Votes are viewable by everyone" on public.votes;
create policy "Votes are viewable by everyone"
  on public.votes for select using (true);

drop policy if exists "Authenticated users can cast votes" on public.votes;
create policy "Authenticated users can cast votes"
  on public.votes for insert
  with check (
    auth.uid() = user_id
    and coalesce((select is_banned from public.profiles where id = auth.uid()), false) = false
  );

drop policy if exists "Users can update their votes" on public.votes;
create policy "Users can update their votes"
  on public.votes for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their votes" on public.votes;
create policy "Users can delete their votes"
  on public.votes for delete
  using (auth.uid() = user_id);

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

  perform set_config('moors.allow_vote_count', '1', true);

  if t_type = 'thread' then
    update public.threads
    set
      like_count = (select count(*)::int from public.votes where target_type = 'thread' and target_id = t_id and value = 1),
      dislike_count = (select count(*)::int from public.votes where target_type = 'thread' and target_id = t_id and value = -1)
    where id = t_id;
  elsif t_type = 'post' then
    update public.posts
    set
      like_count = (select count(*)::int from public.votes where target_type = 'post' and target_id = t_id and value = 1),
      dislike_count = (select count(*)::int from public.votes where target_type = 'post' and target_id = t_id and value = -1)
    where id = t_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists votes_refresh_counts on public.votes;
create trigger votes_refresh_counts
  after insert or update or delete on public.votes
  for each row execute function public.refresh_vote_counts();

create or replace function public.can_pin_post(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.threads t
      where t.id = p_thread_id and t.author_id = auth.uid()
    );
$$;

drop policy if exists "Authors can update their posts" on public.posts;
drop policy if exists "Authors can update their post content" on public.posts;
create policy "Authors can update their post content"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "OP or admin can pin posts" on public.posts;
create policy "OP or admin can pin posts"
  on public.posts for update
  using (public.can_pin_post(thread_id))
  with check (public.can_pin_post(thread_id));

create or replace function public.protect_post_meta()
returns trigger
language plpgsql
as $$
begin
  if current_setting('moors.allow_vote_count', true) = '1' then
    return new;
  end if;

  new.like_count := old.like_count;
  new.dislike_count := old.dislike_count;

  if not public.can_pin_post(new.thread_id) then
    new.is_pinned := old.is_pinned;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_protect_meta on public.posts;
create trigger posts_protect_meta
  before update on public.posts
  for each row execute function public.protect_post_meta();

create or replace function public.protect_thread_meta()
returns trigger
language plpgsql
as $$
begin
  if current_setting('moors.allow_vote_count', true) = '1' then
    return new;
  end if;

  new.like_count := old.like_count;
  new.dislike_count := old.dislike_count;
  return new;
end;
$$;

drop trigger if exists threads_protect_meta on public.threads;
create trigger threads_protect_meta
  before update on public.threads
  for each row execute function public.protect_thread_meta();
