import Link from "next/link";
import { redirect } from "next/navigation";
import { NewThreadForm } from "@/components/NewThreadForm";
import { canAccessAdultContent } from "@/lib/nsfw";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: { board?: string; sub?: string };
};

export default async function NewThreadPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const boardSlug = searchParams.board || "general";
  const { data: board } = await supabase
    .from("boards")
    .select("id, slug, name, is_adult")
    .eq("slug", boardSlug)
    .maybeSingle();

  if (!board) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("date_of_birth, nsfw_enabled, is_admin")
    .eq("id", user.id)
    .single();

  const canAdult = canAccessAdultContent({
    dateOfBirth: profile?.date_of_birth,
    nsfwEnabled: profile?.nsfw_enabled,
  });

  if (board.is_adult && !canAdult) {
    redirect("/");
  }

  const { data: subBoards } = await supabase
    .from("sub_boards")
    .select(
      "slug, name, is_adult, allow_anonymous, max_threads_per_user, op_only_replies, sort_order"
    )
    .eq("board_id", board.id)
    .order("sort_order", { ascending: true });

  const visibleSubs = (subBoards ?? []).filter((s) => {
    if (s.is_adult && !canAdult) return false;
    if (s.slug === "site-updates" && !profile?.is_admin) return false;
    return true;
  });

  if (searchParams.sub === "site-updates" && !profile?.is_admin) {
    redirect(`/boards/${board.slug}/site-updates`);
  }

  if (!visibleSubs.length) {
    return (
      <main>
        <p>No sub-boards available for posting.</p>
      </main>
    );
  }

  return (
    <main>
      <p className="mb-4">
        <Link href={`/boards/${board.slug}`}>← Back to {board.name}</Link>
      </p>
      <h1 className="text-2xl font-semibold mb-6">New thread</h1>
      <NewThreadForm
        boardSlug={board.slug}
        boardName={board.name}
        isAdult={board.is_adult}
        subBoards={visibleSubs}
        initialSubBoard={searchParams.sub}
      />
    </main>
  );
}
