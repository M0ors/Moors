export type PostNode = {
  id: string;
  body: string;
  author_id: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
  profiles?: {
    username?: string | null;
    avatar_url?: string | null;
    is_admin?: boolean | null;
  } | null;
  children: PostNode[];
};

type FlatPost = Omit<PostNode, "children">;

export function buildPostTree(posts: FlatPost[]): PostNode[] {
  const nodes = new Map<string, PostNode>();

  for (const post of posts) {
    nodes.set(post.id, { ...post, children: [] });
  }

  const roots: PostNode[] = [];

  for (const post of posts) {
    const node = nodes.get(post.id)!;
    if (post.parent_id && nodes.has(post.parent_id)) {
      nodes.get(post.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
