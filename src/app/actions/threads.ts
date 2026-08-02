"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createThread(_prevState: unknown, formData: FormData) {
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
    return { error: "Your account is banned." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) {
    return { error: "Title and body are required." };
  }

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .insert({ title, author_id: user.id })
    .select("id")
    .single();

  if (threadError || !thread) {
    return { error: threadError?.message ?? "Failed to create thread." };
  }

  const { error: postError } = await supabase.from("posts").insert({
    thread_id: thread.id,
    author_id: user.id,
    body,
  });

  if (postError) {
    return { error: postError.message };
  }

  revalidatePath("/");
  redirect(`/threads/${thread.id}`);
}

export async function createReply(_prevState: unknown, formData: FormData) {
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
    return { error: "Your account is banned." };
  }

  const threadId = String(formData.get("thread_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!threadId || !body) {
    return { error: "Reply body is required." };
  }

  const { error } = await supabase.from("posts").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const postId = String(formData.get("post_id") ?? "");
  const threadId = String(formData.get("thread_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!postId || !threadId || !body) {
    return { error: "Post body is required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return { error: "Your account is banned." };
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
