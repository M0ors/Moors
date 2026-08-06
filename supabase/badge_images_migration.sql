-- Prefer supabase/badge_storage_migration.sql +:
--   npm run upload-badge-images
--
-- Or set image_url manually after uploading to the public `badges` bucket.

update public.badges
set image_url = null
where slug in ('joined_adult', 'bleached', 'blacked')
  and image_url like '/badges/%';
