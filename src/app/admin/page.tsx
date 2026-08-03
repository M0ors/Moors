import Image from "next/image";
import Link from "next/link";
import {
  approvePostImage,
  banUser,
  rejectPostImage,
  removeUser,
  reviewAccessRequest,
  unbanUser,
} from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminBadge } from "@/components/AdminBadge";
import { AdminBadges } from "@/components/AdminBadges";
import { AdminNav, parseAdminTab } from "@/components/AdminNav";
import { AdminSubBoards } from "@/components/AdminSubBoards";
import { Avatar } from "@/components/Avatar";

type Props = {
  searchParams: { tab?: string };
};

export default async function AdminPage({ searchParams }: Props) {
  const { user: admin } = await requireAdmin();
  const supabase = createClient();
  const canRemove = hasServiceRoleKey();
  const tab = parseAdminTab(searchParams.tab);

  const [
    { data: users, error },
    { data: pendingImages },
    { data: accessRequests },
    { data: boards },
    { data: subBoards },
    { data: badges },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url, is_admin, is_banned, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("posts")
      .select(
        `
          id,
          image_url,
          created_at,
          thread_id,
          profiles:author_id ( username ),
          threads:thread_id ( title )
        `
      )
      .not("image_url", "is", null)
      .eq("image_approved", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("access_requests")
      .select(
        `
          id,
          full_name,
          age,
          access_wanted,
          status,
          created_at,
          user_id,
          profiles:user_id ( username )
        `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("boards")
      .select("id, slug, name")
      .order("sort_order", { ascending: true }),
    supabase
      .from("sub_boards")
      .select(
        "id, board_id, slug, name, description, is_adult, sort_order, max_threads_per_user, op_only_replies, allow_anonymous"
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("badges")
      .select("id, slug, name, description, image_url, is_nsfw, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (error) {
    return <p>Failed to load users: {error.message}</p>;
  }

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Boards</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-2">Admin</h1>
      <p className="text-sm text-neutral-600 mb-6">
        Moderate content and manage boards, badges, and users
        {canRemove ? "." : " (add SUPABASE_SERVICE_ROLE_KEY to enable remove)."}
      </p>

      <AdminNav
        active={tab}
        counts={{
          images: pendingImages?.length ?? 0,
          access: accessRequests?.length ?? 0,
        }}
      />

      {tab === "sub-boards" ? (
        <AdminSubBoards boards={boards ?? []} subBoards={subBoards ?? []} />
      ) : null}

      {tab === "badges" ? <AdminBadges badges={badges ?? []} /> : null}

      {tab === "images" ? (
        <section>
          <h2 className="font-medium mb-3">Pending images</h2>
          {!pendingImages?.length ? (
            <p className="text-sm text-neutral-600">No images awaiting approval.</p>
          ) : (
            <ul className="space-y-4">
              {pendingImages.map((post) => {
                const author = Array.isArray(post.profiles)
                  ? post.profiles[0]
                  : post.profiles;
                const thread = Array.isArray(post.threads)
                  ? post.threads[0]
                  : post.threads;

                return (
                  <li key={post.id} className="border rounded p-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      {author?.username ?? "user"} ·{" "}
                      <Link href={`/threads/${post.thread_id}`}>
                        {thread?.title ?? "Thread"}
                      </Link>{" "}
                      · {new Date(post.created_at).toLocaleString()}
                    </p>
                    {post.image_url ? (
                      <Image
                        src={post.image_url}
                        alt="Pending attachment"
                        width={480}
                        height={360}
                        className="max-w-full h-auto rounded border mb-3"
                      />
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <form action={approvePostImage}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <button type="submit">Approve</button>
                      </form>
                      <form action={rejectPostImage}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <button type="submit" className="!bg-white !text-neutral-900">
                          Reject
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "access" ? (
        <section>
          <h2 className="font-medium mb-3">Access requests</h2>
          {!accessRequests?.length ? (
            <p className="text-sm text-neutral-600">No pending requests.</p>
          ) : (
            <ul className="space-y-4">
              {accessRequests.map((request) => {
                const requester = Array.isArray(request.profiles)
                  ? request.profiles[0]
                  : request.profiles;

                return (
                  <li key={request.id} className="border rounded p-4">
                    <p className="font-medium">
                      {requester?.username ?? "user"} · {request.full_name}, age{" "}
                      {request.age}
                    </p>
                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      {request.access_wanted}
                    </p>
                    <p className="text-xs text-neutral-500 mt-2">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 items-center">
                      <form action={reviewAccessRequest}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button type="submit">Approve (grant access)</button>
                      </form>
                      <form action={reviewAccessRequest}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button type="submit" className="!bg-white !text-neutral-900">
                          Reject
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "users" ? (
        <section>
          <h2 className="font-medium mb-3">Users</h2>
          {!users?.length ? (
            <p>No users found.</p>
          ) : (
            <ul className="divide-y border rounded">
              {users.map((profile) => {
                const isSelf = profile.id === admin.id;

                return (
                  <li
                    key={profile.id}
                    className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        username={profile.username}
                        avatarUrl={profile.avatar_url}
                        size={36}
                      />
                      <div>
                        <p className="font-medium inline-flex items-center gap-2 flex-wrap">
                          {profile.username}
                          {profile.is_admin ? <AdminBadge /> : null}
                          {profile.is_banned ? (
                            <span className="text-xs text-red-600">banned</span>
                          ) : null}
                        </p>
                        <p className="text-sm text-neutral-600">
                          joined {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {isSelf ? (
                      <p className="text-sm text-neutral-500">You</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profile.is_banned ? (
                          <form action={unbanUser}>
                            <input type="hidden" name="user_id" value={profile.id} />
                            <button type="submit" className="!bg-white !text-neutral-900">
                              Unban
                            </button>
                          </form>
                        ) : (
                          <form action={banUser}>
                            <input type="hidden" name="user_id" value={profile.id} />
                            <button type="submit" className="!bg-white !text-neutral-900">
                              Ban
                            </button>
                          </form>
                        )}
                        {canRemove ? (
                          <form action={removeUser}>
                            <input type="hidden" name="user_id" value={profile.id} />
                            <button type="submit" className="!bg-red-700">
                              Remove
                            </button>
                          </form>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
