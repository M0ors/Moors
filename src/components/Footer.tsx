import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export async function Footer() {
  const { profile } = await getCurrentProfile();
  const isStaff = Boolean(profile?.is_admin || profile?.is_moderator);

  return (
    <footer className="border-t mt-12 pt-6 pb-2 text-sm text-neutral-600">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Moors</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/">Boards</Link>
          <Link href="/boards/general">General</Link>
          <Link href="/boards/community">Community</Link>
          <Link href="/boards/other">Other</Link>
          <Link href="/profile">Settings</Link>
          <Link href="/terms">Terms</Link>
          {isStaff ? <Link href="/staff-guide">Staff guide</Link> : null}
        </nav>
      </div>
    </footer>
  );
}
