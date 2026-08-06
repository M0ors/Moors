-- Run once in Supabase SQL Editor.
-- Public badge artwork bucket (admin-managed).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'badges',
  'badges',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Badge images are publicly accessible" on storage.objects;
create policy "Badge images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'badges');

drop policy if exists "Admins can upload badge images" on storage.objects;
create policy "Admins can upload badge images"
  on storage.objects for insert
  with check (
    bucket_id = 'badges'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can update badge images" on storage.objects;
create policy "Admins can update badge images"
  on storage.objects for update
  using (
    bucket_id = 'badges'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can delete badge images" on storage.objects;
create policy "Admins can delete badge images"
  on storage.objects for delete
  using (
    bucket_id = 'badges'
    and public.is_admin(auth.uid())
  );
