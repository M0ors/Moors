import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/Avatar";
import { Username } from "@/components/Username";

export async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;
  let usernameColor: string | null = null;
  let countryCode: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, is_admin, username_color, country_code")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = Boolean(profile?.is_admin);
    usernameColor = profile?.username_color ?? null;
    countryCode = profile?.country_code ?? null;
  }

  return (
    <header className="border-b mb-8 py-4 flex items-center justify-between gap-4">
      <Link href="/" className="font-semibold text-lg">
        Moors
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link
              href={username ? `/u/${username}` : "/profile"}
              className="flex items-center gap-2 no-underline"
            >
              <Avatar username={username} avatarUrl={avatarUrl} size={28} />
              {username ? (
                <Username
                  username={username}
                  isAdmin={isAdmin}
                  color={usernameColor}
                  countryCode={countryCode}
                />
              ) : (
                <span className="underline">{user.email}</span>
              )}
            </Link>
            <Link href="/profile">Settings</Link>
            <Link href="/threads/new">New thread</Link>
            {isAdmin ? <Link href="/admin">Admin</Link> : null}
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
