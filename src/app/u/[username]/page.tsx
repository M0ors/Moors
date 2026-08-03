import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { BadgeMarquee } from "@/components/BadgeMarquee";
import { ForumShell } from "@/components/ForumShell";
import { Pagination } from "@/components/Pagination";
import { Username } from "@/components/Username";
import { visibleBadges } from "@/lib/badges";
import { censorText } from "@/lib/censor";
import { countryFlag, countryName } from "@/lib/countries";
import { canAccessAdultContent, shouldBlurAvatar } from "@/lib/nsfw";
import { parsePage, THREADS_PER_PAGE, totalPages } from "@/lib/pagination";
import { getPopularThreads } from "@/lib/popular";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { username: string };
  searchParams: { page?: string };
};

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const supabase = createClient();
  const page = parsePage(searchParams.page);
  const username = decodeURIComponent(params.username);
  const from = (page - 1) * THREADS_PER_PAGE;
  const to = from + THREADS_PER_PAGE - 1;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      id, username, avatar_url, is_admin, created_at, about_me, username_color, country_code,
      nsfw_enabled, top_likes, top_dislikes, display_badge_id,
      display_badge:display_badge_id ( id, slug, name, image_url, is_nsfw )
    `
    )
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewerCanNsfw = false;
  let isSelf = false;
  if (user) {
    isSelf = user.id === profile.id;
    const { data: viewer } = await supabase
      .from("profiles")
      .select("date_of_birth, nsfw_enabled")
      .eq("id", user.id)
      .single();
    viewerCanNsfw = canAccessAdultContent({
      dateOfBirth: viewer?.date_of_birth,
      nsfwEnabled: viewer?.nsfw_enabled,
    });
  }

  const blurAvatar =
    !isSelf &&
    shouldBlurAvatar({
      nsfwEnabled: profile.nsfw_enabled,
      isAdmin: profile.is_admin,
      viewerCanNsfw,
    });

  const [{ data: badgeRows }, { data: posts, error, count }, popularThreads] =
    await Promise.all([
      supabase
        .from("user_badges")
        .select("badges:badge_id ( id, slug, name, image_url, is_nsfw, sort_order )")
        .eq("user_id", profile.id),
      supabase
        .from("posts")
        .select(
          `
          id,
          body,
          created_at,
          thread_id,
          threads:thread_id ( id, title )
        `,
          { count: "exact" }
        )
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
        .range(from, to),
      getPopularThreads({ canAdult: viewerCanNsfw }),
    ]);

  if (error) {
    return <p>Failed to load posts: {error.message}</p>;
  }

  const badges = visibleBadges(
    (badgeRows ?? [])
      .map((row) => {
        const badge = Array.isArray(row.badges) ? row.badges[0] : row.badges;
        return badge;
      })
      .filter(Boolean) as {
      id: string;
      slug: string;
      name: string;
      image_url?: string | null;
      is_nsfw?: boolean | null;
    }[],
    viewerCanNsfw || isSelf
  );

  const displayBadge = Array.isArray(profile.display_badge)
    ? profile.display_badge[0]
    : profile.display_badge;

  const pages = totalPages(count ?? 0, THREADS_PER_PAGE);
  const country = countryName(profile.country_code);
  const flag = countryFlag(profile.country_code);
  const topLikes = profile.top_likes ?? [];
  const topDislikes = profile.top_dislikes ?? [];

  return (
    <main>
      <ForumShell
        popularThreads={popularThreads}
        canViewNsfw={viewerCanNsfw}
        hideNsfwOpDetails={blurAvatar}
        op={{
          username: profile.username,
          avatar_url: profile.avatar_url,
          is_admin: profile.is_admin,
          username_color: profile.username_color,
          country_code: profile.country_code,
          created_at: profile.created_at,
          nsfw_enabled: profile.nsfw_enabled,
          display_badge:
            displayBadge && (!displayBadge.is_nsfw || viewerCanNsfw || isSelf)
              ? displayBadge
              : null,
        }}
      >
        <p className="mb-4">
          <Link href="/">← Boards</Link>
        </p>

        <div className="flex items-center gap-4 mb-6">
          <Avatar
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size={72}
            blurred={blurAvatar}
          />
          <div>
            <h1 className="text-2xl font-semibold">
              <Username
                username={profile.username}
                isAdmin={profile.is_admin}
                color={profile.username_color}
                badge={
                  displayBadge &&
                  (!displayBadge.is_nsfw || viewerCanNsfw || isSelf)
                    ? displayBadge
                    : null
                }
              />
            </h1>
            <p className="text-sm text-neutral-600 mt-1 inline-flex items-center gap-1.5 flex-wrap">
              <span>
                Joined {new Date(profile.created_at).toLocaleDateString()} ·{" "}
                {count ?? 0} posts
              </span>
              {country ? (
                <span className="inline-flex items-center gap-1">
                  ·{" "}
                  {flag ? (
                    <span aria-hidden className="text-base leading-none">
                      {flag}
                    </span>
                  ) : null}
                  {country}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {profile.about_me ? (
          <section className="mb-6">
            <h2 className="font-medium mb-2">About</h2>
            <p className="whitespace-pre-wrap text-sm">
              {censorText(profile.about_me, viewerCanNsfw)}
            </p>
          </section>
        ) : null}

        {(topLikes.length > 0 || topDislikes.length > 0) && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2">
            {topLikes.length ? (
              <div>
                <h2 className="font-medium mb-2">Likes</h2>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  {topLikes.map((item: string) => (
                    <li key={item}>{censorText(item, viewerCanNsfw)}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {topDislikes.length ? (
              <div>
                <h2 className="font-medium mb-2">Dislikes</h2>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  {topDislikes.map((item: string) => (
                    <li key={item}>{censorText(item, viewerCanNsfw)}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        )}

        <BadgeMarquee badges={badges} />

        <h2 className="font-medium mb-4">Posts</h2>

        {!posts?.length ? (
          <p>No posts yet.</p>
        ) : (
          <ul className="divide-y border rounded">
            {posts.map((post) => {
              const thread = Array.isArray(post.threads)
                ? post.threads[0]
                : post.threads;
              const preview = post.body.trim().slice(0, 160);

              return (
                <li key={post.id} className="p-4">
                  <Link
                    href={`/threads/${post.thread_id}`}
                    className="font-medium block"
                  >
                    {censorText(thread?.title ?? "Thread", viewerCanNsfw)}
                  </Link>
                  <p className="text-sm text-neutral-600 mt-1">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                  {preview ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {censorText(preview, viewerCanNsfw)}
                      {post.body.trim().length > 160 ? "…" : ""}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={pages}
          hrefForPage={(p) => `/u/${profile.username}?page=${p}`}
        />
      </ForumShell>
    </main>
  );
}
