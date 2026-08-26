import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";


/* ==========================================================
   UNFILTERED LOG
   COMMUNITY SIDEBAR DATA
   ========================================================== */


export type OnlineUser = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};


export type RecentCommentItem = {
  id: string;
  post_id: string;
  body: string | null;
  gif_url: string | null;
  created_at: string;
  username: string | null;
  display_name: string | null;
  post_title: string | null;
};


export async function getRecentComments(
  limit = 6,
): Promise<RecentCommentItem[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("post_comments")
      .select(
        "id, post_id, user_id, body, gif_url, created_at"
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

  const rows =
    (data ?? []) as Array<
      Record<string, any>
    >;

  if (rows.length === 0) {
    return [];
  }

  const userIds =
    Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.user_id as
                string | undefined
          )
          .filter(
            (value): value is string =>
              Boolean(value)
          )
      )
    );

  const postIds =
    Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.post_id as
                string | undefined
          )
          .filter(
            (value): value is string =>
              Boolean(value)
          )
      )
    );

  const [
    profileResult,
    postResult,
  ] =
    await Promise.all([
      userIds.length > 0
        ? supabase
            .from("profiles")
            .select(
              "id, username, display_name"
            )
            .in(
              "id",
              userIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      postIds.length > 0
        ? supabase
            .from("posts")
            .select(
              "id, title"
            )
            .in(
              "id",
              postIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

  if (profileResult.error) {
    console.warn(
      "UNFILTERED LOG RECENT COMMENT PROFILE ERROR:",
      profileResult.error
    );
  }

  if (postResult.error) {
    console.warn(
      "UNFILTERED LOG RECENT COMMENT POST ERROR:",
      postResult.error
    );
  }

  const profileMap =
    new Map<
      string,
      {
        username: string | null;
        display_name: string | null;
      }
    >();

  for (
    const profile
    of profileResult.data ?? []
  ) {
    profileMap.set(
      profile.id,
      {
        username:
          profile.username ??
          null,

        display_name:
          profile.display_name ??
          null,
      }
    );
  }

  const postMap =
    new Map<
      string,
      string | null
    >();

  for (
    const post
    of postResult.data ?? []
  ) {
    postMap.set(
      String(post.id),
      post.title ??
      null
    );
  }

  return rows.map(
    (row) => {
      const profile =
        profileMap.get(
          row.user_id
        );

      return {
        id:
          row.id,

        post_id:
          row.post_id,

        body:
          row.body ??
          null,

        gif_url:
          row.gif_url ??
          null,

        created_at:
          row.created_at,

        username:
          profile?.username ??
          null,

        display_name:
          profile?.display_name ??
          null,

        post_title:
          postMap.get(
            String(row.post_id)
          ) ??
          null,
      };
    }
  );
}


export function subscribeToRecentComments(
  onChange: () => void,
) {
  const channel =
    supabase
      .channel(
        "unfiltered-logs-recent-comments"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
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


export async function subscribeToOnlineUsers(
  session: Session | null,
  onChange: (
    users: OnlineUser[]
  ) => void,
) {
  let self:
    OnlineUser | null =
      null;

  if (session?.user) {
    const {
      data: profile,
      error,
    } =
      await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url"
        )
        .eq(
          "id",
          session.user.id
        )
        .maybeSingle();

    if (error) {
      console.warn(
        "UNFILTERED LOG PRESENCE PROFILE ERROR:",
        error
      );
    }

    self = {
      user_id:
        session.user.id,

      username:
        profile?.username ??
        null,

      display_name:
        profile?.display_name ??
        null,

      avatar_url:
        profile?.avatar_url ??
        null,
    };
  }

  const presenceKey =
    session?.user?.id ??
    `viewer-${crypto.randomUUID()}`;

  const channel =
    supabase.channel(
      "unfiltered-logs-online",
      {
        config: {
          presence: {
            key:
              presenceKey,
          },
        },
      }
    );

  const publishState =
    () => {
      const state =
        channel
          .presenceState<
            OnlineUser
          >();

      const userMap =
        new Map<
          string,
          OnlineUser
        >();

      for (
        const presences
        of Object.values(
          state
        )
      ) {
        for (
          const presence
          of presences
        ) {
          const candidate =
            presence as unknown as
              OnlineUser;

          if (
            !candidate
              .user_id
          ) {
            continue;
          }

          userMap.set(
            candidate.user_id,
            candidate
          );
        }
      }

      onChange(
        Array.from(
          userMap.values()
        )
      );
    };

  channel
    .on(
      "presence",
      {
        event: "sync",
      },
      publishState
    )
    .on(
      "presence",
      {
        event: "join",
      },
      publishState
    )
    .on(
      "presence",
      {
        event: "leave",
      },
      publishState
    )
    .subscribe(
      async (
        status
      ) => {
        if (
          status !==
          "SUBSCRIBED"
        ) {
          return;
        }

        if (self) {
          await channel
            .track(
              self
            );
        }
      }
    );

  return () => {
    if (self) {
      void channel
        .untrack();
    }

    void supabase
      .removeChannel(
        channel
      );
  };
}
