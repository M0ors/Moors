import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Avatar";
import { Pagination } from "@/components/Pagination";
import { ThreadActions } from "@/components/ThreadActions";
import { ThreadDiscussion } from "@/components/ThreadDiscussion";
import { VoteButtons } from "@/components/VoteButtons";
import { parsePage, ROOT_POSTS_PER_PAGE, totalPages } from "@/lib/pagination";
import { buildPostTree } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { id: string };
  searchParams: { page?: string };
};

export default async function ThreadPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const page = parsePage(searchParams.page);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_banned")
      .eq("id", user.id)
      .single();
    isAdmin = Boolean(profile?.is_admin);
  }

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select(
      `
      id,
      title,
      created_at,
      author_id,
      like_count,
      dislike_count,
      profiles:author_id ( username, avatar_url, is_admin )
    `
    )
    .eq("id", params.id)
    .single();

  if (threadError || !thread) {
    notFound();
  }

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select(
      `
      id,
      body,
      author_id,
      parent_id,
      image_url,
      is_pinned,
      like_count,
      dislike_count,
      created_at,
      profiles:author_id ( username, avatar_url, is_admin )
    `
    )
    .eq("thread_id", params.id)
    .order("created_at", { ascending: true });

  if (postsError) {
    return <p>Failed to load posts: {postsError.message}</p>;
  }

  const author = Array.isArray(thread.profiles) ? thread.profiles[0] : thread.profiles;
  const tree = buildPostTree(
    (posts ?? []).map((post) => {
      const profiles = Array.isArray(post.profiles)
        ? post.profiles[0] ?? null
        : post.profiles ?? null;

      return {
        id: post.id,
        body: post.body,
        author_id: post.author_id,
        created_at: post.created_at,
        parent_id: post.parent_id ?? null,
        image_url: post.image_url ?? null,
        is_pinned: Boolean(post.is_pinned),
        like_count: post.like_count ?? 0,
        dislike_count: post.dislike_count ?? 0,
        profiles,
      };
    })
  );

  const pages = totalPages(tree.length, ROOT_POSTS_PER_PAGE);
  const pageRoots = tree.slice(
    (page - 1) * ROOT_POSTS_PER_PAGE,
    page * ROOT_POSTS_PER_PAGE
  );

  const postIds = (posts ?? []).map((post) => post.id);
  let userVotes: Record<string, number> = {};
  let threadVote: number | null = null;

  if (user) {
    const { data: threadVoteRow } = await supabase
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("target_type", "thread")
      .eq("target_id", thread.id)
      .maybeSingle();

    threadVote = threadVoteRow?.value ?? null;

    if (postIds.length > 0) {
      const { data: postVotes } = await supabase
        .from("votes")
        .select("target_id, value")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .in("target_id", postIds);

      userVotes = Object.fromEntries(
        (postVotes ?? []).map((vote) => [vote.target_id, vote.value])
      );
    }
  }

  const isOp = Boolean(user && user.id === thread.author_id);
  const redirectTo = `/threads/${thread.id}?page=${page}`;

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Back to threads</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-2">{thread.title}</h1>
      <div className="text-sm text-neutral-600 mb-4 flex items-center gap-2 flex-wrap">
        <Avatar username={author?.username} avatarUrl={author?.avatar_url} size={24} />
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          started by{" "}
          {author?.username ? (
            <Link href={`/u/${author.username}`}>{author.username}</Link>
          ) : (
            "unknown"
          )}
          {author?.is_admin ? <AdminBadge /> : null}
          <span>· {new Date(thread.created_at).toLocaleString()}</span>
        </span>
      </div>

      <VoteButtons
        targetType="thread"
        targetId={thread.id}
        likeCount={thread.like_count ?? 0}
        dislikeCount={thread.dislike_count ?? 0}
        userVote={threadVote}
        redirectTo={redirectTo}
        canVote={Boolean(user)}
      />

      <ThreadActions
        threadId={thread.id}
        title={thread.title}
        canEdit={isOp}
        canDelete={isOp || isAdmin}
      />

      <div className="mt-8">
        <ThreadDiscussion
          threadId={thread.id}
          threadAuthorId={thread.author_id}
          posts={pageRoots}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          userVotes={userVotes}
          redirectTo={redirectTo}
        />
      </div>

      <Pagination
        page={page}
        totalPages={pages}
        hrefForPage={(p) => `/threads/${thread.id}?page=${p}`}
      />

      {!user ? (
        <p className="mt-8 text-sm">
          <Link href="/login">Log in</Link> to reply.
        </p>
      ) : null}
    </main>
  );
}
