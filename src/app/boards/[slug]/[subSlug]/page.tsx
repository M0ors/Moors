import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdultGate } from "@/components/AdultGate";
import { Avatar } from "@/components/Avatar";
import { ForumShell } from "@/components/ForumShell";
import { Pagination } from "@/components/Pagination";
import { Username } from "@/components/Username";
import { UserScore } from "@/components/UserScore";
import { VoteButtons } from "@/components/VoteButtons";
import { boardPath } from "@/lib/boards";
import { censorText } from "@/lib/censor";
import { canAccessAdultContent, shouldBlurAvatar } from "@/lib/nsfw";
import { parsePage, THREADS_PER_PAGE, totalPages } from "@/lib/pagination";
import { getPopularThreads } from "@/lib/popular";
import { getUserScores } from "@/lib/score";
import { createClient } from "@/lib/supabase/server";

type SortKey = "activity" | "newest" | "likes";

type Props = {
  params: { slug: string; subSlug: string };
  searchParams: { page?: string; sort?: string };
};

function parseSort(value?: string): SortKey {
  if (value === "newest" || value === "likes") return value;
  return "activity";
}

export default async function SubBoardPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const page = parsePage(searchParams.page);
  const sort = parseSort(searchParams.sort);
  const from = (page - 1) * THREADS_PER_PAGE;
  const to = from + THREADS_PER_PAGE - 1;

  const { data: board } = await supabase
    .from("boards")
    .select("id, slug, name, is_adult")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!board) notFound();

  const { data: subBoard } = await supabase
    .from("sub_boards")
    .select(
      "id, slug, name, description, is_adult, max_threads_per_user, op_only_replies, allow_anonymous"
    )
    .eq("board_id", board.id)
    .eq("slug", params.subSlug)
    .maybeSingle();

  if (!subBoard) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canAdult = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("date_of_birth, nsfw_enabled")
      .eq("id", user.id)
      .single();
    canAdult = canAccessAdultContent({
      dateOfBirth: profile?.date_of_birth,
      nsfwEnabled: profile?.nsfw_enabled,
    });
  }

  const needsAdult = board.is_adult || subBoard.is_adult;
  if (needsAdult && !canAdult) {
    redirect("/");
  }

  let query = supabase
    .from("threads")
    .select(
      `
      id,
      title,
      created_at,
      updated_at,
      like_count,
      dislike_count,
      is_nsfw,
      is_anonymous,
      author_id,
      profiles:author_id (
        username, avatar_url, is_admin, username_color, country_code, nsfw_enabled,
        display_badge:display_badge_id ( id, slug, name, image_url, is_nsfw )
      )
    `,
      { count: "exact" }
    )
    .eq("sub_board_id", subBoard.id);

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "likes") {
    query = query
      .order("like_count", { ascending: false })
      .order("updated_at", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const [{ data: threads, error, count }, popularThreads] = await Promise.all([
    query.range(from, to),
    getPopularThreads({ canAdult }),
  ]);

  if (error) {
    return <p>Failed to load threads: {error.message}</p>;
  }

  const threadIds = threads?.map((t) => t.id) ?? [];
  let userVotes: Record<string, number> = {};
  if (user && threadIds.length > 0) {
    const { data: votes } = await supabase
      .from("votes")
      .select("target_id, value")
      .eq("user_id", user.id)
      .eq("target_type", "thread")
      .in("target_id", threadIds);
    userVotes = Object.fromEntries(
      (votes ?? []).map((vote) => [vote.target_id, vote.value])
    );
  }

  const authorIds = (threads ?? []).map((thread) => thread.author_id);
  const userScores = await getUserScores(supabase, authorIds);

  const pages = totalPages(count ?? 0, THREADS_PER_PAGE);
  const base = `/boards/${board.slug}/${subBoard.slug}`;

  const content = (
    <ForumShell popularThreads={popularThreads} canViewNsfw={canAdult}>
      <p className="mb-4">
        <Link href={boardPath(board.slug)}>← {board.name}</Link>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {subBoard.name}
            {needsAdult ? (
              <span className="ml-2 text-xs font-semibold uppercase text-red-700">
                Adult
              </span>
            ) : null}
          </h1>
          {subBoard.description ? (
            <p className="text-sm text-neutral-600 mt-1">{subBoard.description}</p>
          ) : null}
          {subBoard.op_only_replies ? (
            <p className="text-sm text-neutral-600 mt-1">
              Only the original poster can reply in this sub-board.
            </p>
          ) : null}
        </div>
        {user ? (
          <Link href={`/threads/new?board=${board.slug}&sub=${subBoard.slug}`}>
            New thread
          </Link>
        ) : null}
      </div>

      <div className="flex gap-3 text-sm mb-6">
        <Link href={`${base}?page=1`} className={sort === "activity" ? "font-semibold" : undefined}>
          Recent activity
        </Link>
        <Link
          href={`${base}?sort=newest&page=1`}
          className={sort === "newest" ? "font-semibold" : undefined}
        >
          Newest
        </Link>
        <Link
          href={`${base}?sort=likes&page=1`}
          className={sort === "likes" ? "font-semibold" : undefined}
        >
          Most liked
        </Link>
      </div>

      {!threads?.length ? (
        <p>No threads yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {threads.map((thread) => {
            const author = Array.isArray(thread.profiles)
              ? thread.profiles[0]
              : thread.profiles;
            const showAsAnon =
              Boolean(thread.is_anonymous) &&
              !(user && user.id === thread.author_id);
            const badge = Array.isArray(author?.display_badge)
              ? author?.display_badge[0]
              : author?.display_badge;

            return (
              <li key={thread.id} className="p-4 flex flex-col gap-3">
                <div>
                  <Link href={`/threads/${thread.id}`} className="font-medium block">
                    {censorText(thread.title, canAdult)}
                  </Link>
                  <div className="text-sm text-neutral-600 mt-1 flex items-start gap-2">
                    {!showAsAnon ? (
                      <Avatar
                        username={author?.username}
                        avatarUrl={author?.avatar_url}
                        size={20}
                        blurred={shouldBlurAvatar({
                          nsfwEnabled: author?.nsfw_enabled,
                          isAdmin: author?.is_admin,
                          viewerCanNsfw: canAdult,
                        })}
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1.5 flex-wrap">
                        by{" "}
                        {showAsAnon ? (
                          "Anonymous"
                        ) : (
                          <Username
                            username={author?.username}
                            isAdmin={author?.is_admin}
                            color={author?.username_color}
                            countryCode={author?.country_code}
                            href={author?.username ? `/u/${author.username}` : null}
                            badge={
                              badge && (!badge.is_nsfw || canAdult) ? badge : null
                            }
                          />
                        )}
                        <span>
                          · updated {new Date(thread.updated_at).toLocaleString()}
                        </span>
                      </div>
                      {!showAsAnon ? (
                        <div className="mt-0.5">
                          <UserScore score={userScores[thread.author_id] ?? 0} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <VoteButtons
                  targetType="thread"
                  targetId={thread.id}
                  likeCount={thread.like_count ?? 0}
                  dislikeCount={thread.dislike_count ?? 0}
                  userVote={userVotes[thread.id] ?? null}
                  redirectTo={`${base}?sort=${sort}&page=${page}`}
                  canVote={Boolean(user)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={pages}
        hrefForPage={(p) =>
          sort === "activity" ? `${base}?page=${p}` : `${base}?sort=${sort}&page=${p}`
        }
      />
    </ForumShell>
  );

  return (
    <main>
      {needsAdult ? <AdultGate>{content}</AdultGate> : content}
    </main>
  );
}
