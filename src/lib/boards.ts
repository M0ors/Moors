export type Board = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_adult: boolean;
  sort_order: number;
};

export type SubBoard = {
  id: string;
  board_id: string;
  slug: string;
  name: string;
  description: string | null;
  is_adult: boolean;
  sort_order: number;
  max_threads_per_user: number | null;
  op_only_replies: boolean;
  allow_anonymous: boolean;
};

export function boardPath(slug: string) {
  return `/boards/${slug}`;
}

export function subBoardPath(boardSlug: string, subSlug: string) {
  return `/boards/${boardSlug}/${subSlug}`;
}
