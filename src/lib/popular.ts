import { createClient } from "@/lib/supabase/server";

export type PopularThread = {
  id: string;
  title: string;
  like_count: number;
  is_nsfw: boolean;
  board_slug?: string | null;
};

export async function getPopularThreads(options: {
  canAdult: boolean;
  limit?: number;
}): Promise<PopularThread[]> {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from("threads")
    .select(
      `
      id,
      title,
      like_count,
      is_nsfw,
      created_at,
      boards:board_id ( slug, is_adult )
    `
    )
    .gte("created_at", since.toISOString())
    .order("like_count", { ascending: false })
    .limit(options.limit ?? 8);
  if (error || !data) {
    return [];
  }

  return data
    .filter((thread) => {
      const board = Array.isArray(thread.boards) ? thread.boards[0] : thread.boards;
      const adult = Boolean(board?.is_adult || thread.is_nsfw);
      return options.canAdult || !adult;
    })
    .map((thread) => {
      const board = Array.isArray(thread.boards) ? thread.boards[0] : thread.boards;
      return {
        id: thread.id,
        title: thread.title,
        like_count: thread.like_count ?? 0,
        is_nsfw: Boolean(thread.is_nsfw),
        board_slug: board?.slug ?? null,
      };
    });
}

export type SidebarOp = {
  username?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean | null;
  username_color?: string | null;
  country_code?: string | null;
  created_at?: string | null;
  nsfw_enabled?: boolean | null;
  display_badge?: {
    id: string;
    slug: string;
    name: string;
    image_url?: string | null;
    is_nsfw?: boolean | null;
  } | null;
};
