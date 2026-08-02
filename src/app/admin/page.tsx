import Link from "next/link";
import { banUser, removeUser, unbanUser } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { hasServiceRoleKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";

export default async function AdminPage() {
  const { user: admin } = await requireAdmin();
  const supabase = createClient();
  const canRemove = hasServiceRoleKey();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, is_admin, is_banned, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <p>Failed to load users: {error.message}</p>;
  }

  return (
    <main>
      <p className="mb-4">
        <Link href="/">← Back to threads</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-2">Admin</h1>
      <p className="text-sm text-neutral-600 mb-6">
        Ban users to stop posting. Remove deletes their account
        {canRemove ? "." : " (add SUPABASE_SERVICE_ROLE_KEY to enable remove)."}
      </p>

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
                    <p className="font-medium">
                      {profile.username}
                      {profile.is_admin ? (
                        <span className="ml-2 text-xs text-neutral-500">admin</span>
                      ) : null}
                      {profile.is_banned ? (
                        <span className="ml-2 text-xs text-red-600">banned</span>
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
    </main>
  );
}
