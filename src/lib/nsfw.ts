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
