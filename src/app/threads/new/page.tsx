import Link from "next/link";
import { redirect } from "next/navigation";
import { NewThreadForm } from "@/components/NewThreadForm";
import { canAccessAdultContent } from "@/lib/nsfw";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: { board?: string };
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
    .select("slug, name, is_adult")
    .eq("slug", boardSlug)
    .maybeSingle();

  if (!board) {
    redirect("/");
  }

  if (board.is_adult) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("date_of_birth, nsfw_enabled")
      .eq("id", user.id)
      .single();

    if (
      !canAccessAdultContent({
        dateOfBirth: profile?.date_of_birth,
        nsfwEnabled: profile?.nsfw_enabled,
      })
    ) {
      redirect("/");
    }
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
      />
    </main>
  );
}
