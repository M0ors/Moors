export const THREADS_PER_PAGE = 20;
export const ROOT_POSTS_PER_PAGE = 15;

export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function totalPages(count: number, perPage: number) {
  return Math.max(1, Math.ceil(count / perPage));
}
