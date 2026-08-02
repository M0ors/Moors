import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Pagination } from "@/components/Pagination";
import { ThreadActions } from "@/components/ThreadActions";
import { ThreadDiscussion } from "@/components/ThreadDiscussion";
import { Username } from "@/components/Username";
import { VoteButtons } from "@/components/VoteButtons";
import { isAtLeast18 } from "@/lib/age";
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
  let canViewNsfw = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_banned, date_of_birth")
      .eq("id", user.id)
      .single();
    isAdmin = Boolean(profile?.is_admin);
    canViewNsfw = isAtLeast18(profile?.date_of_birth);
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
      is_nsfw,
      profiles:author_id ( username, avatar_url, is_admin, username_color, country_code )
    `
    )
    .eq("id", params.id)
    .single();

  if (threadError || !thread) {
    notFound();
  }

  if (thread.is_nsfw && !canViewNsfw) {
    return (
      <main>
        <p className="mb-4">
          <Link href="/">← Back to threads</Link>
        </p>
        <h1 className="text-2xl font-semibold mb-4">NSFW content</h1>
        <p>
          This thread is marked NSFW and is only visible to logged-in users aged
          18+.
        </p>
        {!user ? (
          <p className="mt-4 text-sm">
            <Link href="/login">Log in</Link> and make sure your date of birth is
            set in Settings.
          </p>
        ) : (
          <p className="mt-4 text-sm">
            Add or update your date of birth in{" "}
            <Link href="/profile">Settings</Link>.
          </p>
        )}
      </main>
    );
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
      profiles:author_id ( username, avatar_url, is_admin, username_color, country_code )
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

      <h1 className="text-2xl font-semibold mb-2">
        {thread.title}
        {thread.is_nsfw ? (
          <span className="ml-2 text-xs font-semibold uppercase text-red-700 align-middle">
            NSFW
          </span>
        ) : null}
      </h1>
      <div className="text-sm text-neutral-600 mb-4 flex items-center gap-2 flex-wrap">
        <Avatar username={author?.username} avatarUrl={author?.avatar_url} size={24} />
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          started by{" "}
          <Username
            username={author?.username}
            isAdmin={author?.is_admin}
            color={author?.username_color}
            countryCode={author?.country_code}
            href={author?.username ? `/u/${author.username}` : null}
          />
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
        isNsfw={Boolean(thread.is_nsfw)}
        canEdit={isOp}
        canDelete={isOp || isAdmin}
        canToggleNsfw={isOp || isAdmin}
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
