import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Username } from "@/components/Username";
import { censorText } from "@/lib/censor";
import type { SidebarAnnouncement } from "@/lib/announcements";
import type { PopularThread, SidebarOp } from "@/lib/popular";
import type { StaffMember } from "@/lib/staff";

type Props = {
  popularThreads: PopularThread[];
  announcements?: SidebarAnnouncement[];
  staff?: StaffMember[];
  op?: SidebarOp | null;
  canViewNsfw: boolean;
  hideNsfwOpDetails?: boolean;
};

export function Sidebar({
  popularThreads,
  announcements = [],
  staff = [],
  op,
  canViewNsfw,
  hideNsfwOpDetails = false,
}: Props) {
  const blurAvatar = hideNsfwOpDetails;

  return (
    <aside className="space-y-8">
      <section>
        <h2 className="font-medium mb-3 text-sm uppercase tracking-wide text-neutral-500">
          Staff
        </h2>
        {!staff.length ? (
          <p className="text-sm text-neutral-600">No staff listed.</p>
        ) : (
          <ul className="space-y-3">
            {staff.map((member) => (
              <li key={member.id} className="flex items-center gap-2 min-w-0">
                <Avatar
                  username={member.username}
                  avatarUrl={member.avatar_url}
                  size={28}
                  presence={member.isOnline ? "online" : "offline"}
                />
                <div className="min-w-0">
                  <Username
                    username={member.username}
                    isAdmin={member.is_admin}
                    isModerator={member.is_moderator}
                    color={member.username_color}
                    href={`/u/${member.username}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3 text-sm uppercase tracking-wide text-neutral-500">
          {"Popular threads (<30 days)"}
        </h2>
        {!popularThreads.length ? (
          <p className="text-sm text-neutral-600">No popular threads yet.</p>
        ) : (
          <ul className="space-y-3">
            {popularThreads.map((thread) => (
              <li key={thread.id}>
                <Link href={`/threads/${thread.id}`} className="text-sm font-medium block">
                  {censorText(thread.title, canViewNsfw)}
                </Link>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {thread.like_count} likes ·{" "}
                  {new Date(thread.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3 text-sm uppercase tracking-wide text-neutral-500">
          Announcements
        </h2>
        {!announcements.length ? (
          <p className="text-sm text-neutral-600">No announcements yet.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="text-sm font-medium block">
                  {item.title}
                </Link>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {item.source === "site-update" ? "Site update" : "Announcement"}{" "}
                  · {item.like_count} likes ·{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {op ? (
        <section>
          <h2 className="font-medium mb-3 text-sm uppercase tracking-wide text-neutral-500">
            OP details
          </h2>
          <div className="flex items-start gap-3">
            <Avatar
              username={op.username}
              avatarUrl={op.avatar_url}
              size={48}
              blurred={blurAvatar}
            />
            <div className="min-w-0">
              <Username
                username={op.username}
                isAdmin={op.is_admin}
                isModerator={op.is_moderator}
                color={op.username_color}
                href={op.username ? `/u/${op.username}` : null}
                badge={
                  op.display_badge &&
                  (!op.display_badge.is_nsfw || canViewNsfw)
                    ? op.display_badge
                    : null
                }
              />
              {op.created_at ? (
                <p className="text-xs text-neutral-500 mt-1">
                  Joined {new Date(op.created_at).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
