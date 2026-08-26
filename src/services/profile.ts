import {
  supabase,
} from "../lib/supabase";

import {
  normalizeUsername,
  validateUsername,
} from "./auth";

import type {
  ProfileForumActivity,
  ProfileMicrologPost,
  ProfileShoutboxAuthor,
  ProfileShoutboxMessage,
  UserPublicProfile,
} from "../types/profile";


/* ==========================================================
   UNFILTEREDLOG
   USER PROFILE / MICROLOG SERVICE
   ========================================================== */


const PROFILE_LOGO_BUCKET =
  "profile-logos";


const MAX_PROFILE_LOGO_BYTES =
  2 * 1024 * 1024;


const ALLOWED_PROFILE_LOGO_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ]);


function mapProfile(
  value:
    Record<
      string,
      unknown
    >,
): UserPublicProfile {
  return {
    id:
      String(
        value.id ??
        ""
      ),

    username:
      String(
        value.username ??
        ""
      ),

    display_name:
      String(
        value.display_name ??
        value.username ??
        ""
      ),

    avatar_url:
      typeof value.avatar_url ===
        "string"
        ? value.avatar_url
        : null,

    username_changed_at:
      typeof value.username_changed_at ===
        "string"
        ? value.username_changed_at
        : null,
  };
}


function mapMicrologPost(
  value:
    Record<
      string,
      unknown
    >,
): ProfileMicrologPost {
  return {
    id:
      String(
        value.id ??
        ""
      ),

    user_id:
      String(
        value.user_id ??
        ""
      ),

    body:
      String(
        value.body ??
        ""
      ),

    created_at:
      String(
        value.created_at ??
        ""
      ),

    updated_at:
      String(
        value.updated_at ??
        value.created_at ??
        ""
      ),
  };
}


export async function getMyProfile():
Promise<UserPublicProfile | null> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url, username_changed_at"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfile(
    data
  );
}


export async function getPublicProfile(
  username:
    string,
):
Promise<UserPublicProfile | null> {
  const cleaned =
    username
      .trim()
      .replace(
        /^@/,
        ""
      );

  if (!cleaned) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url, username_changed_at"
      )
      .ilike(
        "username",
        cleaned
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfile(
    data
  );
}


export async function saveMyProfile(
  username:
    string,

  avatarUrl?:
    string | null,
):
Promise<UserPublicProfile> {
  const normalized =
    normalizeUsername(
      username
    );

  const validation =
    validateUsername(
      normalized
    );

  if (validation) {
    throw new Error(
      validation
    );
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "update_my_public_profile",
      {
        candidate_username:
          normalized,

        candidate_avatar_url:
          avatarUrl ??
          null,
      }
    );

  if (error) {
    throw error;
  }

  const first =
    Array.isArray(
      data
    )
      ? data[0]
      : data;

  if (!first) {
    throw new Error(
      "Profile update did not return a profile."
    );
  }

  return {
    id:
      first.profile_id,

    username:
      first.profile_username,

    display_name:
      first.profile_display_name,

    avatar_url:
      first.profile_avatar_url ??
      null,

    username_changed_at:
      first.profile_username_changed_at ??
      null,
  };
}


export async function uploadMyProfileLogo(
  file:
    File,
):
Promise<string> {
  if (
    !ALLOWED_PROFILE_LOGO_TYPES
      .has(
        file.type
      )
  ) {
    throw new Error(
      "Profile logos must be PNG, JPG, WEBP, or GIF."
    );
  }

  if (
    file.size >
    MAX_PROFILE_LOGO_BYTES
  ) {
    throw new Error(
      "Profile logos must be 2 MB or smaller."
    );
  }

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    throw new Error(
      "Sign in before uploading a profile logo."
    );
  }

  const path =
    `${user.id}/profile-logo`;

  const {
    error,
  } =
    await supabase.storage
      .from(
        PROFILE_LOGO_BUCKET
      )
      .upload(
        path,
        file,
        {
          upsert:
            true,

          contentType:
            file.type,

          cacheControl:
            "3600",
        }
      );

  if (error) {
    throw error;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        PROFILE_LOGO_BUCKET
      )
      .getPublicUrl(
        path
      );

  return `${data.publicUrl}?v=${Date.now()}`;
}


export async function getProfileMicrologPosts(
  userId:
    string,

  limit =
    50,
):
Promise<ProfileMicrologPost[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .select(
        "id, user_id, body, created_at, updated_at"
      )
      .eq(
        "user_id",
        userId
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
  ).map(
    (
      row
    ) =>
      mapMicrologPost(
        row
      )
  );
}


export async function getProfileMicrologPost(
  postId:
    string,
):
Promise<ProfileMicrologPost | null> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .select(
        "id, user_id, body, created_at, updated_at"
      )
      .eq(
        "id",
        postId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapMicrologPost(
    data
  );
}


export async function createProfileMicrologPost(
  body:
    string,
):
Promise<ProfileMicrologPost> {
  const cleaned =
    body.trim();

  if (!cleaned) {
    throw new Error(
      "Write something first."
    );
  }

  if (
    cleaned.length >
    280
  ) {
    throw new Error(
      "Microlog posts are limited to 280 characters."
    );
  }

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    throw new Error(
      "Sign in before posting."
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .insert({
        user_id:
          user.id,

        body:
          cleaned,
      })
      .select(
        "id, user_id, body, created_at, updated_at"
      )
      .single();

  if (error) {
    throw error;
  }

  return mapMicrologPost(
    data
  );
}


export async function deleteProfileMicrologPost(
  postId:
    string,
) {
  const {
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .delete()
      .eq(
        "id",
        postId
      );

  if (error) {
    throw error;
  }
}


/* ==========================================================
   PROFILE SHOUTBOX
   ========================================================== */


const PROFILE_SHOUTBOX_LIMIT =
  280;


function mapShoutboxAuthor(
  value:
    Record<
      string,
      unknown
    >,
):
ProfileShoutboxAuthor {
  return {
    id:
      String(
        value.id ??
        ""
      ),

    username:
      String(
        value.username ??
        ""
      ),

    display_name:
      String(
        value.display_name ??
        value.username ??
        ""
      ),

    avatar_url:
      typeof value.avatar_url ===
        "string"
        ? value.avatar_url
        : null,
  };
}


async function hydrateShoutboxMessages(
  rows:
    Array<
      Record<
        string,
        unknown
      >
    >,
):
Promise<
  ProfileShoutboxMessage[]
> {
  if (
    rows.length ===
    0
  ) {
    return [];
  }

  const authorIds =
    Array.from(
      new Set(
        rows
          .map(
            (
              row
            ) =>
              String(
                row.author_user_id ??
                ""
              )
          )
          .filter(
            Boolean
          )
      )
    );

  const authors =
    new Map<
      string,
      ProfileShoutboxAuthor
    >();

  if (
    authorIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "id, username, display_name, avatar_url"
        )
        .in(
          "id",
          authorIds
        );

    if (error) {
      throw error;
    }

    for (
      const value of
      data ?? []
    ) {
      const author =
        mapShoutboxAuthor(
          value
        );

      authors.set(
        author.id,
        author
      );
    }
  }

  return rows.map(
    (
      row
    ) => {
      const authorUserId =
        String(
          row.author_user_id ??
          ""
        );

      return {
        id:
          String(
            row.id ??
            ""
          ),

        target_user_id:
          String(
            row.target_user_id ??
            ""
          ),

        author_user_id:
          authorUserId,

        body:
          String(
            row.body ??
            ""
          ),

        created_at:
          String(
            row.created_at ??
            ""
          ),

        author:
          authors.get(
            authorUserId
          ) ??
          null,
      };
    }
  );
}


export async function getProfileShoutboxMessages(
  targetUserId:
    string,

  limit =
    40,
):
Promise<
  ProfileShoutboxMessage[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_shoutbox_messages"
      )
      .select(
        "id, target_user_id, author_user_id, body, created_at"
      )
      .eq(
        "target_user_id",
        targetUserId
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

  return hydrateShoutboxMessages(
    (
      data ??
      []
    ) as Array<
      Record<
        string,
        unknown
      >
    >
  );
}


export async function createProfileShoutboxMessage(
  targetUserId:
    string,

  body:
    string,
):
Promise<
  ProfileShoutboxMessage
> {
  const cleaned =
    body.trim();

  if (!cleaned) {
    throw new Error(
      "Write something before shouting."
    );
  }

  if (
    cleaned.length >
    PROFILE_SHOUTBOX_LIMIT
  ) {
    throw new Error(
      "Profile shoutbox messages are limited to 280 characters."
    );
  }

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    throw new Error(
      "Sign in before posting to a profile shoutbox."
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_shoutbox_messages"
      )
      .insert({
        target_user_id:
          targetUserId,

        author_user_id:
          user.id,

        body:
          cleaned,
      })
      .select(
        "id, target_user_id, author_user_id, body, created_at"
      )
      .single();

  if (error) {
    throw error;
  }

  const hydrated =
    await hydrateShoutboxMessages(
      [
        data as
          Record<
            string,
            unknown
          >,
      ]
    );

  const first =
    hydrated[0];

  if (!first) {
    throw new Error(
      "Shoutbox message was created but could not be loaded."
    );
  }

  return first;
}


export async function deleteProfileShoutboxMessage(
  messageId:
    string,
) {
  const {
    error,
  } =
    await supabase
      .from(
        "profile_shoutbox_messages"
      )
      .delete()
      .eq(
        "id",
        messageId
      );

  if (error) {
    throw error;
  }
}


/* ==========================================================
   PROFILE FORUM ACTIVITY
   ========================================================== */


function forumPreview(
  value:
    unknown,
) {
  const cleaned =
    String(
      value ??
      ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.length >
    180
    ? `${cleaned.slice(
        0,
        179
      )}…`
    : cleaned;
}


export async function getProfileForumActivity(
  userId:
    string,

  limit =
    20,
):
Promise<
  ProfileForumActivity[]
> {
  const [
    threadsResult,
    repliesResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "forum_threads"
        )
        .select(
          "id, category_id, title, body, created_at"
        )
        .eq(
          "user_id",
          userId
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
        ),

      supabase
        .from(
          "forum_replies"
        )
        .select(
          "id, thread_id, body, created_at"
        )
        .eq(
          "user_id",
          userId
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
        ),
    ]);

  if (
    threadsResult.error
  ) {
    throw threadsResult.error;
  }

  if (
    repliesResult.error
  ) {
    throw repliesResult.error;
  }

  const ownThreads =
    threadsResult.data ??
    [];

  const replies =
    repliesResult.data ??
    [];

  const threadIds =
    Array.from(
      new Set(
        [
          ...ownThreads.map(
            (
              row
            ) =>
              row.id
          ),
          ...replies.map(
            (
              row
            ) =>
              row.thread_id
          ),
        ]
      )
    );

  const threadMap =
    new Map<
      string,
      {
        id:
          string;

        category_id:
          string;

        title:
          string;
      }
    >();

  for (
    const thread of
    ownThreads
  ) {
    threadMap.set(
      thread.id,
      {
        id:
          thread.id,

        category_id:
          thread.category_id,

        title:
          thread.title,
      }
    );
  }

  const missingThreadIds =
    threadIds.filter(
      (
        threadId
      ) =>
        !threadMap.has(
          threadId
        )
    );

  if (
    missingThreadIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "forum_threads"
        )
        .select(
          "id, category_id, title"
        )
        .in(
          "id",
          missingThreadIds
        );

    if (error) {
      throw error;
    }

    for (
      const thread of
      data ?? []
    ) {
      threadMap.set(
        thread.id,
        {
          id:
            thread.id,

          category_id:
            thread.category_id,

          title:
            thread.title,
        }
      );
    }
  }

  const categoryIds =
    Array.from(
      new Set(
        Array.from(
          threadMap.values()
        ).map(
          (
            thread
          ) =>
            thread.category_id
        )
      )
    );

  const categoryMap =
    new Map<
      string,
      {
        name:
          string;

        slug:
          string;
      }
    >();

  if (
    categoryIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "forum_categories"
        )
        .select(
          "id, name, slug"
        )
        .in(
          "id",
          categoryIds
        );

    if (error) {
      throw error;
    }

    for (
      const category of
      data ?? []
    ) {
      categoryMap.set(
        category.id,
        {
          name:
            category.name,

          slug:
            category.slug,
        }
      );
    }
  }

  const activity:
    ProfileForumActivity[] =
      [];

  for (
    const thread of
    ownThreads
  ) {
    const category =
      categoryMap.get(
        thread.category_id
      );

    activity.push({
      id:
        thread.id,

      kind:
        "thread",

      thread_id:
        thread.id,

      thread_title:
        thread.title,

      category_name:
        category?.name ??
        null,

      category_slug:
        category?.slug ??
        null,

      body_preview:
        forumPreview(
          thread.body
        ),

      created_at:
        thread.created_at,
    });
  }

  for (
    const reply of
    replies
  ) {
    const thread =
      threadMap.get(
        reply.thread_id
      );

    if (!thread) {
      continue;
    }

    const category =
      categoryMap.get(
        thread.category_id
      );

    activity.push({
      id:
        reply.id,

      kind:
        "reply",

      thread_id:
        reply.thread_id,

      thread_title:
        thread.title,

      category_name:
        category?.name ??
        null,

      category_slug:
        category?.slug ??
        null,

      body_preview:
        forumPreview(
          reply.body
        ),

      created_at:
        reply.created_at,
    });
  }

  return activity
    .sort(
      (
        a,
        b
      ) =>
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
    )
    .slice(
      0,
      limit
    );
}
