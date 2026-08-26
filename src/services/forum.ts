import {
  supabase,
} from "../lib/supabase";

import type {
  ForumAuthor,
  ForumCategory,
  ForumReply,
  ForumThread,
  ForumThreadDetail,
} from "../types/forum";

import type {
  GiphyGif,
} from "./giphy";


/* ==========================================================
   FORUM 001
   AUTHOR HYDRATION
   ========================================================== */


async function getAuthors(
  userIds: string[],
) {
  const uniqueIds =
    Array.from(
      new Set(
        userIds.filter(
          Boolean
        )
      )
    );

  const authors =
    new Map<
      string,
      ForumAuthor
    >();

  if (
    uniqueIds.length ===
    0
  ) {
    return authors;
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
        "id, username, display_name"
      )
      .in(
        "id",
        uniqueIds
      );

  if (error) {
    throw error;
  }

  for (
    const row
    of data ?? []
  ) {
    authors.set(
      row.id,
      {
        id:
          row.id,

        username:
          row.username ??
          null,

        display_name:
          row.display_name ??
          "UNFILTERED LOGS User",
      }
    );
  }

  return authors;
}


async function hydrateThreads(
  rows:
    Array<
      Record<
        string,
        any
      >
    >,
) {
  const authors =
    await getAuthors(
      rows.map(
        (
          row
        ) =>
          row.user_id
      )
    );

  return rows.map(
    (
      row
    ) => ({
      ...row,

      view_count:
        Number(
          row.view_count ??
          0
        ),

      reply_count:
        Number(
          row.reply_count ??
          0
        ),

      is_pinned:
        Boolean(
          row.is_pinned
        ),

      is_locked:
        Boolean(
          row.is_locked
        ),

      author:
        authors.get(
          row.user_id
        ) ??
        null,
    })
  ) as ForumThread[];
}


/* ==========================================================
   FORUM 002
   CATEGORIES
   ========================================================== */


export async function getForumCategories():
Promise<ForumCategory[]> {
  const [
    categoriesResult,
    threadsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "forum_categories"
        )
        .select(
          "id, name, slug, description, sort_order, active"
        )
        .eq(
          "active",
          true
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "name",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "forum_threads"
        )
        .select(
          "id, category_id, reply_count, last_activity_at"
        ),
    ]);

  if (
    categoriesResult.error
  ) {
    throw categoriesResult.error;
  }

  if (
    threadsResult.error
  ) {
    throw threadsResult.error;
  }

  const stats =
    new Map<
      string,
      {
        threadCount:
          number;

        replyCount:
          number;

        lastActivity:
          string | null;
      }
    >();

  for (
    const thread
    of threadsResult.data ??
    []
  ) {
    const current =
      stats.get(
        thread.category_id
      ) ?? {
        threadCount: 0,
        replyCount: 0,
        lastActivity:
          null,
      };

    current.threadCount +=
      1;

    current.replyCount +=
      Number(
        thread.reply_count ??
        0
      );

    if (
      !current.lastActivity ||
      new Date(
        thread.last_activity_at
      ).getTime() >
        new Date(
          current.lastActivity
        ).getTime()
    ) {
      current.lastActivity =
        thread.last_activity_at;
    }

    stats.set(
      thread.category_id,
      current
    );
  }

  return (
    categoriesResult.data ??
    []
  ).map(
    (
      category
    ) => {
      const categoryStats =
        stats.get(
          category.id
        );

      return {
        id:
          category.id,

        name:
          category.name,

        slug:
          category.slug,

        description:
          category.description ??
          null,

        sort_order:
          category.sort_order,

        active:
          category.active,

        thread_count:
          categoryStats
            ?.threadCount ??
          0,

        reply_count:
          categoryStats
            ?.replyCount ??
          0,

        last_activity_at:
          categoryStats
            ?.lastActivity ??
          null,
      };
    }
  );
}


export async function getForumCategory(
  slug: string,
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
        "id, name, slug, description, sort_order, active"
      )
      .eq(
        "slug",
        slug
      )
      .eq(
        "active",
        true
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,

    thread_count:
      0,

    reply_count:
      0,

    last_activity_at:
      null,
  } as ForumCategory;
}


/* ==========================================================
   FORUM 003
   THREAD LISTS
   ========================================================== */


export async function getLatestForumThreads(
  limit = 10,
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
        "*"
      )
      .order(
        "is_pinned",
        {
          ascending:
            false,
        }
      )
      .order(
        "last_activity_at",
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

  const threads =
    await hydrateThreads(
      (
        data ??
        []
      ) as Array<
        Record<
          string,
          any
        >
      >
    );

  if (
    threads.length ===
    0
  ) {
    return [];
  }

  const categoryIds =
    Array.from(
      new Set(
        threads.map(
          (
            thread
          ) =>
            thread.category_id
        )
      )
    );

  const {
    data:
      categoryRows,
    error:
      categoryError,
  } =
    await supabase
      .from(
        "forum_categories"
      )
      .select(
        "id, name, slug, description"
      )
      .in(
        "id",
        categoryIds
      );

  if (categoryError) {
    throw categoryError;
  }

  const categories =
    new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        description: string | null;
      }
    >(
      (
        categoryRows ??
        []
      ).map(
        (
          category
        ) => [
          category.id,
          {
            id:
              category.id,

            name:
              category.name,

            slug:
              category.slug,

            description:
              category.description ??
              null,
          },
        ]
      )
    );

  return threads.map(
    (
      thread
    ) => ({
      ...thread,

      category:
        categories.get(
          thread.category_id
        ) ??
        null,
    })
  );
}


export async function getCategoryForumThreads(
  categoryId: string,
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
        "*"
      )
      .eq(
        "category_id",
        categoryId
      )
      .order(
        "is_pinned",
        {
          ascending:
            false,
        }
      )
      .order(
        "last_activity_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    throw error;
  }

  return hydrateThreads(
    (
      data ??
      []
    ) as Array<
      Record<
        string,
        any
      >
    >
  );
}


/* ==========================================================
   FORUM 004
   THREAD DETAIL
   ========================================================== */


export async function getForumThread(
  threadId: string,
): Promise<
  ForumThreadDetail | null
> {
  const {
    data:
      threadRow,
    error:
      threadError,
  } =
    await supabase
      .from(
        "forum_threads"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        threadId
      )
      .maybeSingle();

  if (threadError) {
    throw threadError;
  }

  if (!threadRow) {
    return null;
  }

  const {
    data:
      categoryRow,
    error:
      categoryError,
  } =
    await supabase
      .from(
        "forum_categories"
      )
      .select(
        "id, name, slug, description"
      )
      .eq(
        "id",
        threadRow.category_id
      )
      .maybeSingle();

  if (categoryError) {
    throw categoryError;
  }

  const {
    data:
      replyRows,
    error:
      replyError,
  } =
    await supabase
      .from(
        "forum_replies"
      )
      .select(
        "*"
      )
      .eq(
        "thread_id",
        threadId
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (replyError) {
    throw replyError;
  }

  const authors =
    await getAuthors([
      threadRow.user_id,
      ...(
        replyRows ??
        []
      ).map(
        (
          reply
        ) =>
          reply.user_id
      ),
    ]);

  const thread = {
    ...threadRow,

    view_count:
      Number(
        threadRow.view_count ??
        0
      ),

    reply_count:
      Number(
        threadRow.reply_count ??
        0
      ),

    is_pinned:
      Boolean(
        threadRow.is_pinned
      ),

    is_locked:
      Boolean(
        threadRow.is_locked
      ),

    author:
      authors.get(
        threadRow.user_id
      ) ??
      null,

    category:
      categoryRow
        ? {
            ...categoryRow,
          }
        : null,
  } as ForumThread;

  const replies =
    (
      replyRows ??
      []
    ).map(
      (
        reply
      ) => ({
        ...reply,

        author:
          authors.get(
            reply.user_id
          ) ??
          null,
      })
    ) as ForumReply[];

  return {
    thread,
    replies,
  };
}


/* ==========================================================
   FORUM 005
   WRITES
   ========================================================== */


export async function createForumThread(
  categoryId: string,
  title: string,
  body: string,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "create_forum_thread",
      {
        target_category:
          categoryId,

        thread_title:
          title.trim(),

        thread_body:
          body.trim(),
      }
    );

  if (error) {
    throw error;
  }

  return data as string;
}


export async function createForumReply(
  threadId: string,
  body: string,
  gif?: GiphyGif | null,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "create_forum_reply",
      {
        target_thread:
          threadId,

        reply_body:
          body.trim() ||
          null,

        reply_gif_id:
          gif?.id ??
          null,

        reply_gif_url:
          gif?.url ??
          null,

        reply_gif_preview_url:
          gif?.previewUrl ??
          null,
      }
    );

  if (error) {
    throw error;
  }

  return data as string;
}


export async function incrementForumThreadView(
  threadId: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "increment_forum_thread_view",
      {
        target_thread:
          threadId,
      }
    );

  if (error) {
    console.warn(
      "UNFILTERED LOGS FORUM VIEW COUNT ERROR:",
      error
    );
  }
}


export async function deleteForumThread(
  threadId: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "delete_forum_thread",
      {
        target_thread:
          threadId,
      }
    );

  if (error) {
    throw error;
  }
}


export async function deleteForumReply(
  replyId: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "delete_forum_reply",
      {
        target_reply:
          replyId,
      }
    );

  if (error) {
    throw error;
  }
}


export async function setForumThreadControls(
  threadId: string,
  pinned: boolean,
  locked: boolean,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "set_forum_thread_controls",
      {
        target_thread:
          threadId,

        pinned,

        locked,
      }
    );

  if (error) {
    throw error;
  }
}
