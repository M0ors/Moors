"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function assertNotSelf(targetId: string, adminId: string) {
  if (targetId === adminId) {
    return { error: "You cannot ban or remove your own account." };
  }
  return null;
}

export async function banUser(formData: FormData) {
  void formData;
  const { user: admin } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");

  if (!userId) {
    return;
  }

  const selfError = await assertNotSelf(userId, admin.id);
  if (selfError) {
    throw new Error(selfError.error);
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: true })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const adminClient = createAdminClient();
  if (adminClient) {
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function unbanUser(formData: FormData) {
  void formData;
  const { user: admin } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");

  if (!userId) {
    return;
  }

  const selfError = await assertNotSelf(userId, admin.id);
  if (selfError) {
    throw new Error(selfError.error);
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: false })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const adminClient = createAdminClient();
  if (adminClient) {
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function removeUser(formData: FormData) {
  void formData;
  const { user: admin } = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");

  if (!userId) {
    return;
  }

  const selfError = await assertNotSelf(userId, admin.id);
  if (selfError) {
    throw new Error(selfError.error);
  }

  if (!hasServiceRoleKey()) {
    throw new Error(
      "Add SUPABASE_SERVICE_ROLE_KEY to remove users from Auth. You can still ban them without it."
    );
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error("Admin client is not configured.");
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function approvePostImage(formData: FormData) {
  void formData;
  await requireAdmin();
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) {
    return;
  }

  const supabase = createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .update({ image_approved: true })
    .eq("id", postId)
    .select("thread_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  if (post?.thread_id) {
    revalidatePath(`/threads/${post.thread_id}`);
  }
  redirect("/admin");
}

export async function rejectPostImage(formData: FormData) {
  void formData;
  await requireAdmin();
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) {
    return;
  }

  const supabase = createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .update({ image_url: null, image_approved: false })
    .eq("id", postId)
    .select("thread_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  if (post?.thread_id) {
    revalidatePath(`/threads/${post.thread_id}`);
  }
  redirect("/admin");
}

export async function reviewAccessRequest(formData: FormData) {
  void formData;
  await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const enableNsfw = formData.get("enable_nsfw") === "on";

  if (!requestId || (status !== "approved" && status !== "rejected")) {
    return;
  }

  const supabase = createClient();
  const { data: request, error } = await supabase
    .from("access_requests")
    .update({ status })
    .eq("id", requestId)
    .select("user_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (status === "approved" && enableNsfw && request?.user_id) {
    await supabase
      .from("profiles")
      .update({ nsfw_enabled: true })
      .eq("id", request.user_id);
  }

  revalidatePath("/admin");
  redirect("/admin");
}
