import Image from "next/image";

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  size?: number;
  blurred?: boolean;
  /** green = online, orange = offline/idle, omit = no indicator */
  presence?: "online" | "offline" | null;
};

export function Avatar({
  username,
  avatarUrl,
  size = 32,
  blurred = false,
  presence = null,
}: Props) {
  const initial = (username?.trim()?.[0] ?? "?").toUpperCase();
  const dot = Math.max(8, Math.round(size * 0.28));

  const media = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={username ? `${username}'s avatar` : "User avatar"}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-neutral-200 shrink-0 ${
        blurred ? "blur-sm" : ""
      }`}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-neutral-200 text-neutral-700 font-medium shrink-0 ${
        blurred ? "blur-sm" : ""
      }`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initial}
    </span>
  );

  if (!presence) {
    return media;
  }

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {media}
      <span
        className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
          presence === "online" ? "bg-green-500" : "bg-orange-500"
        }`}
        style={{ width: dot, height: dot }}
        title={presence === "online" ? "Active" : "Inactive"}
        aria-label={presence === "online" ? "Active" : "Inactive"}
      />
    </span>
  );
}
