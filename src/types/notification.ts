/* ==========================================================
   UNFILTEREDLOG
   NOTIFICATION TYPES
   ========================================================== */


export type NotificationType =
  | "profile_shout"
  | "post_comment"
  | "forum_reply";


export type NotificationRecord = {
  id: string;

  recipient_user_id:
    string;

  actor_user_id:
    string | null;

  notification_type:
    NotificationType;

  title: string;

  body:
    string | null;

  url: string;

  read_at:
    string | null;

  created_at: string;
};
