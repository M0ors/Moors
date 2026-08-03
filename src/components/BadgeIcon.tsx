import Image from "next/image";
import type { BadgeRow } from "@/lib/badges";

type Props = {
  badge: BadgeRow;
  size?: number;
  title?: string;
};

export function BadgeIcon({ badge, size = 16, title }: Props) {
  const label = title ?? badge.name;

  if (badge.image_url) {
    return (
      <Image
        src={badge.image_url}
        alt={label}
        width={size}
        height={size}
        title={label}
        className="inline-block object-contain shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      title={label}
      className="inline-flex items-center justify-center rounded-sm bg-neutral-800 text-white text-[9px] font-semibold uppercase shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.45) }}
      aria-label={label}
    >
      {badge.name.slice(0, 1)}
    </span>
  );
}
