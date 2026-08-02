-- Run once in Supabase SQL Editor (New query).

alter table public.posts
  add column if not exists image_url text;

alter table public.posts
  add column if not exists parent_id uuid references public.posts (id) on delete cascade;

create index if not exists posts_parent_id_idx on public.posts (parent_id);

alter table public.posts drop constraint if exists posts_body_check;

alter table public.posts drop constraint if exists posts_body_or_image_check;

alter table public.posts
  add constraint posts_body_or_image_check
  check (
    (char_length(trim(body)) between 1 and 10000)
    or image_url is not null
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
