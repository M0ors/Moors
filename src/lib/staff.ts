import { createClient } from "@/lib/supabase/server";

const ONE_HOUR_MS = 60 * 60 * 1000;
export const STAFF_PRESENCE_USERNAME = "Moors";

export type StaffMember = {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  is_moderator: boolean;
  username_color: string | null;
  last_active_at: string | null;
  isOnline: boolean;
};

export function isActiveWithinHour(lastActiveAt?: string | null) {
  if (!lastActiveAt) return false;
  const ts = new Date(lastActiveAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < ONE_HOUR_MS;
}

function staffSort(a: StaffMember, b: StaffMember) {
  const aMoors = a.username.toLowerCase() === STAFF_PRESENCE_USERNAME.toLowerCase();
  const bMoors = b.username.toLowerCase() === STAFF_PRESENCE_USERNAME.toLowerCase();
  if (aMoors !== bMoors) return aMoors ? -1 : 1;

  if (a.is_admin !== b.is_admin) return a.is_admin ? -1 : 1;

  return a.username.localeCompare(b.username, undefined, { sensitivity: "base" });
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar_url, is_admin, is_moderator, username_color, last_active_at"
    )
    .or("is_admin.eq.true,is_moderator.eq.true");

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => ({
      id: row.id,
      username: row.username,
      avatar_url: row.avatar_url,
      is_admin: Boolean(row.is_admin),
      is_moderator: Boolean(row.is_moderator),
      username_color: row.username_color,
      last_active_at: row.last_active_at,
      isOnline: isActiveWithinHour(row.last_active_at),
    }))
    .sort(staffSort);
}
