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


export type ProfileMicrologPost = {
  id: string;

  user_id: string;

  body: string;

  created_at: string;

  updated_at: string;
};
