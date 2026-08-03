import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Username } from "@/components/Username";
import { censorText } from "@/lib/censor";
import type { PopularThread, SidebarOp } from "@/lib/popular";

type Props = {
  popularThreads: PopularThread[];
  op?: SidebarOp | null;
  canViewNsfw: boolean;
  hideNsfwOpDetails?: boolean;
};

export function Sidebar({
  popularThreads,
  op,
  canViewNsfw,
  hideNsfwOpDetails = false,
}: Props) {
  const blurAvatar = hideNsfwOpDetails;

  return (
    <aside className="space-y-8">
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
