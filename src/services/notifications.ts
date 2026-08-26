import {
  supabase,
} from "../lib/supabase";

import type {
  NotificationRecord,
} from "../types/notification";


/* ==========================================================
   UNFILTEREDLOG
   NOTIFICATIONS SERVICE
   ========================================================== */


export async function getMyNotifications(
  limit =
    30,
):
Promise<
  NotificationRecord[]
> {
  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth
      .getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "notifications"
      )
      .select(
        "id, recipient_user_id, actor_user_id, notification_type, title, body, url, read_at, created_at"
      )
      .eq(
        "recipient_user_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(
        limit
      );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as
    NotificationRecord[];
}


export async function markNotificationRead(
  notificationId:
    string,
) {
  const {
    error,
  } =
    await supabase
      .from(
        "notifications"
      )
      .update({
        read_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        notificationId
      );

  if (error) {
    throw error;
  }
}


export async function markAllNotificationsRead() {
  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth
      .getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return;
  }

  const {
    error,
  } =
    await supabase
      .from(
        "notifications"
      )
      .update({
        read_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "recipient_user_id",
        user.id
      )
      .is(
        "read_at",
        null
      );

  if (error) {
    throw error;
  }
}


export function subscribeToMyNotifications(
  userId:
    string,

  onChange:
    () => void,
) {
  const channel =
    supabase
      .channel(
        `unfilteredlog-notifications-${userId}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            "notifications",

          filter:
            `recipient_user_id=eq.${userId}`,
        },
        () => {
          onChange();
        }
      )
      .subscribe();

  return () => {
    void supabase
      .removeChannel(
        channel
      );
  };
}
