import type { SupabaseClient } from "@supabase/supabase-js";
import { BADGE_SLUGS } from "@/lib/badges";

async function awardBySlug(
  supabase: SupabaseClient,
  userId: string,
  slug: string
) {
  const { data: badge } = await supabase
    .from("badges")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!badge) return;

  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId)
    .eq("badge_id", badge.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badge.id,
  });
}

export async function awardBadgeBySlug(
  supabase: SupabaseClient,
  userId: string,
  slug: string
) {
  await awardBySlug(supabase, userId, slug);
}

export async function ensureStaffBadge(
  supabase: SupabaseClient,
  userId: string,
  isAdmin: boolean
) {
  if (!isAdmin) return;
  await awardBySlug(supabase, userId, BADGE_SLUGS.staff);
}

export async function onThreadCreated(
  supabase: SupabaseClient,
  userId: string,
  subBoardSlug: string | null | undefined
) {
  const { count } = await supabase
    .from("threads")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  if ((count ?? 0) <= 1) {
    await awardBySlug(supabase, userId, BADGE_SLUGS.firstThread);
  }

  if (subBoardSlug === "coding") {
    await awardBySlug(supabase, userId, BADGE_SLUGS.coder);
  }
  if (subBoardSlug === "quick-storytime") {
    await awardBySlug(supabase, userId, BADGE_SLUGS.writer);
  }
  if (subBoardSlug === "blogs") {
    await awardBySlug(supabase, userId, BADGE_SLUGS.blogger);
  }
  if (subBoardSlug === "bwc") {
    await awardBySlug(supabase, userId, BADGE_SLUGS.bleached);
  }
  if (subBoardSlug === "bbc") {
    await awardBySlug(supabase, userId, BADGE_SLUGS.blacked);
  }
}

export async function onReplyCreated(
  supabase: SupabaseClient,
  userId: string,
  threadAuthorId: string
) {
  // First reply badge: first post that is a reply (not OP first post). Count posts where parent_id is not null OR post is not the first in thread.
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .not("parent_id", "is", null);

  // Also count non-root posts and replies to thread (root posts by non-OP)
  const { count: rootReplyCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .is("parent_id", null)
    .neq("author_id", threadAuthorId);

  // Simpler: if this user has more than 1 post total after creating a reply, or has any reply-shaped post
  void rootReplyCount;

  const { count: totalPosts } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  // Award first_reply when user has at least one post that isn't their first ever OP post.
  // Practical approach: award when they post a reply (parent_id set) or reply on someone else's thread.
  if ((count ?? 0) >= 1 || (totalPosts ?? 0) > 1) {
    await awardBySlug(supabase, userId, BADGE_SLUGS.firstReply);
  }
}

export async function onLikeReceived(
  supabase: SupabaseClient,
  authorId: string,
  likeCount: number
) {
  if (likeCount >= 1) {
    await awardBySlug(supabase, authorId, BADGE_SLUGS.firstLikeReceived);
  }
  if (likeCount >= 10) {
    await awardBySlug(supabase, authorId, BADGE_SLUGS.lotsOfLove);
  }
}
