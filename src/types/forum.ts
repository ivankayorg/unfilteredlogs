/* ==========================================================
   FORUM 001
   UNFILTERED LOGS FORUM TYPES
   Separate from main-feed posts/comments
   ========================================================== */


export type ForumAuthor = {
  id: string;
  username: string | null;
  display_name: string;
};


export type ForumCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  thread_count: number;
  reply_count: number;
  last_activity_at: string | null;
};


export type ForumThread = {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  body: string;
  view_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  author?: ForumAuthor | null;
  category?: Pick<
    ForumCategory,
    "id" | "name" | "slug" | "description"
  > | null;
};


export type ForumReply = {
  id: string;
  thread_id: string;
  user_id: string;
  body: string | null;
  gif_id: string | null;
  gif_url: string | null;
  gif_preview_url: string | null;
  created_at: string;
  updated_at: string;
  author?: ForumAuthor | null;
};


export type ForumThreadDetail = {
  thread: ForumThread;
  replies: ForumReply[];
};
