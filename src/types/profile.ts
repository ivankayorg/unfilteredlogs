/* ==========================================================
   UNFILTEREDLOG
   USER PROFILE / MICROLOG TYPES
   ========================================================== */


export type UserPublicProfile = {
  id: string;

  username: string;

  display_name: string;

  avatar_url:
    string | null;

  username_changed_at:
    string | null;
};


export type ProfileShoutboxAuthor = {
  id: string;

  username: string;

  display_name: string;

  avatar_url:
    string | null;
};


export type ProfileShoutboxMessage = {
  id: string;

  target_user_id:
    string;

  author_user_id:
    string;

  body: string;

  created_at: string;

  author:
    ProfileShoutboxAuthor | null;
};


export type ProfileForumActivity = {
  id: string;

  kind:
    | "thread"
    | "reply";

  thread_id:
    string;

  thread_title:
    string;

  category_name:
    string | null;

  category_slug:
    string | null;

  body_preview:
    string | null;

  created_at:
    string;
};


export type ProfileMicrologPost = {
  id: string;

  user_id: string;

  body: string;

  created_at: string;

  updated_at: string;
};
