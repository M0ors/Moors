"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitAccessRequest(
  _prevState: unknown,
  formData: FormData
) {
  void _prevState;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const age = Number(formData.get("age"));
  const accessWanted = String(formData.get("access_wanted") ?? "").trim();

  if (!fullName || !accessWanted) {
    return { error: "Name and access wanted are required." };
  }

  if (!Number.isFinite(age) || age < 18 || age > 120) {
    return { error: "You must be 18+ to request access." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("date_of_birth, nsfw_enabled")
    .eq("id", user.id)
    .single();

  if (profile?.nsfw_enabled) {
    return { error: "You already have access." };
  }

  const { isAtLeast18 } = await import("@/lib/age");
  if (!isAtLeast18(profile?.date_of_birth)) {
    return {
      error: "Set a date of birth showing you are 18+ before requesting access.",
    };
  }

  const { error } = await supabase.from("access_requests").insert({
    user_id: user.id,
    full_name: fullName,
    age,
    access_wanted: accessWanted,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/admin");
  redirect("/profile?request=sent");
}
