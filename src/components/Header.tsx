import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <header className="border-b mb-8 py-4 flex items-center justify-between gap-4">
      <Link href="/" className="font-semibold text-lg">
        Moors
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <span>{username ?? user.email}</span>
            <Link href="/threads/new">New thread</Link>
            <form action={signOut}>
              <button type="submit">Log out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
