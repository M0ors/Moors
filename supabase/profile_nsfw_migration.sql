-- Run once in Supabase SQL Editor (New query).

alter table public.profiles
  add column if not exists date_of_birth date;

alter table public.profiles
  add column if not exists username_color text;

alter table public.profiles
  add column if not exists about_me text;

alter table public.profiles
  add column if not exists country_code text;

alter table public.threads
  add column if not exists is_nsfw boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_username_color_check;

alter table public.profiles
  add constraint profiles_username_color_check
  check (
    username_color is null
    or username_color ~ '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$'
  );

alter table public.profiles
  drop constraint if exists profiles_country_code_check;

alter table public.profiles
  add constraint profiles_country_code_check
  check (
    country_code is null
    or country_code ~ '^[A-Z]{2}$'
  );

alter table public.profiles
  drop constraint if exists profiles_about_me_check;

alter table public.profiles
  add constraint profiles_about_me_check
  check (about_me is null or char_length(about_me) <= 500);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dob date;
begin
  begin
    dob := nullif(trim(new.raw_user_meta_data->>'date_of_birth'), '')::date;
  exception
    when others then
      dob := null;
  end;

  insert into public.profiles (id, username, date_of_birth)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      'user_' || left(replace(new.id::text, '-', ''), 8)
    ),
    dob
  );
  return new;
end;
$$;

drop policy if exists "Admins can update any thread" on public.threads;
create policy "Admins can update any thread"
  on public.threads for update
  using (public.is_admin(auth.uid()));

-- 1MB upload limit for images
update storage.buckets
set file_size_limit = 1048576
where id in ('post-images', 'avatars');

update storage.buckets
set
  file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'avatars';
