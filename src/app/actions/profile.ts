"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function updateAvatar(_prevState: unknown, formData: FormData) {
  void _prevState;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "Image must be 2MB or smaller." };
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { error: "Use a JPG, PNG, WebP, or GIF image." };
  }

  const path = `${user.id}/avatar.${ext}`;

  const { data: existing } = await supabase.storage.from("avatars").list(user.id);
  const stale = (existing ?? [])
    .map((item) => `${user.id}/${item.name}`)
    .filter((name) => name !== path);

  if (stale.length) {
    await supabase.storage.from("avatars").remove(stale);
  }

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Bust browser cache after replace
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/threads", "layout");
  redirect("/profile");
}

export async function removeAvatar(formData: FormData) {
  void formData;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: files } = await supabase.storage.from("avatars").list(user.id);

  if (files?.length) {
    await supabase.storage
      .from("avatars")
      .remove(files.map((file) => `${user.id}/${file.name}`));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/threads", "layout");
  redirect("/profile");
}
