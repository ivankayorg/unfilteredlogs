import { supabase } from "../lib/supabase";


/* ==========================================================
   UNFILTERED LOG
   SHOUTBOX SERVICE
   ========================================================== */


export type ShoutboxProfile = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};


export type ShoutboxMessage = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile: ShoutboxProfile | null;
};


async function attachProfiles(
  rows: Array<Record<string, any>>,
): Promise<ShoutboxMessage[]> {
  if (rows.length === 0) {
    return [];
  }

  const userIds =
    Array.from(
      new Set(
        rows
          .map((row) => row.user_id as string | undefined)
          .filter((value): value is string => Boolean(value))
      )
    );

  const profileMap =
    new Map<string, ShoutboxProfile>();

  if (userIds.length > 0) {
    const {
      data,
      error,
    } =
      await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url"
        )
        .in(
          "id",
          userIds
        );

    if (error) {
      console.warn(
        "UNFILTERED LOG SHOUTBOX PROFILE ERROR:",
        error
      );
    } else {
      for (const profile of data ?? []) {
        profileMap.set(
          profile.id,
          {
            username:
              profile.username ??
              null,

            display_name:
              profile.display_name ??
              null,

            avatar_url:
              profile.avatar_url ??
              null,
          }
        );
      }
    }
  }

  return rows.map(
    (row) => ({
      id:
        row.id,

      user_id:
        row.user_id,

      body:
        row.body,

      created_at:
        row.created_at,

      profile:
        profileMap.get(
          row.user_id
        ) ??
        null,
    })
  );
}


export async function getShoutboxMessages(
  limit = 30,
): Promise<ShoutboxMessage[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "shoutbox_messages"
      )
      .select(
        "id, user_id, body, created_at"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(limit);

  if (error) {
    throw error;
  }

  return attachProfiles(
    data ?? []
  );
}


export async function postShoutboxMessage(
  body: string,
) {
  const cleaned =
    body.trim();

  if (!cleaned) {
    throw new Error(
      "Shout cannot be empty."
    );
  }

  if (cleaned.length > 280) {
    throw new Error(
      "Shouts are limited to 280 characters."
    );
  }

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth
      .getUser();

  if (
    userError ||
    !user
  ) {
    throw new Error(
      "Sign in to use the shoutbox."
    );
  }

  const {
    error,
  } =
    await supabase
      .from(
        "shoutbox_messages"
      )
      .insert({
        user_id:
          user.id,

        body:
          cleaned,
      });

  if (error) {
    throw error;
  }
}


export function subscribeToShoutbox(
  onChange: () => void,
) {
  const channel =
    supabase
      .channel(
        "unfiltered-logs-shoutbox"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shoutbox_messages",
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
