import Link from "next/link";
import { AdminBadge } from "@/components/AdminBadge";
import { countryFlag } from "@/lib/countries";

type Props = {
  username?: string | null;
  isAdmin?: boolean | null;
  color?: string | null;
  countryCode?: string | null;
  href?: string | null;
  showBadge?: boolean;
};

export function Username({
  username,
  isAdmin = false,
  color,
  countryCode,
  href,
  showBadge = true,
}: Props) {
  const label = username ?? "unknown";
  const flag = countryFlag(countryCode);

  const style = isAdmin
    ? {
        color: "#ffffff",
        textShadow:
          "0 0 4px #ff0000, 0 0 8px #ff0000, 0 0 14px #ff3333, 0 0 22px #990000",
        backgroundColor: "#111111",
        padding: "0 0.25rem",
        borderRadius: "0.2rem",
      }
    : color
      ? { color }
      : undefined;

  const name = (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {flag ? (
        <span aria-hidden className="text-base leading-none">
          {flag}
        </span>
      ) : null}
      <span className={href ? "underline" : undefined} style={style}>
        {label}
      </span>
      {showBadge && isAdmin ? <AdminBadge /> : null}
    </span>
  );

  if (href && username) {
    return (
      <Link href={href} className="no-underline">
        {name}
      </Link>
    );
  }

  return name;
}
