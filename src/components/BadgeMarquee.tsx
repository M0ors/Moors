import { BadgeIcon } from "@/components/BadgeIcon";
import type { BadgeRow } from "@/lib/badges";

const BADGE_SIZE = 22;
const BADGE_GAP = BADGE_SIZE * 2;

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
    <div
      className="badge-marquee-group flex items-center shrink-0"
      style={{ gap: BADGE_GAP, paddingRight: BADGE_GAP }}
    >
      {badges.map((badge, index) => (
        <span
          key={`${keyPrefix}-${badge.id}-${index}`}
          className="inline-flex shrink-0"
          title={badge.name}
        >
          <BadgeIcon badge={badge} size={BADGE_SIZE} />
        </span>
      ))}
    </div>
  );
}

export function BadgeMarquee({ badges }: Props) {
  if (!badges.length) return null;

  // Duplicate the set so the -50% loop joins with no gap.
  const sequence = badges.length < 6 ? [...badges, ...badges, ...badges] : badges;

  return (
    <div className="badge-marquee border-y my-6 overflow-hidden bg-neutral-50">
      <div className="badge-marquee-track flex w-max py-3">
        <BadgeGroup badges={sequence} keyPrefix="a" />
        <BadgeGroup badges={sequence} keyPrefix="b" />
      </div>
    </div>
  );
}
