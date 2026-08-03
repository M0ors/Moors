export type Board = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_adult: boolean;
  sort_order: number;
};

export function boardPath(slug: string) {
  return `/boards/${slug}`;
}
