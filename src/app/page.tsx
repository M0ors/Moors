import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();

  const { data: threads, error } = await supabase
    .from("threads")
    .select(
      `
      id,
      title,
      created_at,
      updated_at,
      profiles:author_id ( username, avatar_url )
    `
    )
    .order("updated_at", { ascending: false });

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

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-6">Threads</h1>

      {!threads?.length ? (
        <p>No threads yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {threads.map((thread) => {
            const author = Array.isArray(thread.profiles)
              ? thread.profiles[0]
              : thread.profiles;

            return (
              <li key={thread.id} className="p-4">
                <Link href={`/threads/${thread.id}`} className="font-medium block">
                  {thread.title}
                </Link>
                <div className="text-sm text-neutral-600 mt-1 flex items-center gap-2">
                  <Avatar
                    username={author?.username}
                    avatarUrl={author?.avatar_url}
                    size={20}
                  />
                  <span>
                    by {author?.username ?? "unknown"} · {counts[thread.id] ?? 0}{" "}
                    posts · updated {new Date(thread.updated_at).toLocaleString()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
