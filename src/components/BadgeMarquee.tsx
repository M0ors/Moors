"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeIcon } from "@/components/BadgeIcon";
import type { BadgeRow } from "@/lib/badges";

const BADGE_SIZE = 22;
const BADGE_GAP = BADGE_SIZE * 2;

type Props = {
  badges: BadgeRow[];
};

function BadgeStrip({
  badges,
  copies,
  keyPrefix,
}: {
  badges: BadgeRow[];
  copies: number;
  keyPrefix: string;
}) {
  const items = Array.from({ length: copies }, () => badges).flat();

  return (
    <div
      className="flex items-center shrink-0"
      style={{ gap: BADGE_GAP, paddingRight: BADGE_GAP }}
    >
      {items.map((badge, index) => (
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(8);

  useEffect(() => {
    if (!badges.length) return;

    function updateCopies() {
      const viewport = viewportRef.current;
      const measure = measureRef.current;
      if (!viewport || !measure) return;

      const unitWidth = measure.scrollWidth;
      const viewWidth = viewport.clientWidth;
      if (unitWidth <= 0 || viewWidth <= 0) return;

      // Enough copies so one strip is at least one full viewport wide.
      setCopies(Math.max(2, Math.ceil(viewWidth / unitWidth) + 1));
    }

    updateCopies();
    window.addEventListener("resize", updateCopies);
    return () => window.removeEventListener("resize", updateCopies);
  }, [badges]);

  if (!badges.length) return null;

  return (
    <div
      ref={viewportRef}
      className="badge-marquee border-y my-6 overflow-hidden bg-neutral-50"
    >
      {/* Hidden one-cycle measure strip */}
      <div
        ref={measureRef}
        className="absolute -left-[9999px] top-0 flex items-center opacity-0 pointer-events-none"
        style={{ gap: BADGE_GAP, paddingRight: BADGE_GAP }}
        aria-hidden
      >
        {badges.map((badge) => (
          <span key={`m-${badge.id}`} className="inline-flex shrink-0">
            <BadgeIcon badge={badge} size={BADGE_SIZE} />
          </span>
        ))}
      </div>

      <div className="badge-marquee-track flex w-max py-3">
        <BadgeStrip badges={badges} copies={copies} keyPrefix="a" />
        <BadgeStrip badges={badges} copies={copies} keyPrefix="b" />
      </div>
    </div>
  );
}
