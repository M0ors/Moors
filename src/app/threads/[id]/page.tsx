import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ReplyForm } from "@/components/ReplyForm";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { id: string };
};

export default async function ThreadPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select(
      `
      id,
      title,
      created_at,
      profiles:author_id ( username, avatar_url )
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
      created_at,
      profiles:author_id ( username, avatar_url )
    `
    )
    .eq("thread_id", params.id)
    .order("created_at", { ascending: true });

  if (postsError) {
    return <p>Failed to load posts: {postsError.message}</p>;
  }

  const author = Array.isArray(thread.profiles) ? thread.profiles[0] : thread.profiles;

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Back to threads</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-2">{thread.title}</h1>
      <div className="text-sm text-neutral-600 mb-8 flex items-center gap-2">
        <Avatar username={author?.username} avatarUrl={author?.avatar_url} size={24} />
        <span>
          started by {author?.username ?? "unknown"} ·{" "}
          {new Date(thread.created_at).toLocaleString()}
        </span>
      </div>

      <ul className="space-y-6">
        {posts?.map((post) => {
          const postAuthor = Array.isArray(post.profiles)
            ? post.profiles[0]
            : post.profiles;

          return (
            <li key={post.id} className="border rounded p-4">
              <div className="text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <Avatar
                  username={postAuthor?.username}
                  avatarUrl={postAuthor?.avatar_url}
                  size={24}
                />
                <span>
                  {postAuthor?.username ?? "unknown"} ·{" "}
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{post.body}</p>
            </li>
          );
        })}
      </ul>

      {user ? (
        <ReplyForm threadId={thread.id} />
      ) : (
        <p className="mt-8 text-sm">
          <Link href="/login">Log in</Link> to reply.
        </p>
      )}
    </main>
  );
}
