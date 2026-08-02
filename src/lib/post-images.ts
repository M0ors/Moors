import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function getImageFile(formData: FormData, field = "image") {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }
  return file;
}

export async function uploadPostImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
) {
  if (file.size > MAX_POST_IMAGE_BYTES) {
    return { error: "Image must be 5MB or smaller.", publicUrl: null as string | null };
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return {
      error: "Use a JPG, PNG, WebP, or GIF image.",
      publicUrl: null as string | null,
    };
  }

  const path = `${userId}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("post-images").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { error: error.message, publicUrl: null as string | null };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("post-images").getPublicUrl(path);

  return { error: null, publicUrl };
}
