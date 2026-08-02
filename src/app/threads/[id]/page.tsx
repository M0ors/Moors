import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Avatar";
import { ThreadDiscussion } from "@/components/ThreadDiscussion";
import { buildPostTree } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { id: string };
};

export default async function ThreadPage({ params }: Props) {
  const supabase = createClient();
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
        profiles,
      };
    })
  );

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Back to threads</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-2">{thread.title}</h1>
      <div className="text-sm text-neutral-600 mb-8 flex items-center gap-2 flex-wrap">
        <Avatar username={author?.username} avatarUrl={author?.avatar_url} size={24} />
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          started by {author?.username ?? "unknown"}
          {author?.is_admin ? <AdminBadge /> : null}
          <span>· {new Date(thread.created_at).toLocaleString()}</span>
        </span>
      </div>

      <ThreadDiscussion
        threadId={thread.id}
        posts={tree}
        currentUserId={user?.id ?? null}
        isAdmin={isAdmin}
      />

      {!user ? (
        <p className="mt-8 text-sm">
          <Link href="/login">Log in</Link> to reply.
        </p>
      ) : null}
    </main>
  );
}
