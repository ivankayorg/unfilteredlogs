import { supabase } from "../lib/supabase";

import type {
  GiphyGif,
} from "./giphy";

import type {
  CommentProfile,
  CommentRecord,
} from "../types/comment";


/* ==========================================================
   UNFILTERED LOG
   COMMENTS SERVICE
   ========================================================== */


async function getCurrentUser() {
  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth
      .getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "Sign in to comment."
    );
  }

  return user;
}


async function attachCommentProfiles(
  rows:
    Array<
      Record<string, any>
    >,
): Promise<CommentRecord[]> {
  if (
    rows.length === 0
  ) {
    return [];
  }

  const userIds =
    Array.from(
      new Set(
        rows
          .map(
            (
              row
            ) =>
              row.user_id as
                string | undefined
          )
          .filter(
            (
              value
            ):
              value is string =>
                Boolean(value)
          )
      )
    );

  const profileMap =
    new Map<
      string,
      CommentProfile
    >();

  if (
    userIds.length > 0
  ) {
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
        "UNFILTERED LOG COMMENT PROFILE ERROR:",
        error
      );
    } else {
      for (
        const profile
        of data ?? []
      ) {
        profileMap.set(
          profile.id,
          {
            username:
              profile.username ??
              null,

            display_name:
              profile.display_name,

            avatar_url:
              profile.avatar_url ??
              null,
          }
        );
      }
    }
  }

  return rows.map(
    (
      row
    ) => ({
      id:
        row.id,

      post_id:
        row.post_id,

      user_id:
        row.user_id,

      body:
        row.body ??
        null,

      gif_id:
        row.gif_id ??
        null,

      gif_url:
        row.gif_url ??
        null,

      gif_preview_url:
        row.gif_preview_url ??
        null,

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


export async function getPostComments(
  postId: string,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "post_comments"
      )
      .select(
        "id, post_id, user_id, body, gif_id, gif_url, gif_preview_url, created_at"
      )
      .eq(
        "post_id",
        postId
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw error;
  }

  return attachCommentProfiles(
    (
      data ??
      []
    ) as
      Array<
        Record<string, any>
      >
  );
}


export async function createPostComment(
  postId: string,
  body: string,
  gif?: GiphyGif | null,
) {
  const user =
    await getCurrentUser();

  const cleaned =
    body.trim();

  if (
    !cleaned &&
    !gif
  ) {
    throw new Error(
      "Write something or add a GIF."
    );
  }

  if (
    cleaned.length > 500
  ) {
    throw new Error(
      "Comments are limited to 500 characters."
    );
  }

  const payload:
    Record<string, unknown> = {
      post_id:
        postId,

      user_id:
        user.id,

      body:
        cleaned ||
        null,
  };

  if (gif) {
    payload.gif_id =
      gif.id;

    payload.gif_url =
      gif.url;

    payload.gif_preview_url =
      gif.previewUrl;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "post_comments"
      )
      .insert(
        payload
      )
      .select(
        "id, post_id, user_id, body, gif_id, gif_url, gif_preview_url, created_at"
      )
      .single();

  if (error) {
    throw error;
  }

  const attached =
    await attachCommentProfiles([
      data as
        Record<string, any>,
    ]);

  return attached[0];
}


export async function deletePostComment(
  commentId: string,
) {
  const {
    error,
  } =
    await supabase
      .from(
        "post_comments"
      )
      .delete()
      .eq(
        "id",
        commentId
      );

  if (error) {
    throw error;
  }
}


/* ==========================================================
   REPORT / FLAG COMMENT
   ========================================================== */


export async function reportPostComment(
  commentId: string,
) {
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
    throw new Error(
      "Sign in to report a comment."
    );
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "flag_comment",
      {
        target_comment:
          commentId,
      }
    );

  if (error) {
    throw error;
  }

  return Boolean(data);
}
