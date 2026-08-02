export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export type Thread = {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
  post_count?: number;
};

export type Post = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
};
