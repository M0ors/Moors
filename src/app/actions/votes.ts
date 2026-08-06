"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { onLikeReceived } from "@/lib/award-badges";
import { createClient } from "@/lib/supabase/server";

type TargetType = "thread" | "post" | "announcement";

export async function castVote(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const targetType = String(formData.get("target_type") ?? "") as TargetType;
  const targetId = String(formData.get("target_id") ?? "");
  const value = Number(formData.get("value"));
  const redirectTo = String(formData.get("redirect_to") ?? "/");

  if (
    (targetType !== "thread" &&
      targetType !== "post" &&
      targetType !== "announcement") ||
    !targetId ||
    (value !== 1 && value !== -1)
  ) {
    redirect(redirectTo);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    throw new Error("Your account is banned.");
  }

  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing?.value === value) {
    const { error } = await supabase.from("votes").delete().eq("id", existing.id);
    if (error) {
      throw new Error(error.message);
    }
  } else if (existing) {
    const { error } = await supabase
      .from("votes")
      .update({ value })
      .eq("id", existing.id);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      value,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  if (value === 1) {
    if (targetType === "thread") {
      const { data: thread } = await supabase
        .from("threads")
        .select("author_id, like_count")
        .eq("id", targetId)
        .single();
      if (thread?.author_id) {
        await onLikeReceived(
          supabase,
          thread.author_id,
          (thread.like_count ?? 0) + 1
        );
      }
    } else if (targetType === "post") {
      const { data: post } = await supabase
        .from("posts")
        .select("author_id, like_count")
        .eq("id", targetId)
        .single();
      if (post?.author_id) {
        await onLikeReceived(
          supabase,
          post.author_id,
          (post.like_count ?? 0) + 1
        );
      }
    }
  }

  revalidatePath(redirectTo);
  revalidatePath("/");
  redirect(redirectTo);
}
