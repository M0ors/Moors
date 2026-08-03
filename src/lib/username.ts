const USERNAME_RE = /^[A-Za-z0-9._]{3,24}$/;

export function isValidUsername(username: string) {
  return USERNAME_RE.test(username);
}

export const USERNAME_RULES =
  "3–24 characters. Letters, numbers, dots, and underscores only (no spaces).";
