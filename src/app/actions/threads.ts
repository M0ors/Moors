"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getImageFile, uploadPostImage } from "@/lib/post-images";
import { createClient } from "@/lib/supabase/server";

async function requireActiveUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return { supabase, user, error: "Your account is banned." as string };
  }

  return { supabase, user, error: null };
}

export async function createThread(_prevState: unknown, formData: FormData) {
  void _prevState;
  const { supabase, user, error: authError } = await requireActiveUser();
  if (authError) {
    return { error: authError };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isNsfw = formData.get("is_nsfw") === "on";
  const imageFile = getImageFile(formData);

  if (!title) {
    return { error: "Title is required." };
  }

  if (!body && !imageFile) {
    return { error: "Add a body or an image." };
  }

  let imageUrl: string | null = null;
  if (imageFile) {
    const uploaded = await uploadPostImage(supabase, user.id, imageFile);
    if (uploaded.error) {
      return { error: uploaded.error };
    }
    imageUrl = uploaded.publicUrl;
  }

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .insert({ title, author_id: user.id, is_nsfw: isNsfw })
    .select("id")
    .single();

  if (threadError || !thread) {
    return { error: threadError?.message ?? "Failed to create thread." };
  }

  const { error: postError } = await supabase.from("posts").insert({
    thread_id: thread.id,
    author_id: user.id,
    body: body || " ",
    image_url: imageUrl,
    parent_id: null,
  });

  if (postError) {
    return { error: postError.message };
  }

  revalidatePath("/");
  redirect(`/threads/${thread.id}`);
}

export async function createReply(_prevState: unknown, formData: FormData) {
  void _prevState;
  const { supabase, user, error: authError } = await requireActiveUser();
  if (authError) {
    return { error: authError };
  }

  const threadId = String(formData.get("thread_id") ?? "");
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();
  const imageFile = getImageFile(formData);

  if (!threadId) {
    return { error: "Thread is required." };
  }

  if (!body && !imageFile) {
    return { error: "Add a reply or an image." };
  }

  if (parentId) {
    const { data: parent } = await supabase
      .from("posts")
      .select("id, thread_id")
      .eq("id", parentId)
      .single();

    if (!parent || parent.thread_id !== threadId) {
      return { error: "Parent reply not found." };
    }
  }

  let imageUrl: string | null = null;
  if (imageFile) {
    const uploaded = await uploadPostImage(supabase, user.id, imageFile);
    if (uploaded.error) {
      return { error: uploaded.error };
    }
    imageUrl = uploaded.publicUrl;
  }

  const { error } = await supabase.from("posts").insert({
    thread_id: threadId,
    author_id: user.id,
    body: body || " ",
    image_url: imageUrl,
    parent_id: parentId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/threads/${threadId}`);
  revalidatePath("/");
  redirect(`/threads/${threadId}`);
}

export async function updatePost(_prevState: unknown, formData: FormData) {
  void _prevState;
  const { supabase, user, error: authError } = await requireActiveUser();
  if (authError) {
    return { error: authError };
  }

  const postId = String(formData.get("post_id") ?? "");
  const threadId = String(formData.get("thread_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!postId || !threadId || !body) {
    return { error: "Post body is required." };
  }

  const { error } = await supabase
    .from("posts")
    .update({ body })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function deletePost(formData: FormData) {
  void formData;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const postId = String(formData.get("post_id") ?? "");
  const threadId = String(formData.get("thread_id") ?? "");

  if (!postId || !threadId) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    throw new Error("Your account is banned.");
  }

  let query = supabase.from("posts").delete().eq("id", postId);
  if (!profile?.is_admin) {
    query = query.eq("author_id", user.id);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/threads/${threadId}`);
  revalidatePath("/");
  redirect(`/threads/${threadId}`);
}

export async function updateThread(_prevState: unknown, formData: FormData) {
  void _prevState;
  const { supabase, user, error: authError } = await requireActiveUser();
  if (authError) {
    return { error: authError };
  }

  const threadId = String(formData.get("thread_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!threadId || !title) {
    return { error: "Title is required." };
  }

  if (title.length > 200) {
    return { error: "Title must be 200 characters or less." };
  }

  const { error } = await supabase
    .from("threads")
    .update({ title })
    .eq("id", threadId)
    .eq("author_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function deleteThread(formData: FormData) {
  void formData;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const threadId = String(formData.get("thread_id") ?? "");
  if (!threadId) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    throw new Error("Your account is banned.");
  }

  let query = supabase.from("threads").delete().eq("id", threadId);
  if (!profile?.is_admin) {
    query = query.eq("author_id", user.id);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  redirect("/");
}

export async function togglePinPost(formData: FormData) {
  void formData;
  const { supabase, user, error: authError } = await requireActiveUser();
  if (authError) {
    throw new Error(authError);
  }

  const postId = String(formData.get("post_id") ?? "");
  const threadId = String(formData.get("thread_id") ?? "");
  const nextPinned = String(formData.get("is_pinned") ?? "") === "true";

  if (!postId || !threadId) {
    return;
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("author_id")
    .eq("id", threadId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const canPin = Boolean(profile?.is_admin || thread?.author_id === user.id);
  if (!canPin) {
    throw new Error("Only the thread author or an admin can pin replies.");
  }

  const { error } = await supabase
    .from("posts")
    .update({ is_pinned: nextPinned })
    .eq("id", postId)
    .eq("thread_id", threadId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}

export async function toggleThreadNsfw(formData: FormData) {
  void formData;
  const { supabase, user, error: authError } = await requireActiveUser();
  if (authError) {
    throw new Error(authError);
  }

  const threadId = String(formData.get("thread_id") ?? "");
  const nextNsfw = String(formData.get("is_nsfw") ?? "") === "true";

  if (!threadId) {
    return;
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("author_id")
    .eq("id", threadId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const canModerate = Boolean(profile?.is_admin || thread?.author_id === user.id);
  if (!canModerate) {
    throw new Error("Only the thread author or an admin can change NSFW.");
  }

  let query = supabase.from("threads").update({ is_nsfw: nextNsfw }).eq("id", threadId);
  if (!profile?.is_admin) {
    query = query.eq("author_id", user.id);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath(`/threads/${threadId}`);
  redirect(`/threads/${threadId}`);
}
