import Link from "next/link";
import { boardPath } from "@/lib/boards";
import { canAccessAdultContent } from "@/lib/nsfw";
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

  const { data: boards, error } = await supabase
    .from("boards")
    .select("id, slug, name, description, is_adult, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return <p>Failed to load boards: {error.message}</p>;
  }

  const visibleBoards = (boards ?? []).filter(
    (board) => !board.is_adult || canAdult
  );

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-2">Boards</h1>
      <p className="text-sm text-neutral-600 mb-6">
        Choose a board to browse and post.
        {!canAdult
          ? " Adult is hidden unless you are 18+ and enable NSFW in Settings."
          : ""}
      </p>

      <ul className="divide-y border rounded">
        {visibleBoards.map((board) => (
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
          </li>
        ))}
      </ul>
    </main>
  );
}
