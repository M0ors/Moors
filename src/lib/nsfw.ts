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

export function shouldBlurAvatar(options: {
  nsfwEnabled?: boolean | null;
  isAdmin?: boolean | null;
  isModerator?: boolean | null;
  viewerCanNsfw: boolean;
}) {
  if (options.isAdmin || options.isModerator) return false;
  return Boolean(options.nsfwEnabled) && !options.viewerCanNsfw;
}
