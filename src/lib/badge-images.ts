import type { SupabaseClient } from "@supabase/supabase-js";

export const BADGE_IMAGE_BUCKET = "badges";
export const MAX_BADGE_IMAGE_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function getBadgeImageFile(formData: FormData, field = "image") {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

export async function uploadBadgeImage(
  supabase: SupabaseClient,
  slug: string,
  file: File | Blob,
  contentType = "image/png"
) {
  const type =
    file instanceof File && file.type ? file.type : contentType;
  const ext = ALLOWED_TYPES[type];
  if (!ext) {
    return {
      error: "Use a JPG, PNG, WebP, or GIF image.",
      publicUrl: null as string | null,
    };
  }

  const size = "size" in file ? file.size : 0;
  if (size > MAX_BADGE_IMAGE_BYTES) {
    return {
      error: "Badge image must be 2MB or smaller.",
      publicUrl: null as string | null,
    };
  }

  const safeSlug = slug.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "badge";
  const path = `${safeSlug}.${ext}`;

  const { error } = await supabase.storage
    .from(BADGE_IMAGE_BUCKET)
    .upload(path, file, {
      contentType: type,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    return { error: error.message, publicUrl: null as string | null };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BADGE_IMAGE_BUCKET).getPublicUrl(path);

  return { error: null, publicUrl };
}
