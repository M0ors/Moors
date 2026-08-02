"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 1 * 1024 * 1024;
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
    return { error: "Image must be 1MB or smaller." };
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

export async function updateProfileDetails(_prevState: unknown, formData: FormData) {
  void _prevState;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const aboutMe = String(formData.get("about_me") ?? "").trim();
  const usernameColor = String(formData.get("username_color") ?? "").trim();
  const countryCode = String(formData.get("country_code") ?? "")
    .trim()
    .toUpperCase();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();

  if (aboutMe.length > 500) {
    return { error: "About me must be 500 characters or less." };
  }

  if (usernameColor && !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(usernameColor)) {
    return { error: "Username color must be a hex value like #2563eb." };
  }

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    return { error: "Choose a valid country." };
  }

  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return { error: "Enter a valid date of birth." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      about_me: aboutMe || null,
      username_color: usernameColor || null,
      country_code: countryCode || null,
      date_of_birth: dateOfBirth || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/threads", "layout");
  if (profile?.username) {
    revalidatePath(`/u/${profile.username}`);
  }
  redirect("/profile");
}

