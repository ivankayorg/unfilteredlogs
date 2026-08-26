import {
  chooseImage,
  cleanUsername,
  getOrigin,
  getQueryString,
  getSupabaseClient,
  renderOpenGraphHtml,
  socialPreviewImage,
  truncate,
  youtubeThumbnail,
  type OpenGraphMeta,
  type PreviewRequest,
  type PreviewResponse,
} from "./_lib/og";


/* ==========================================================
   UNFILTEREDLOG
   SOCIAL / DISCORD LINK PREVIEW HANDLER
   ========================================================== */


type ProfileRow = {
  id:
    string;

  username:
    string;

  display_name:
    string;

  avatar_url:
    string | null;
};


type PostRow = {
  id:
    string;

  user_id:
    string;

  post_type:
    "youtube" |
    "text" |
    "image";

  title:
    string | null;

  body:
    string | null;

  youtube_id:
    string | null;

  image_url:
    string | null;

  gif_url:
    string | null;

  gif_preview_url:
    string | null;

  published:
    boolean;

  moderation_status:
    string | null;
};


type SlopRow = {
  id:
    string;

  body:
    string;

  created_at:
    string;
};


type ForumThreadRow = {
  id:
    string;

  user_id:
    string;

  category_id:
    string;

  title:
    string;

  body:
    string;

  reply_count:
    number | null;
};


type ForumCategoryRow = {
  name:
    string;

  slug:
    string;
};


type BlogRow = {
  id:
    string;

  title:
    string;

  slug:
    string;

  excerpt:
    string | null;

  body:
    string;

  hero_image_url:
    string | null;

  published:
    boolean;
};


function defaultCard(
  origin:
    string,
) {
  return {
    image:
      socialPreviewImage(
        origin
      ),

    imageWidth:
      1200,

    imageHeight:
      630,

    imageAlt:
      "UNFILTEREDLOG by OneTime Labs",
  };
}


function siteMeta(
  origin:
    string,
): OpenGraphMeta {
  return {
    title:
      "UNFILTEREDLOG | The old internet had places",

    description:
      "A multi-user community for posts, videos, GIFs, forums, Thought Slop, profile shoutboxes, and whatever else somebody thought was worth sharing.",

    url:
      `${origin}/`,

    type:
      "website",

    siteName:
      "UNFILTEREDLOG",

    ...defaultCard(
      origin
    ),
  };
}


function forumIndexMeta(
  origin:
    string,
): OpenGraphMeta {
  return {
    title:
      "UNFILTEREDLOG Forum",

    description:
      "Old-school community threads, replies, bad ideas, good arguments, and whatever else survives long enough to become a discussion.",

    url:
      `${origin}/forum`,

    type:
      "website",

    siteName:
      "UNFILTEREDLOG",

    ...defaultCard(
      origin
    ),
  };
}


function blogIndexMeta(
  origin:
    string,
): OpenGraphMeta {
  return {
    title:
      "UNFILTEREDLOG Editorial",

    description:
      "Longer-form writing from UNFILTEREDLOG. Actual paragraphs live here.",

    url:
      `${origin}/blog`,

    type:
      "website",

    siteName:
      "UNFILTEREDLOG",

    ...defaultCard(
      origin
    ),
  };
}


async function getProfile(
  userId:
    string,
):
Promise<
  ProfileRow | null
> {
  const supabase =
    getSupabaseClient();

  const {
    data,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url"
      )
      .eq(
        "id",
        userId
      )
      .maybeSingle<
        ProfileRow
      >();

  return data ??
    null;
}


async function getPostMeta(
  request:
    PreviewRequest,

  id:
    string,
):
Promise<
  OpenGraphMeta
> {
  const origin =
    getOrigin(
      request
    );

  const supabase =
    getSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "posts"
      )
      .select(
        "id, user_id, post_type, title, body, youtube_id, image_url, gif_url, gif_preview_url, published, moderation_status"
      )
      .eq(
        "id",
        id
      )
      .eq(
        "published",
        true
      )
      .maybeSingle<
        PostRow
      >();

  if (
    error ||
    !data ||
    data.moderation_status ===
      "rejected"
  ) {
    return {
      ...siteMeta(
        origin
      ),

      title:
        "UNFILTEREDLOG Post",

      description:
        "A shared post on UNFILTEREDLOG.",

      url:
        `${origin}/posts/${id}`,

      type:
        "article",
    };
  }

  const profile =
    await getProfile(
      data.user_id
    );

  const username =
    profile?.username ||
    "member";

  const displayName =
    profile?.display_name ||
    username;

  const title =
    data.title?.trim() ||
    `@${username} shared something on UNFILTEREDLOG`;

  const description =
    truncate(
      data.body ||
      `${displayName} shared a ${data.post_type} post on UNFILTEREDLOG.`,
      190
    ) ||
    "A shared post on UNFILTEREDLOG.";

  const realMedia =
    chooseImage(
      origin,
      [
        data.image_url,
        data.gif_preview_url,
        data.gif_url,
        youtubeThumbnail(
          data.youtube_id
        ),
      ]
    );

  const usesDefault =
    realMedia ===
      socialPreviewImage(
        origin
      );

  return {
    title,

    description,

    image:
      realMedia,

    url:
      `${origin}/posts/${data.id}`,

    type:
      "article",

    siteName:
      "UNFILTEREDLOG",

    ...(usesDefault
      ? {
          imageWidth:
            1200,

          imageHeight:
            630,

          imageAlt:
            "UNFILTEREDLOG by OneTime Labs",
        }
      : {}),
  };
}


async function getProfileMeta(
  request:
    PreviewRequest,

  username:
    string,
):
Promise<
  OpenGraphMeta
> {
  const origin =
    getOrigin(
      request
    );

  const supabase =
    getSupabaseClient();

  const cleaned =
    cleanUsername(
      username
    );

  const {
    data:
      profile,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url"
      )
      .ilike(
        "username",
        cleaned
      )
      .maybeSingle<
        ProfileRow
      >();

  if (
    error ||
    !profile
  ) {
    return {
      ...siteMeta(
        origin
      ),

      title:
        `@${cleaned || "unknown"} on UNFILTEREDLOG`,

      description:
        "A public member page on UNFILTEREDLOG.",

      url:
        `${origin}/u/${cleaned}`,
    };
  }

  const [
    slopResult,
    shoutResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "profile_posts"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "user_id",
          profile.id
        ),

      supabase
        .from(
          "profile_shoutbox_messages"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "target_user_id",
          profile.id
        ),
    ]);

  const slopCount =
    slopResult.count ??
    0;

  const shoutCount =
    shoutResult.count ??
    0;

  return {
    title:
      `@${profile.username.toUpperCase()} on UNFILTEREDLOG`,

    description:
      `${profile.display_name}'s member page. ${slopCount} Thought Slop ${slopCount === 1 ? "post" : "posts"} and ${shoutCount} profile ${shoutCount === 1 ? "shout" : "shouts"}.`,

    url:
      `${origin}/u/${profile.username}`,

    type:
      "website",

    siteName:
      "UNFILTEREDLOG",

    ...defaultCard(
      origin
    ),
  };
}


async function getSlopMeta(
  request:
    PreviewRequest,

  username:
    string,

  id:
    string,
):
Promise<
  OpenGraphMeta
> {
  const origin =
    getOrigin(
      request
    );

  const supabase =
    getSupabaseClient();

  const cleaned =
    cleanUsername(
      username
    );

  const {
    data:
      profile,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url"
      )
      .ilike(
        "username",
        cleaned
      )
      .maybeSingle<
        ProfileRow
      >();

  if (!profile) {
    return {
      ...siteMeta(
        origin
      ),

      title:
        "Thought Slop on UNFILTEREDLOG",

      description:
        "A Thought Slop permalink on UNFILTEREDLOG.",

      url:
        `${origin}/u/${cleaned}/status/${id}`,

      type:
        "article",
    };
  }

  const {
    data:
      slop,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .select(
        "id, body, created_at"
      )
      .eq(
        "id",
        id
      )
      .eq(
        "user_id",
        profile.id
      )
      .maybeSingle<
        SlopRow
      >();

  return {
    title:
      `@${profile.username.toUpperCase()}'S THOUGHT SLOP`,

    description:
      truncate(
        slop?.body,
        190
      ) ||
      `${profile.display_name}'s Thought Slop on UNFILTEREDLOG.`,

    url:
      `${origin}/u/${profile.username}/status/${slop?.id ?? id}`,

    type:
      "article",

    siteName:
      "UNFILTEREDLOG",

    ...defaultCard(
      origin
    ),
  };
}


async function getForumThreadMeta(
  request:
    PreviewRequest,

  id:
    string,
):
Promise<
  OpenGraphMeta
> {
  const origin =
    getOrigin(
      request
    );

  const supabase =
    getSupabaseClient();

  const {
    data:
      thread,
    error,
  } =
    await supabase
      .from(
        "forum_threads"
      )
      .select(
        "id, user_id, category_id, title, body, reply_count"
      )
      .eq(
        "id",
        id
      )
      .maybeSingle<
        ForumThreadRow
      >();

  if (
    error ||
    !thread
  ) {
    return {
      ...forumIndexMeta(
        origin
      ),

      title:
        "UNFILTEREDLOG Forum Thread",

      description:
        "A discussion thread on the UNFILTEREDLOG forum.",

      url:
        `${origin}/forum/t/${id}`,

      type:
        "article",
    };
  }

  const [
    profile,
    categoryResult,
  ] =
    await Promise.all([
      getProfile(
        thread.user_id
      ),

      supabase
        .from(
          "forum_categories"
        )
        .select(
          "name, slug"
        )
        .eq(
          "id",
          thread.category_id
        )
        .maybeSingle<
          ForumCategoryRow
        >(),
    ]);

  const author =
    profile?.username
      ? `@${profile.username}`
      : profile?.display_name ||
        "A member";

  const category =
    categoryResult.data
      ?.name;

  const lead =
    category
      ? `${author} in ${category}: `
      : `${author}: `;

  const replies =
    Number(
      thread.reply_count ??
      0
    );

  const description =
    truncate(
      `${lead}${thread.body}`,
      175
    );

  return {
    title:
      thread.title,

    description:
      `${description}${description ? " " : ""}${replies} ${replies === 1 ? "reply" : "replies"}.`,

    url:
      `${origin}/forum/t/${thread.id}`,

    type:
      "article",

    siteName:
      "UNFILTEREDLOG",

    ...defaultCard(
      origin
    ),
  };
}


async function getBlogMeta(
  request:
    PreviewRequest,

  slug:
    string,
):
Promise<
  OpenGraphMeta
> {
  const origin =
    getOrigin(
      request
    );

  const supabase =
    getSupabaseClient();

  const {
    data:
      post,
    error,
  } =
    await supabase
      .from(
        "blog_posts"
      )
      .select(
        "id, title, slug, excerpt, body, hero_image_url, published"
      )
      .eq(
        "slug",
        slug
      )
      .eq(
        "published",
        true
      )
      .maybeSingle<
        BlogRow
      >();

  if (
    error ||
    !post
  ) {
    return {
      ...blogIndexMeta(
        origin
      ),

      title:
        "UNFILTEREDLOG Editorial",

      description:
        "Longer-form writing from UNFILTEREDLOG.",

      url:
        `${origin}/blog/${slug}`,

      type:
        "article",
    };
  }

  const image =
    chooseImage(
      origin,
      [
        post.hero_image_url,
      ]
    );

  const usesDefault =
    image ===
      socialPreviewImage(
        origin
      );

  return {
    title:
      post.title,

    description:
      truncate(
        post.excerpt ||
        post.body,
        190
      ) ||
      "An Editorial post on UNFILTEREDLOG.",

    image,

    url:
      `${origin}/blog/${post.slug}`,

    type:
      "article",

    siteName:
      "UNFILTEREDLOG",

    ...(usesDefault
      ? {
          imageWidth:
            1200,

          imageHeight:
            630,

          imageAlt:
            "UNFILTEREDLOG by OneTime Labs",
        }
      : {}),
  };
}


export default async function handler(
  request:
    PreviewRequest,

  response:
    PreviewResponse,
) {
  try {
    const kind =
      getQueryString(
        request,
        "kind"
      ) ||
      "home";

    let meta:
      OpenGraphMeta;

    if (
      kind ===
      "post"
    ) {
      meta =
        await getPostMeta(
          request,
          getQueryString(
            request,
            "id"
          )
        );
    } else if (
      kind ===
      "profile"
    ) {
      meta =
        await getProfileMeta(
          request,
          getQueryString(
            request,
            "username"
          )
        );
    } else if (
      kind ===
      "slop"
    ) {
      meta =
        await getSlopMeta(
          request,
          getQueryString(
            request,
            "username"
          ),
          getQueryString(
            request,
            "id"
          )
        );
    } else if (
      kind ===
      "forum-thread"
    ) {
      meta =
        await getForumThreadMeta(
          request,
          getQueryString(
            request,
            "id"
          )
        );
    } else if (
      kind ===
      "forum"
    ) {
      meta =
        forumIndexMeta(
          getOrigin(
            request
          )
        );
    } else if (
      kind ===
      "blog-post"
    ) {
      meta =
        await getBlogMeta(
          request,
          getQueryString(
            request,
            "slug"
          )
        );
    } else if (
      kind ===
      "blog"
    ) {
      meta =
        blogIndexMeta(
          getOrigin(
            request
          )
        );
    } else {
      meta =
        siteMeta(
          getOrigin(
            request
          )
        );
    }

    response
      .status(
        200
      )
      .setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
      )
      .setHeader(
        "Cache-Control",
        "public, s-maxage=120, stale-while-revalidate=600"
      )
      .send(
        renderOpenGraphHtml(
          meta
        )
      );
  } catch (
    error
  ) {
    response
      .status(
        500
      )
      .setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      )
      .send(
        error instanceof
          Error
          ? error.message
          : "UNFILTEREDLOG preview failed."
      );
  }
}
