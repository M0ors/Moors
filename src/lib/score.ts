import type { SupabaseClient } from "@supabase/supabase-js";

/** 1 like on a thread or reply = 1 point. */
export async function getUserScores(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Record<string, number>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  const scores: Record<string, number> = Object.fromEntries(
    unique.map((id) => [id, 0])
  );

  if (!unique.length) {
    return scores;
  }

  const [{ data: threads }, { data: posts }] = await Promise.all([
    supabase.from("threads").select("author_id, like_count").in("author_id", unique),
    supabase.from("posts").select("author_id, like_count").in("author_id", unique),
  ]);

  for (const thread of threads ?? []) {
    if (!thread.author_id) continue;
    scores[thread.author_id] =
      (scores[thread.author_id] ?? 0) + (thread.like_count ?? 0);
  }

  for (const post of posts ?? []) {
    if (!post.author_id) continue;
    scores[post.author_id] =
      (scores[post.author_id] ?? 0) + (post.like_count ?? 0);
  }

  return scores;
}

export async function getUserScore(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const scores = await getUserScores(supabase, [userId]);
  return scores[userId] ?? 0;
}
