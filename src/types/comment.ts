/* ==========================================================
   UNFILTERED LOGS
   COMMENT TYPES
   ========================================================== */


export type CommentProfile = {
  username: string | null;
  display_name: string;
  avatar_url: string | null;
};


export type CommentRecord = {
  id: string;
  post_id: string;
  user_id: string;

  body: string | null;

  gif_id: string | null;
  gif_url: string | null;
  gif_preview_url:
    string | null;

  created_at: string;

  profile:
    CommentProfile | null;
};
