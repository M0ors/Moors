import Image from "next/image";
import Link from "next/link";
import {
  approvePostImage,
  banUser,
  rejectPostImage,
  removeUser,
  revokeBadge,
  reviewAccessRequest,
  setModerator,
  unbanUser,
} from "@/app/actions/admin";
import { requireStaff } from "@/lib/auth";
import { hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminBadge } from "@/components/AdminBadge";
import { AdminBadges } from "@/components/AdminBadges";
import { AdminNav, parseAdminTab, type AdminTab } from "@/components/AdminNav";
import { AdminSubBoards } from "@/components/AdminSubBoards";
import { Avatar } from "@/components/Avatar";
import { BadgeIcon } from "@/components/BadgeIcon";
import { ModBadge } from "@/components/ModBadge";

type Props = {
  searchParams: { tab?: string };
};

type UserBadgeRow = {
  user_id: string;
  badge_id: string;
  badges:
    | { id: string; name: string; image_url: string | null; is_nsfw: boolean }
    | { id: string; name: string; image_url: string | null; is_nsfw: boolean }[]
    | null;
};

export default async function AdminPage({ searchParams }: Props) {
  const { user: staff, profile: staffProfile } = await requireStaff();
  const isAdmin = Boolean(staffProfile.is_admin);
  const supabase = createClient();
  const canRemove = hasServiceRoleKey();
  const allowedTabs: AdminTab[] = isAdmin
    ? ["images", "access", "sub-boards", "badges", "users"]
    : ["images"];
  const tab = parseAdminTab(searchParams.tab, allowedTabs);

  const [
    { data: users, error },
    { data: pendingImages },
    { data: accessRequests },
    { data: boards },
    { data: subBoards },
    { data: badges },
    { data: userBadgeRows },
  ] = await Promise.all([
    isAdmin
      ? supabase
          .from("profiles")
          .select(
            "id, username, avatar_url, is_admin, is_moderator, is_banned, created_at"
          )
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
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
    isAdmin
      ? supabase
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
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: null }),
    isAdmin
      ? supabase
          .from("boards")
          .select("id, slug, name")
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: null }),
    isAdmin
      ? supabase
          .from("sub_boards")
          .select(
            "id, board_id, slug, name, description, is_adult, sort_order, max_threads_per_user, op_only_replies, allow_anonymous"
          )
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: null }),
    isAdmin
      ? supabase
          .from("badges")
          .select("id, slug, name, description, image_url, is_nsfw, sort_order")
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: null }),
    isAdmin
      ? supabase
          .from("user_badges")
          .select(
            "user_id, badge_id, badges:badge_id ( id, name, image_url, is_nsfw )"
          )
      : Promise.resolve({ data: null }),
  ]);

  if (isAdmin && error) {
    return <p>Failed to load users: {error.message}</p>;
  }

  const badgesByUser = new Map<
    string,
    { id: string; name: string; image_url: string | null; is_nsfw: boolean }[]
  >();
  for (const row of (userBadgeRows as UserBadgeRow[] | null) ?? []) {
    const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;
    if (!badge) continue;
    const list = badgesByUser.get(row.user_id) ?? [];
    list.push(badge);
    badgesByUser.set(row.user_id, list);
  }

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Boards</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-2">
        {isAdmin ? "Admin" : "Moderator"}
      </h1>
      <p className="text-sm text-neutral-600 mb-6">
        {isAdmin
          ? `Moderate content and manage boards, badges, and users${
              canRemove ? "." : " (add SUPABASE_SERVICE_ROLE_KEY to enable remove)."
            }`
          : "Approve pending images. You can also delete threads and replies from the forum."}
      </p>

      <AdminNav
        active={tab}
        allowedTabs={allowedTabs}
        counts={{
          images: pendingImages?.length ?? 0,
          access: accessRequests?.length ?? 0,
        }}
      />

      {tab === "sub-boards" && isAdmin ? (
        <AdminSubBoards boards={boards ?? []} subBoards={subBoards ?? []} />
      ) : null}

      {tab === "badges" && isAdmin ? (
        <AdminBadges badges={badges ?? []} />
      ) : null}

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

      {tab === "access" && isAdmin ? (
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

      {tab === "users" && isAdmin ? (
        <section>
          <h2 className="font-medium mb-3">Users</h2>
          {!users?.length ? (
            <p>No users found.</p>
          ) : (
            <ul className="divide-y border rounded">
              {users.map((profile) => {
                const isSelf = profile.id === staff.id;
                const owned = badgesByUser.get(profile.id) ?? [];

                return (
                  <li
                    key={profile.id}
                    className="p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar
                        username={profile.username}
                        avatarUrl={profile.avatar_url}
                        size={36}
                      />
                      <div className="min-w-0">
                        <p className="font-medium inline-flex items-center gap-2 flex-wrap">
                          {profile.username}
                          {profile.is_admin ? <AdminBadge /> : null}
                          {!profile.is_admin && profile.is_moderator ? (
                            <ModBadge />
                          ) : null}
                          {profile.is_banned ? (
                            <span className="text-xs text-red-600">banned</span>
                          ) : null}
                        </p>
                        <p className="text-sm text-neutral-600">
                          joined {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                        {owned.length ? (
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {owned.map((badge) => (
                              <li
                                key={badge.id}
                                className="inline-flex items-center gap-1.5 text-xs border rounded px-2 py-1"
                              >
                                <BadgeIcon badge={badge} size={14} />
                                <span>{badge.name}</span>
                                <form action={revokeBadge}>
                                  <input
                                    type="hidden"
                                    name="user_id"
                                    value={profile.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="badge_id"
                                    value={badge.id}
                                  />
                                  <button
                                    type="submit"
                                    className="!bg-transparent !text-red-700 !p-0 !text-xs"
                                    title="Revoke badge"
                                  >
                                    ×
                                  </button>
                                </form>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>

                    {isSelf ? (
                      <p className="text-sm text-neutral-500">You</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {!profile.is_admin ? (
                          <form action={setModerator}>
                            <input type="hidden" name="user_id" value={profile.id} />
                            <input
                              type="hidden"
                              name="is_moderator"
                              value={profile.is_moderator ? "false" : "true"}
                            />
                            <button
                              type="submit"
                              className="!bg-white !text-neutral-900"
                            >
                              {profile.is_moderator
                                ? "Remove moderator"
                                : "Make moderator"}
                            </button>
                          </form>
                        ) : null}
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
