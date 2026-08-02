import Link from "next/link";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Avatar";
import { Pagination } from "@/components/Pagination";
import { VoteButtons } from "@/components/VoteButtons";
import { parsePage, THREADS_PER_PAGE, totalPages } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

type SortKey = "activity" | "newest" | "likes";

type Props = {
  searchParams: { page?: string; sort?: string };
};

function parseSort(value?: string): SortKey {
  if (value === "newest" || value === "likes") {
    return value;
  }
  return "activity";
}

export default async function Home({ searchParams }: Props) {
  const supabase = createClient();
  const page = parsePage(searchParams.page);
  const sort = parseSort(searchParams.sort);
  const from = (page - 1) * THREADS_PER_PAGE;
  const to = from + THREADS_PER_PAGE - 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("threads").select(
    `
      id,
      title,
      created_at,
      updated_at,
      like_count,
      dislike_count,
      author_id,
      profiles:author_id ( username, avatar_url, is_admin )
    `,
    { count: "exact" }
  );

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "likes") {
    query = query
      .order("like_count", { ascending: false })
      .order("updated_at", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data: threads, error, count } = await query.range(from, to);

  if (error) {
    return <p>Failed to load threads: {error.message}</p>;
  }

  const threadIds = threads?.map((t) => t.id) ?? [];
  const { data: postCounts } =
    threadIds.length > 0
      ? await supabase.from("posts").select("thread_id").in("thread_id", threadIds)
      : { data: [] };

  const counts = (postCounts ?? []).reduce<Record<string, number>>((acc, post) => {
    acc[post.thread_id] = (acc[post.thread_id] ?? 0) + 1;
    return acc;
  }, {});

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

  const pages = totalPages(count ?? 0, THREADS_PER_PAGE);
  const sortLink = (key: SortKey) =>
    key === "activity" ? "/?page=1" : `/?sort=${key}&page=1`;

  return (
    <main>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold">Threads</h1>
        <div className="flex gap-3 text-sm">
          <Link
            href={sortLink("activity")}
            className={sort === "activity" ? "font-semibold" : undefined}
          >
            Recent activity
          </Link>
          <Link
            href={sortLink("newest")}
            className={sort === "newest" ? "font-semibold" : undefined}
          >
            Newest
          </Link>
          <Link
            href={sortLink("likes")}
            className={sort === "likes" ? "font-semibold" : undefined}
          >
            Most liked
          </Link>
        </div>
      </div>

      {!threads?.length ? (
        <p>No threads yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {threads.map((thread) => {
            const author = Array.isArray(thread.profiles)
              ? thread.profiles[0]
              : thread.profiles;

            return (
              <li key={thread.id} className="p-4 flex flex-col gap-3">
                <div>
                  <Link href={`/threads/${thread.id}`} className="font-medium block">
                    {thread.title}
                  </Link>
                  <div className="text-sm text-neutral-600 mt-1 flex items-center gap-2 flex-wrap">
                    <Avatar
                      username={author?.username}
                      avatarUrl={author?.avatar_url}
                      size={20}
                    />
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      by{" "}
                      {author?.username ? (
                        <Link href={`/u/${author.username}`}>{author.username}</Link>
                      ) : (
                        "unknown"
                      )}
                      {author?.is_admin ? <AdminBadge /> : null}
                      <span>
                        · {counts[thread.id] ?? 0} posts · updated{" "}
                        {new Date(thread.updated_at).toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
                <VoteButtons
                  targetType="thread"
                  targetId={thread.id}
                  likeCount={thread.like_count ?? 0}
                  dislikeCount={thread.dislike_count ?? 0}
                  userVote={userVotes[thread.id] ?? null}
                  redirectTo={`/?sort=${sort}&page=${page}`}
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
          sort === "activity" ? `/?page=${p}` : `/?sort=${sort}&page=${p}`
        }
      />
    </main>
  );
}
