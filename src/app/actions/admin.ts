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
  redirect("/admin?tab=users");
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
  redirect("/admin?tab=users");
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
  redirect("/admin?tab=users");
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
  redirect("/admin?tab=images");
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
  redirect("/admin?tab=images");
}

export async function reviewAccessRequest(formData: FormData) {
  void formData;
  await requireAdmin();
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");
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

  if (status === "approved" && request?.user_id) {
    await supabase
      .from("profiles")
      .update({ nsfw_enabled: true })
      .eq("id", request.user_id);

    const { awardBadgeBySlug } = await import("@/lib/award-badges");
    const { BADGE_SLUGS } = await import("@/lib/badges");
    await awardBadgeBySlug(supabase, request.user_id, BADGE_SLUGS.joinedAdult);
  }

  revalidatePath("/admin");
  redirect("/admin?tab=access");
}

export async function createSubBoard(_prevState: unknown, formData: FormData) {
  void _prevState;
  await requireAdmin();
  const supabase = createClient();

  const boardId = String(formData.get("board_id") ?? "");
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isAdult = formData.get("is_adult") === "on";
  const allowAnonymous = formData.get("allow_anonymous") === "on";
  const opOnlyReplies = formData.get("op_only_replies") === "on";
  const maxThreadsRaw = String(formData.get("max_threads_per_user") ?? "").trim();
  const maxThreads = maxThreadsRaw ? Number(maxThreadsRaw) : null;
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;

  if (!boardId || !slug || !name) {
    return { error: "Board, slug, and name are required." };
  }

  const { error } = await supabase.from("sub_boards").insert({
    board_id: boardId,
    slug,
    name,
    description: description || null,
    is_adult: isAdult,
    allow_anonymous: allowAnonymous,
    op_only_replies: opOnlyReplies,
    max_threads_per_user:
      maxThreads != null && Number.isFinite(maxThreads) ? maxThreads : null,
    sort_order: sortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?tab=sub-boards");
}

export async function updateSubBoard(formData: FormData) {
  void formData;
  await requireAdmin();
  const supabase = createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isAdult = formData.get("is_adult") === "on";
  const allowAnonymous = formData.get("allow_anonymous") === "on";
  const opOnlyReplies = formData.get("op_only_replies") === "on";
  const maxThreadsRaw = String(formData.get("max_threads_per_user") ?? "").trim();
  const maxThreads = maxThreadsRaw ? Number(maxThreadsRaw) : null;
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;

  if (!id || !name) {
    throw new Error("Name is required.");
  }

  const { error } = await supabase
    .from("sub_boards")
    .update({
      name,
      description: description || null,
      is_adult: isAdult,
      allow_anonymous: allowAnonymous,
      op_only_replies: opOnlyReplies,
      max_threads_per_user:
        maxThreads != null && Number.isFinite(maxThreads) ? maxThreads : null,
      sort_order: sortOrder,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?tab=sub-boards");
}

export async function deleteSubBoard(formData: FormData) {
  void formData;
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createClient();
  const { error } = await supabase.from("sub_boards").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin?tab=sub-boards");
}

function badgeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40);
}

export async function createBadge(_prevState: unknown, formData: FormData) {
  void _prevState;
  await requireAdmin();
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const isNsfw = formData.get("is_nsfw") === "on";
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;
  const slug = badgeSlug(slugInput || name);

  if (!name || !slug) {
    return { error: "Name and slug are required." };
  }

  const { error } = await supabase.from("badges").insert({
    name,
    slug,
    description: description || null,
    image_url: imageUrl || null,
    is_nsfw: isNsfw,
    sort_order: sortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  redirect("/admin?tab=badges");
}

export async function updateBadge(formData: FormData) {
  void formData;
  await requireAdmin();
  const supabase = createClient();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const isNsfw = formData.get("is_nsfw") === "on";
  const sortOrder = Number(formData.get("sort_order") ?? 0) || 0;

  if (!id || !name) {
    throw new Error("Badge name is required.");
  }

  const { error } = await supabase
    .from("badges")
    .update({
      name,
      description: description || null,
      image_url: imageUrl || null,
      is_nsfw: isNsfw,
      sort_order: sortOrder,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  redirect("/admin?tab=badges");
}

export async function deleteBadge(formData: FormData) {
  void formData;
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createClient();
  const { error } = await supabase.from("badges").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  redirect("/admin?tab=badges");
}

/** @deprecated use updateBadge */
export async function updateBadgeImage(formData: FormData) {
  return updateBadge(formData);
}
