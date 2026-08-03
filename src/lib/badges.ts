export type BadgeRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_nsfw?: boolean | null;
};

export const BADGE_SLUGS = {
  firstThread: "first_thread",
  firstReply: "first_reply",
  firstLikeReceived: "first_like_received",
  joinedAdult: "joined_adult",
  coder: "coder",
  writer: "writer",
  blogger: "blogger",
  staff: "staff",
  lotsOfLove: "lots_of_love",
  bleached: "bleached",
  blacked: "blacked",
} as const;

export function visibleBadges(
  badges: BadgeRow[],
  viewerCanNsfw: boolean
): BadgeRow[] {
  return badges.filter((badge) => !badge.is_nsfw || viewerCanNsfw);
}
