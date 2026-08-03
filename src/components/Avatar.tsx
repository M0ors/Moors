import Image from "next/image";

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  size?: number;
  blurred?: boolean;
};

export function Avatar({ username, avatarUrl, size = 32, blurred = false }: Props) {
  const initial = (username?.trim()?.[0] ?? "?").toUpperCase();

  if (avatarUrl) {
    return (
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
    );
  }

  return (
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
}
