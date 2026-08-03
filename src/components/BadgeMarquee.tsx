import { BadgeIcon } from "@/components/BadgeIcon";
import type { BadgeRow } from "@/lib/badges";

type Props = {
  badges: BadgeRow[];
};

function BadgeGroup({
  badges,
  keyPrefix,
}: {
  badges: BadgeRow[];
  keyPrefix: string;
}) {
  return (
    <div className="badge-marquee-group flex items-center gap-6 pr-6">
      {badges.map((badge, index) => (
        <span
          key={`${keyPrefix}-${badge.id}-${index}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-700 shrink-0"
        >
          <BadgeIcon badge={badge} size={22} />
          <span>{badge.name}</span>
        </span>
      ))}
    </div>
  );
}

export function BadgeMarquee({ badges }: Props) {
  if (!badges.length) return null;

  // Duplicate the set so the -50% loop joins with no gap.
  const sequence = badges.length < 4 ? [...badges, ...badges, ...badges] : badges;

  return (
    <div className="badge-marquee border-y my-6 overflow-hidden bg-neutral-50">
      <div className="badge-marquee-track flex w-max">
        <BadgeGroup badges={sequence} keyPrefix="a" />
        <BadgeGroup badges={sequence} keyPrefix="b" />
      </div>
    </div>
  );
}
