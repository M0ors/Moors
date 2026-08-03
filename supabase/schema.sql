-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  author_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.posts (id) on delete cascade,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_body_or_image_check check (
    (char_length(trim(body)) between 1 and 10000)
    or image_url is not null
  )
);

create index threads_updated_at_idx on public.threads (updated_at desc);
create index posts_thread_id_idx on public.posts (thread_id, created_at);
create index posts_parent_id_idx on public.posts (parent_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger threads_updated_at
  before update on public.threads
  for each row execute function public.handle_updated_at();

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

create or replace function public.bump_thread_on_post()
returns trigger
language plpgsql
as $$
begin
  update public.threads
  set updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

create trigger posts_bump_thread
  after insert on public.posts
  for each row execute function public.bump_thread_on_post();

alter table public.profiles enable row level security;
alter table public.threads enable row level security;
alter table public.posts enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Threads are viewable by everyone"
  on public.threads for select using (true);

create policy "Authenticated non-banned users can create threads"
  on public.threads for insert
  with check (
    auth.uid() = author_id
    and coalesce((select is_banned from public.profiles where id = auth.uid()), false) = false
  );

create policy "Authors can update their threads"
  on public.threads for update
  using (auth.uid() = author_id);

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
    new.nsfw_enabled := old.nsfw_enabled;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_flags
  before update on public.profiles
  for each row execute function public.protect_profile_flags();

create policy "Authors or admins can delete threads"
  on public.threads for delete
  using (auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Authenticated non-banned users can create posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and coalesce((select is_banned from public.profiles where id = auth.uid()), false) = false
  );

create policy "Authors can update their posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Authors or admins can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin(auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      'user_' || left(replace(new.id::text, '-', ''), 8)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Post images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users can upload post images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their post images"
  on storage.objects for update
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their post images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
