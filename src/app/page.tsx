import Link from "next/link";
import { ForumShell } from "@/components/ForumShell";
import { boardPath, subBoardPath } from "@/lib/boards";
import { canAccessAdultContent } from "@/lib/nsfw";
import { getPopularThreads } from "@/lib/popular";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
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

  const [{ data: boards, error }, { data: subBoards }, popularThreads] =
    await Promise.all([
      supabase
        .from("boards")
        .select("id, slug, name, description, is_adult, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("sub_boards")
        .select("id, board_id, slug, name, is_adult, sort_order")
        .order("sort_order", { ascending: true }),
      getPopularThreads({ canAdult }),
    ]);

  if (error) {
    return <p>Failed to load boards: {error.message}</p>;
  }

  const visibleBoards = (boards ?? []).filter(
    (board) => !board.is_adult || canAdult
  );

  return (
    <main>
      <ForumShell popularThreads={popularThreads} canViewNsfw={canAdult}>
        <h1 className="text-2xl font-semibold mb-2">Boards</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Choose a board or sub-board to browse and post.
          {!canAdult
            ? " Some content may be hidden due to your preferences"
            : ""}
        </p>

        <ul className="divide-y border rounded">
          {visibleBoards.map((board) => {
            const subs = (subBoards ?? []).filter(
              (sub) =>
                sub.board_id === board.id && (!sub.is_adult || canAdult)
            );

            return (
              <li key={board.id} className="p-4">
                <Link href={boardPath(board.slug)} className="font-medium block">
                  {board.name}
                  {board.is_adult ? (
                    <span className="ml-2 text-xs font-semibold uppercase text-red-700">
                      Adult
                    </span>
                  ) : null}
                </Link>
                {board.description ? (
                  <p className="text-sm text-neutral-600 mt-1">{board.description}</p>
                ) : null}
                {subs.length ? (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {subs.map((sub) => (
                      <li key={sub.id}>
                        <Link href={subBoardPath(board.slug, sub.slug)}>
                          {sub.name}
                          {sub.is_adult ? " · Adult" : ""}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </ForumShell>
    </main>
  );
}
