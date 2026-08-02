export type PostNode = {
  id: string;
  body: string;
  author_id: string;
  parent_id: string | null;
  image_url: string | null;
  is_pinned: boolean;
  like_count: number;
  dislike_count: number;
  created_at: string;
  profiles?: {
    username?: string | null;
    avatar_url?: string | null;
    is_admin?: boolean | null;
    username_color?: string | null;
    country_code?: string | null;
  } | null;
  children: PostNode[];
};

type FlatPost = Omit<PostNode, "children">;

function sortPosts(a: PostNode, b: PostNode) {
  if (a.is_pinned !== b.is_pinned) {
    return a.is_pinned ? -1 : 1;
  }
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

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

  Array.from(nodes.values()).forEach((node) => {
    node.children.sort(sortPosts);
  });

  roots.sort(sortPosts);
  return roots;
}
