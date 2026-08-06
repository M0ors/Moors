import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumShell } from "@/components/ForumShell";
import { VoteButtons } from "@/components/VoteButtons";
import { canAccessAdultContent } from "@/lib/nsfw";
import { getPopularThreads } from "@/lib/popular";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { id: string };
};

export default async function AnnouncementPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canAdult = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("date_of_birth, nsfw_enabled")
      .eq("id", user.id)
      .single();
    canAdult = canAccessAdultContent({
      dateOfBirth: profile?.date_of_birth,
      nsfwEnabled: profile?.nsfw_enabled,
    });
  }

  const { data: announcement } = await supabase
    .from("announcements")
    .select(
      "id, title, body, like_count, dislike_count, created_at, profiles:author_id ( username )"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!announcement) {
    notFound();
  }

  const author = Array.isArray(announcement.profiles)
    ? announcement.profiles[0]
    : announcement.profiles;

  let userVote: number | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("target_type", "announcement")
      .eq("target_id", announcement.id)
      .maybeSingle();
    userVote = vote?.value ?? null;
  }

  const popularThreads = await getPopularThreads({ canAdult });
  const redirectTo = `/announcements/${announcement.id}`;

  return (
    <main>
      <ForumShell popularThreads={popularThreads} canViewNsfw={canAdult}>
        <p className="mb-4">
          <Link href="/">← Boards</Link>
        </p>

        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
          Announcement
        </p>
        <h1 className="text-2xl font-semibold mb-2">{announcement.title}</h1>
        <p className="text-sm text-neutral-600 mb-6">
          {author?.username ?? "staff"} ·{" "}
          {new Date(announcement.created_at).toLocaleString()}
        </p>

        <p className="whitespace-pre-wrap mb-6">{announcement.body}</p>

        <VoteButtons
          targetType="announcement"
          targetId={announcement.id}
          likeCount={announcement.like_count ?? 0}
          dislikeCount={announcement.dislike_count ?? 0}
          userVote={userVote}
          redirectTo={redirectTo}
          canVote={Boolean(user)}
        />

        <p className="mt-6 text-sm text-neutral-600">
          Announcements do not accept replies.
        </p>
      </ForumShell>
    </main>
  );
}
