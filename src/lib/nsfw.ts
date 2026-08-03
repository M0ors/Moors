import { isAtLeast18 } from "@/lib/age";

export function canAccessAdultContent(options: {
  dateOfBirth?: string | null;
  nsfwEnabled?: boolean | null;
}) {
  return Boolean(options.nsfwEnabled) && isAtLeast18(options.dateOfBirth);
}

export function isNsfwProfile(nsfwEnabled?: boolean | null) {
  return Boolean(nsfwEnabled);
}

/** Blur NSFW avatars for non-NSFW viewers, but never blur admin avatars. */
export function shouldBlurAvatar(options: {
  nsfwEnabled?: boolean | null;
  isAdmin?: boolean | null;
  viewerCanNsfw: boolean;
}) {
  if (options.isAdmin) return false;
  return Boolean(options.nsfwEnabled) && !options.viewerCanNsfw;
}
