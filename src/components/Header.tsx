import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/Avatar";
import { NewThreadLink } from "@/components/NewThreadLink";
import { Username } from "@/components/Username";
import { canAccessAdultContent } from "@/lib/nsfw";

export async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;
  let isModerator = false;
  let usernameColor: string | null = null;
  let canAdult = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "username, avatar_url, is_admin, is_moderator, username_color, date_of_birth, nsfw_enabled"
      )
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = Boolean(profile?.is_admin);
    isModerator = Boolean(profile?.is_moderator);
    usernameColor = profile?.username_color ?? null;
    canAdult = canAccessAdultContent({
      dateOfBirth: profile?.date_of_birth,
      nsfwEnabled: profile?.nsfw_enabled,
    });
  }

  return (
    <header className="border-b mb-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/" className="no-underline inline-flex items-center" aria-label="Moors home">
          <Image
            src="/logo.png"
            alt="Moors"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/boards/general">General</Link>
          <Link href="/boards/stories">Stories</Link>
          {canAdult ? <Link href="/boards/adult">Adult</Link> : null}
        </nav>
      </div>
      <nav className="flex items-center gap-4 text-sm flex-wrap">
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
                  isModerator={isModerator}
                  color={usernameColor}
                />
              ) : (
                <span className="underline">{user.email}</span>
              )}
            </Link>
            <Link href="/profile">Settings</Link>
            <NewThreadLink />
            {isAdmin ? <Link href="/admin">Admin</Link> : null}
            {!isAdmin && isModerator ? <Link href="/admin">Mod</Link> : null}
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
