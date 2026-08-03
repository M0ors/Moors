import { BadgeIcon } from "@/components/BadgeIcon";
import type { BadgeRow } from "@/lib/badges";

type Props = {
  badges: BadgeRow[];
};

export function BadgeMarquee({ badges }: Props) {
  if (!badges.length) return null;

  const loop = [...badges, ...badges];

  return (
    <div className="badge-marquee border-y my-6 overflow-hidden bg-neutral-50">
      <div className="badge-marquee-track flex items-center gap-6 py-3 whitespace-nowrap">
        {loop.map((badge, index) => (
          <span
            key={`${badge.id}-${index}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-700"
          >
            <BadgeIcon badge={badge} size={22} />
            <span>{badge.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
