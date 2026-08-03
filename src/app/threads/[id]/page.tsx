import Link from "next/link";
import { notFound } from "next/navigation";
import { AdultGate } from "@/components/AdultGate";
import { Avatar } from "@/components/Avatar";
import { ForumShell } from "@/components/ForumShell";
import { Pagination } from "@/components/Pagination";
import { ThreadActions } from "@/components/ThreadActions";
import { ThreadDiscussion } from "@/components/ThreadDiscussion";
import { Username } from "@/components/Username";
import { UserScore } from "@/components/UserScore";
import { VoteButtons } from "@/components/VoteButtons";
import { boardPath, subBoardPath } from "@/lib/boards";
import { censorText } from "@/lib/censor";
import { canAccessAdultContent, shouldBlurAvatar } from "@/lib/nsfw";
import { parsePage, ROOT_POSTS_PER_PAGE, totalPages } from "@/lib/pagination";
import { getPopularThreads } from "@/lib/popular";
import { buildPostTree } from "@/lib/posts";
import { getUserScores } from "@/lib/score";
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
  let canAdult = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, is_banned, date_of_birth, nsfw_enabled")
      .eq("id", user.id)
      .single();
    isAdmin = Boolean(profile?.is_admin);
    canAdult = canAccessAdultContent({
      dateOfBirth: profile?.date_of_birth,
      nsfwEnabled: profile?.nsfw_enabled,
    });
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
      is_anonymous,
      board_id,
      boards:board_id ( slug, name, is_adult ),
      sub_boards:sub_board_id ( slug, name, is_adult, op_only_replies ),
      profiles:author_id (
        username, avatar_url, is_admin, username_color, country_code, nsfw_enabled, created_at,
        display_badge:display_badge_id ( id, slug, name, image_url, is_nsfw )
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (threadError || !thread) {
    notFound();
  }

  const board = Array.isArray(thread.boards) ? thread.boards[0] : thread.boards;
  const subBoard = Array.isArray(thread.sub_boards)
    ? thread.sub_boards[0]
    : thread.sub_boards;
  const isAdultThread = Boolean(
    board?.is_adult || subBoard?.is_adult || thread.is_nsfw
  );

  if (isAdultThread && !canAdult && !isAdmin) {
    return (
      <main>
        <p className="mb-4">
          <Link href="/">← Boards</Link>
        </p>
        <h1 className="text-2xl font-semibold mb-4">Adult content</h1>
        <p>
          This thread is only visible to logged-in users aged 18+ who have been
          granted certain access.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/profile">Request access in Settings</Link>
        </p>
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
      image_approved,
      is_pinned,
      like_count,
      dislike_count,
      created_at,
      profiles:author_id (
        username, avatar_url, is_admin, username_color, country_code, nsfw_enabled,
        display_badge:display_badge_id ( id, slug, name, image_url, is_nsfw )
      )
    `
    )
    .eq("thread_id", params.id)
    .order("created_at", { ascending: true });

  if (postsError) {
    return <p>Failed to load posts: {postsError.message}</p>;
  }

  const author = Array.isArray(thread.profiles) ? thread.profiles[0] : thread.profiles;
  const displayBadge = Array.isArray(author?.display_badge)
    ? author?.display_badge[0]
    : author?.display_badge;
  const showAsAnon =
    Boolean(thread.is_anonymous) &&
    !(user && (user.id === thread.author_id || isAdmin));
  const hideNsfwOpDetails =
    !showAsAnon &&
    shouldBlurAvatar({
      nsfwEnabled: author?.nsfw_enabled,
      isAdmin: author?.is_admin,
      viewerCanNsfw: canAdult,
    });

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
        image_approved: Boolean(post.image_approved),
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
  const authorIds = Array.from(
    new Set([
      thread.author_id,
      ...(posts ?? []).map((post) => post.author_id).filter(Boolean),
    ])
  );
  const userScores = await getUserScores(supabase, authorIds);

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
  const canReply = Boolean(
    user && (!subBoard?.op_only_replies || user.id === thread.author_id)
  );
  const redirectTo = `/threads/${thread.id}?page=${page}`;
  const boardHref = board?.slug ? boardPath(board.slug) : "/";
  const popularThreads = await getPopularThreads({ canAdult });

  const content = (
    <ForumShell
      popularThreads={popularThreads}
      canViewNsfw={canAdult}
      hideNsfwOpDetails={hideNsfwOpDetails}
      op={
        showAsAnon
          ? {
              username: "Anonymous",
              avatar_url: null,
              is_admin: false,
              username_color: null,
              country_code: null,
              created_at: null,
            }
          : {
              username: author?.username,
              avatar_url: author?.avatar_url,
              is_admin: author?.is_admin,
              username_color: author?.username_color,
              country_code: author?.country_code,
              created_at: author?.created_at,
              nsfw_enabled: author?.nsfw_enabled,
              display_badge: displayBadge ?? null,
            }
      }
    >
      <p className="mb-4">
        <Link href={boardHref}>← {board?.name ?? "Boards"}</Link>
        {subBoard ? (
          <>
            {" · "}
            <Link href={subBoardPath(board!.slug, subBoard.slug)}>
              {subBoard.name}
            </Link>
          </>
        ) : null}
      </p>

      <h1 className="text-2xl font-semibold mb-2">
        {censorText(thread.title, canAdult)}
        {isAdultThread ? (
          <span className="ml-2 text-xs font-semibold uppercase text-red-700 align-middle">
            Adult
          </span>
        ) : null}
      </h1>
      <div className="text-sm text-neutral-600 mb-4 flex items-start gap-2">
        {!showAsAnon ? (
          <Avatar
            username={author?.username}
            avatarUrl={author?.avatar_url}
            size={24}
            blurred={hideNsfwOpDetails}
          />
        ) : null}
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 flex-wrap">
            started by{" "}
            {showAsAnon ? (
              <span>Anonymous</span>
            ) : (
              <Username
                username={author?.username}
                isAdmin={author?.is_admin}
                color={author?.username_color}
                countryCode={author?.country_code}
                href={author?.username ? `/u/${author.username}` : null}
                badge={
                  displayBadge && (!displayBadge.is_nsfw || canAdult)
                    ? displayBadge
                    : null
                }
              />
            )}
            <span>· {new Date(thread.created_at).toLocaleString()}</span>
          </div>
          {!showAsAnon ? (
            <div className="mt-0.5">
              <UserScore score={userScores[thread.author_id] ?? 0} />
            </div>
          ) : null}
        </div>
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
        canToggleNsfw={false}
      />

      <div className="mt-8">
        <ThreadDiscussion
          threadId={thread.id}
          threadAuthorId={thread.author_id}
          posts={pageRoots}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          canViewNsfwProfiles={canAdult}
          canReply={canReply}
          threadIsAnonymous={Boolean(thread.is_anonymous)}
          userVotes={userVotes}
          userScores={userScores}
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
    </ForumShell>
  );

  return (
    <main>
      {isAdultThread ? <AdultGate>{content}</AdultGate> : content}
    </main>
  );
}
