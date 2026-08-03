import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-12 pt-6 pb-2 text-sm text-neutral-600">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Moors</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/">Boards</Link>
          <Link href="/boards/general">General</Link>
          <Link href="/boards/stories">Stories</Link>
          <Link href="/profile">Settings</Link>
        </nav>
      </div>
    </footer>
  );
}
