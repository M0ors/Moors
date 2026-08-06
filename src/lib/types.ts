export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  is_moderator: boolean;
  is_banned: boolean;
  created_at: string;
};

export type Thread = {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  dislike_count: number;
  profiles?: Profile | null;
  post_count?: number;
};

export type Post = {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  image_url: string | null;
  is_pinned: boolean;
  like_count: number;
  dislike_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
};
