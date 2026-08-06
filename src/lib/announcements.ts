import { createClient } from "@/lib/supabase/server";

export type SidebarAnnouncement = {
  id: string;
  title: string;
  href: string;
  created_at: string;
  source: "admin" | "site-update";
  like_count: number;
};

export async function getSidebarAnnouncements(
  limit = 8
): Promise<SidebarAnnouncement[]> {
  const supabase = createClient();

  const [{ data: adminRows }, { data: siteUpdateSub }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, created_at, like_count")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then((result) =>
        result.error ? { data: null as typeof result.data } : result
      ),
    supabase
      .from("sub_boards")
      .select("id")
      .eq("slug", "site-updates")
      .maybeSingle(),
  ]);

  let fromSiteUpdates: SidebarAnnouncement[] = [];
  if (siteUpdateSub?.id) {
    const { data: threads } = await supabase
      .from("threads")
      .select("id, title, created_at, like_count")
      .eq("sub_board_id", siteUpdateSub.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    fromSiteUpdates = (threads ?? []).map((thread) => ({
      id: `thread-${thread.id}`,
      title: thread.title,
      href: `/threads/${thread.id}`,
      created_at: thread.created_at,
      source: "site-update" as const,
      like_count: thread.like_count ?? 0,
    }));
  }

  const fromAdmin: SidebarAnnouncement[] = (adminRows ?? []).map((row) => ({
    id: `admin-${row.id}`,
    title: row.title,
    href: `/announcements/${row.id}`,
    created_at: row.created_at,
    source: "admin" as const,
    like_count: row.like_count ?? 0,
  }));

  return [...fromAdmin, ...fromSiteUpdates]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}
