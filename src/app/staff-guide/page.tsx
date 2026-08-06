import Link from "next/link";
import { requireStaff } from "@/lib/auth";

export default async function StaffGuidePage() {
  const { profile } = await requireStaff();
  const isAdmin = Boolean(profile.is_admin);

  return (
    <main className="max-w-3xl">
      <p className="mb-4">
        <Link href="/">← Boards</Link>
        {" · "}
        <Link href="/admin">Staff tools</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-2">Staff guide</h1>
      <p className="text-sm text-neutral-600 mb-8">
        How to use tools available to{" "}
        {isAdmin ? "admins and moderators" : "moderators"}.
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-medium mb-2">Open staff tools</h2>
          <p>
            Use the <Link href="/admin">Admin</Link> / <strong>Mod</strong> link
            in the header. Moderators only see the Images tab. Admins see every
            tab.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Approve or reject images</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open Staff tools → Images.</li>
            <li>Preview the pending attachment.</li>
            <li>
              <strong>Approve</strong> to show it publicly, or{" "}
              <strong>Reject</strong> to remove the image from the post.
            </li>
          </ol>
          <p className="mt-2 text-neutral-600">
            Authors (and staff) can still see pending images on the thread until
            approved.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Delete threads and replies</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open the thread on the forum.</li>
            <li>
              Use <strong>Delete thread</strong> under the title, or{" "}
              <strong>Delete</strong> on a reply.
            </li>
          </ol>
          <p className="mt-2 text-neutral-600">
            Authors can delete their own content; staff can delete anyone&apos;s.
            Pinning and title edits stay author/admin-only where already set up.
          </p>
        </section>

        {isAdmin ? (
          <>
            <section>
              <h2 className="text-lg font-medium mb-2">Access requests (adult)</h2>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Admin → Access.</li>
                <li>
                  Review name, age, and what they want access for.
                </li>
                <li>
                  <strong>Approve</strong> grants adult board access and the
                  Joined adult badge. <strong>Reject</strong> closes the request.
                </li>
                <li>
                  To remove adult access later: Admin → Users →{" "}
                  <strong>Revoke adult access</strong> on that user.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-2">Sub-boards</h2>
              <p>
                Admin → Sub-boards: create, edit, or delete sub-boards (slug,
                adult flag, anonymous posting, OP-only replies, thread limits).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-2">Badges</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create / edit badge definitions and upload images.</li>
                <li>Grant a badge by username.</li>
                <li>Revoke from a user on the Users tab (× next to the badge).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-2">Users</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ban / unban accounts.</li>
                <li>Make or remove moderators.</li>
                <li>Revoke adult access.</li>
                <li>Remove users (requires service role key).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium mb-2">Announcements</h2>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Admin → Announcements.</li>
                <li>Enter a title and body, then publish.</li>
                <li>
                  Announcements appear in the right sidebar for everyone and open
                  at <code>/announcements/…</code> (likes/dislikes only — no
                  replies).
                </li>
                <li>
                  Threads posted in <strong>General → Site updates</strong> also
                  appear in that same sidebar list.
                </li>
              </ol>
            </section>
          </>
        ) : (
          <section>
            <h2 className="text-lg font-medium mb-2">Admin-only tools</h2>
            <p className="text-neutral-600">
              Access requests, sub-boards, badges, user bans, moderators, and
              announcements are admin-only. Ask an admin if you need something in
              those areas.
            </p>
          </section>
        )}

        <section>
          <h2 className="text-lg font-medium mb-2">Display</h2>
          <p>
            Admins get a red glow username + Admin tag. Moderators get a pink glow
            + Mod tag. Staff avatars are not blurred for NSFW profile settings.
          </p>
        </section>
      </div>
    </main>
  );
}
