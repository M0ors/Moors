import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Avatar";
import { Pagination } from "@/components/Pagination";
import { parsePage, THREADS_PER_PAGE, totalPages } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { username: string };
  searchParams: { page?: string };
};

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const supabase = createClient();
  const page = parsePage(searchParams.page);
  const username = decodeURIComponent(params.username);
  const from = (page - 1) * THREADS_PER_PAGE;
  const to = from + THREADS_PER_PAGE - 1;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, is_admin, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const {
    data: posts,
    error,
    count,
  } = await supabase
    .from("posts")
    .select(
      `
      id,
      body,
      created_at,
      thread_id,
      threads:thread_id ( id, title )
    `,
      { count: "exact" }
    )
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return <p>Failed to load posts: {error.message}</p>;
  }

  const pages = totalPages(count ?? 0, THREADS_PER_PAGE);

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Back to threads</Link>
      </p>

      <div className="flex items-center gap-4 mb-8">
        <Avatar
          username={profile.username}
          avatarUrl={profile.avatar_url}
          size={72}
        />
        <div>
          <h1 className="text-2xl font-semibold inline-flex items-center gap-2">
            {profile.username}
            {profile.is_admin ? <AdminBadge /> : null}
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Joined {new Date(profile.created_at).toLocaleDateString()} · {count ?? 0}{" "}
            posts
          </p>
        </div>
      </div>

      <h2 className="font-medium mb-4">Posts</h2>

      {!posts?.length ? (
        <p>No posts yet.</p>
      ) : (
        <ul className="divide-y border rounded">
          {posts.map((post) => {
            const thread = Array.isArray(post.threads)
              ? post.threads[0]
              : post.threads;
            const preview = post.body.trim().slice(0, 160);

            return (
              <li key={post.id} className="p-4">
                <Link
                  href={`/threads/${post.thread_id}`}
                  className="font-medium block"
                >
                  {thread?.title ?? "Thread"}
                </Link>
                <p className="text-sm text-neutral-600 mt-1">
                  {new Date(post.created_at).toLocaleString()}
                </p>
                {preview ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {preview}
                    {post.body.trim().length > 160 ? "…" : ""}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={pages}
        hrefForPage={(p) => `/u/${profile.username}?page=${p}`}
      />
    </main>
  );
}
