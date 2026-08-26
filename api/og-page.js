/* ==========================================================
   UNFILTEREDLOG
   SOCIAL PREVIEW SERVERLESS HANDLER
   PRODUCTION FIX 45B

   ZERO EXTERNAL RUNTIME DEPENDENCIES
   - no @supabase/supabase-js import
   - no nested helper import
   - plain Vercel Node function
   - Supabase REST calls use global fetch()
   ========================================================== */


const SITE_NAME =
  "UNFILTEREDLOG";

const HOME_TITLE =
  "UNFILTEREDLOG | The old internet had places";

const HOME_DESCRIPTION =
  "Old internet sites felt like places. UNFILTEREDLOG is a multi-user community for posts, videos, GIFs, forums, Thought Slop, profile shoutboxes, and whatever else somebody thought was worth sharing.";


function firstHeader(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}


function firstQuery(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}


function getOrigin(request) {
  const protocol =
    firstHeader(
      request.headers[
        "x-forwarded-proto"
      ]
    ) ||
    "https";

  const host =
    firstHeader(
      request.headers[
        "x-forwarded-host"
      ]
    ) ||
    firstHeader(
      request.headers.host
    ) ||
    "www.unfilteredlog.com";

  return `${protocol}://${host}`;
}


function absoluteUrl(
  origin,
  value
) {
  const cleaned =
    String(
      value || ""
    ).trim();

  if (!cleaned) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      cleaned
    )
  ) {
    return cleaned;
  }

  return `${origin}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
}


function socialImage(origin) {
  return absoluteUrl(
    origin,
    "/unfilteredlog-social-preview.png"
  );
}


function escapeHtml(value) {
  return String(
    value || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#39;"
    );
}


function truncate(
  value,
  max = 190
) {
  const cleaned =
    String(
      value || ""
    )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    cleaned.length <=
    max
  ) {
    return cleaned;
  }

  return `${cleaned.slice(
    0,
    Math.max(
      0,
      max - 1
    )
  )}…`;
}


function youtubeThumbnail(
  youtubeId
) {
  const cleaned =
    String(
      youtubeId || ""
    ).trim();

  if (!cleaned) {
    return "";
  }

  return `https://i.ytimg.com/vi/${cleaned}/hqdefault.jpg`;
}


function chooseImage(
  origin,
  candidates
) {
  for (
    const candidate of
    candidates
  ) {
    const resolved =
      absoluteUrl(
        origin,
        candidate
      );

    if (resolved) {
      return resolved;
    }
  }

  return socialImage(
    origin
  );
}


function defaultCard(
  origin
) {
  return {
    image:
      socialImage(
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


function homeMeta(
  origin
) {
  return {
    title:
      HOME_TITLE,

    description:
      HOME_DESCRIPTION,

    image:
      socialImage(
        origin
      ),

    imageWidth:
      1200,

    imageHeight:
      630,

    imageAlt:
      "UNFILTEREDLOG by OneTime Labs",

    url:
      `${origin}/`,

    type:
      "website",
  };
}


function forumMeta(
  origin
) {
  return {
    title:
      "UNFILTEREDLOG Forum",

    description:
      "Old-school community threads, replies, bad ideas, good arguments, and whatever else survives long enough to become a discussion.",

    url:
      `${origin}/forum`,

    type:
      "website",

    ...defaultCard(
      origin
    ),
  };
}


function blogMeta(
  origin
) {
  return {
    title:
      "UNFILTEREDLOG Editorial",

    description:
      "Longer-form writing from UNFILTEREDLOG. Actual paragraphs live here.",

    url:
      `${origin}/blog`,

    type:
      "website",

    ...defaultCard(
      origin
    ),
  };
}


function liveMeta(
  origin
) {
  return {
    title:
      "UNFILTEREDLOG LIVE | Ivan may be making a mistake",

    description:
      "Watch Ivan live on UNFILTEREDLOG. YouTube video, live chat, and whatever seemed like a good idea five minutes ago.",

    url:
      `${origin}/live`,

    type:
      "website",

    ...defaultCard(
      origin
    ),
  };
}


function renderHtml(meta) {
  const title =
    escapeHtml(
      meta.title
    );

  const description =
    escapeHtml(
      meta.description
    );

  const image =
    escapeHtml(
      meta.image
    );

  const url =
    escapeHtml(
      meta.url
    );

  const type =
    escapeHtml(
      meta.type ||
      "website"
    );

  const imageAlt =
    escapeHtml(
      meta.imageAlt ||
      `${meta.title} preview`
    );

  const dimensions =
    meta.imageWidth &&
    meta.imageHeight
      ? `
<meta property="og:image:width" content="${meta.imageWidth}" />
<meta property="og:image:height" content="${meta.imageHeight}" />`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />

<title>${title}</title>
<meta name="description" content="${description}" />

<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:image:alt" content="${imageAlt}" />${dimensions}

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
<meta name="twitter:image:alt" content="${imageAlt}" />

<meta name="theme-color" content="#3865a5" />
<link rel="canonical" href="${url}" />
</head>

<body style="margin:0;background:#ccd5e2;color:#2c3440;font-family:Verdana,Tahoma,Arial,sans-serif">
  <main style="width:min(820px,calc(100% - 36px));margin:36px auto;border:1px solid #9eabbc;background:#fbfcfe">
    <header style="padding:10px 13px;border-bottom:1px solid #9eabbc;background:#e7eef8;color:#2c466c;font-size:11px;font-weight:900">
      UNFILTEREDLOG LINK PREVIEW
    </header>

    <section style="padding:20px">
      <h1 style="margin:0;color:#223653;font-size:24px">
        ${title}
      </h1>

      <p style="color:#5f6c7e;font-size:13px;line-height:1.55">
        ${description}
      </p>

      <p>
        <a href="${url}" style="color:#2f5f9f;font-weight:800">
          Open this page on UNFILTEREDLOG »
        </a>
      </p>
    </section>
  </main>
</body>
</html>`;
}


/* ==========================================================
   SUPABASE REST
   ========================================================== */


function runtimeConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";

  return {
    url:
      url.replace(
        /\/+$/,
        ""
      ),

    key,
  };
}


async function restSelect(
  table,
  query
) {
  const {
    url,
    key,
  } =
    runtimeConfig();

  if (
    !url ||
    !key
  ) {
    throw new Error(
      "Preview database environment variables are missing."
    );
  }

  const endpoint =
    `${url}/rest/v1/${table}?${query}`;

  const response =
    await fetch(
      endpoint,
      {
        headers: {
          apikey:
            key,

          Authorization:
            `Bearer ${key}`,

          Accept:
            "application/json",
        },
      }
    );

  if (
    !response.ok
  ) {
    const detail =
      await response.text();

    throw new Error(
      `Supabase REST ${table} failed (${response.status}): ${detail}`
    );
  }

  return response.json();
}


async function one(
  table,
  query
) {
  const rows =
    await restSelect(
      table,
      query
    );

  return Array.isArray(
    rows
  )
    ? rows[0] || null
    : null;
}


async function safeOne(
  table,
  query
) {
  try {
    return await one(
      table,
      query
    );
  } catch (
    error
  ) {
    console.error(
      `[OG] ${table}:`,
      error
    );

    return null;
  }
}


async function profileById(
  id
) {
  if (!id) {
    return null;
  }

  return safeOne(
    "profiles",
    new URLSearchParams({
      select:
        "id,username,display_name,avatar_url",

      id:
        `eq.${id}`,

      limit:
        "1",
    }).toString()
  );
}


async function profileByUsername(
  username
) {
  const cleaned =
    String(
      username || ""
    )
      .trim()
      .replace(
        /^@/,
        ""
      );

  if (!cleaned) {
    return null;
  }

  return safeOne(
    "profiles",
    new URLSearchParams({
      select:
        "id,username,display_name,avatar_url",

      username:
        `ilike.${cleaned}`,

      limit:
        "1",
    }).toString()
  );
}


/* ==========================================================
   DYNAMIC META
   ========================================================== */


async function postMeta(
  origin,
  id
) {
  const post =
    await safeOne(
      "posts",
      new URLSearchParams({
        select:
          "id,user_id,post_type,title,body,youtube_id,image_url,gif_url,gif_preview_url,published,moderation_status",

        id:
          `eq.${id}`,

        published:
          "eq.true",

        limit:
          "1",
      }).toString()
    );

  if (
    !post ||
    post.moderation_status ===
      "rejected"
  ) {
    return {
      ...homeMeta(
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
    await profileById(
      post.user_id
    );

  const username =
    profile?.username ||
    "member";

  const displayName =
    profile?.display_name ||
    username;

  const title =
    String(
      post.title ||
      ""
    ).trim() ||
    `@${username} shared something on UNFILTEREDLOG`;

  const description =
    truncate(
      post.body ||
      `${displayName} shared a ${post.post_type || "post"} on UNFILTEREDLOG.`,
      190
    ) ||
    "A shared post on UNFILTEREDLOG.";

  const image =
    chooseImage(
      origin,
      [
        post.image_url,
        post.gif_preview_url,
        post.gif_url,
        youtubeThumbnail(
          post.youtube_id
        ),
      ]
    );

  const defaultImage =
    image ===
      socialImage(
        origin
      );

  return {
    title,

    description,

    image,

    url:
      `${origin}/posts/${post.id}`,

    type:
      "article",

    ...(defaultImage
      ? defaultCard(
          origin
        )
      : {}),
  };
}


async function profileMeta(
  origin,
  username
) {
  const profile =
    await profileByUsername(
      username
    );

  const cleaned =
    String(
      username || ""
    )
      .trim()
      .replace(
        /^@/,
        ""
      );

  if (!profile) {
    return {
      ...homeMeta(
        origin
      ),

      title:
        `@${cleaned || "UNKNOWN"} on UNFILTEREDLOG`,

      description:
        "A public member page on UNFILTEREDLOG.",

      url:
        `${origin}/u/${encodeURIComponent(cleaned)}`,
    };
  }

  return {
    title:
      `@${String(profile.username).toUpperCase()} on UNFILTEREDLOG`,

    description:
      `${profile.display_name || profile.username}'s public member page: Thought Slop, profile shoutbox, forum activity, and whatever else they left lying around.`,

    url:
      `${origin}/u/${encodeURIComponent(profile.username)}`,

    type:
      "website",

    ...defaultCard(
      origin
    ),
  };
}


async function slopMeta(
  origin,
  username,
  id
) {
  const profile =
    await profileByUsername(
      username
    );

  if (!profile) {
    return {
      ...homeMeta(
        origin
      ),

      title:
        "Thought Slop on UNFILTEREDLOG",

      description:
        "A Thought Slop permalink on UNFILTEREDLOG.",

      url:
        `${origin}/u/${encodeURIComponent(username)}/status/${encodeURIComponent(id)}`,

      type:
        "article",
    };
  }

  const slop =
    await safeOne(
      "profile_posts",
      new URLSearchParams({
        select:
          "id,body,created_at",

        id:
          `eq.${id}`,

        user_id:
          `eq.${profile.id}`,

        limit:
          "1",
      }).toString()
    );

  return {
    title:
      `@${String(profile.username).toUpperCase()}'S THOUGHT SLOP`,

    description:
      truncate(
        slop?.body,
        190
      ) ||
      `${profile.display_name || profile.username}'s Thought Slop on UNFILTEREDLOG.`,

    url:
      `${origin}/u/${encodeURIComponent(profile.username)}/status/${encodeURIComponent(slop?.id || id)}`,

    type:
      "article",

    ...defaultCard(
      origin
    ),
  };
}


async function forumThreadMeta(
  origin,
  id
) {
  const thread =
    await safeOne(
      "forum_threads",
      new URLSearchParams({
        select:
          "id,user_id,category_id,title,body,reply_count",

        id:
          `eq.${id}`,

        limit:
          "1",
      }).toString()
    );

  if (!thread) {
    return {
      ...forumMeta(
        origin
      ),

      title:
        "UNFILTEREDLOG Forum Thread",

      description:
        "A discussion thread on the UNFILTEREDLOG forum.",

      url:
        `${origin}/forum/t/${encodeURIComponent(id)}`,

      type:
        "article",
    };
  }

  const profile =
    await profileById(
      thread.user_id
    );

  const category =
    thread.category_id
      ? await safeOne(
          "forum_categories",
          new URLSearchParams({
            select:
              "id,name,slug",

            id:
              `eq.${thread.category_id}`,

            limit:
              "1",
          }).toString()
        )
      : null;

  const author =
    profile?.username
      ? `@${profile.username}`
      : profile?.display_name ||
        "A member";

  const categoryText =
    category?.name
      ? ` in ${category.name}`
      : "";

  return {
    title:
      thread.title ||
      "UNFILTEREDLOG Forum Thread",

    description:
      truncate(
        `${author}${categoryText}: ${thread.body || ""}`,
        190
      ) ||
      "A discussion thread on the UNFILTEREDLOG forum.",

    url:
      `${origin}/forum/t/${encodeURIComponent(thread.id)}`,

    type:
      "article",

    ...defaultCard(
      origin
    ),
  };
}


async function editorialMeta(
  origin,
  slug
) {
  const post =
    await safeOne(
      "blog_posts",
      new URLSearchParams({
        select:
          "id,title,slug,excerpt,body,hero_image_url,published",

        slug:
          `eq.${slug}`,

        published:
          "eq.true",

        limit:
          "1",
      }).toString()
    );

  if (!post) {
    return {
      ...blogMeta(
        origin
      ),

      url:
        `${origin}/blog/${encodeURIComponent(slug)}`,

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

  const defaultImage =
    image ===
      socialImage(
        origin
      );

  return {
    title:
      post.title ||
      "UNFILTEREDLOG Editorial",

    description:
      truncate(
        post.excerpt ||
        post.body,
        190
      ) ||
      "An Editorial post on UNFILTEREDLOG.",

    image,

    url:
      `${origin}/blog/${encodeURIComponent(post.slug)}`,

    type:
      "article",

    ...(defaultImage
      ? defaultCard(
          origin
        )
      : {}),
  };
}


/* ==========================================================
   VERCEL HANDLER
   ========================================================== */


export default async function handler(
  request,
  response
) {
  const origin =
    getOrigin(
      request
    );

  try {
    const kind =
      firstQuery(
        request.query?.kind
      ) ||
      "home";

    let meta;

    /*
      IMPORTANT:
      Home does not touch Supabase at all.
      This makes it the cleanest diagnostic endpoint.
    */
    if (
      kind ===
      "home"
    ) {
      meta =
        homeMeta(
          origin
        );
    } else if (
      kind ===
      "forum"
    ) {
      meta =
        forumMeta(
          origin
        );
    } else if (
      kind ===
      "blog"
    ) {
      meta =
        blogMeta(
          origin
        );
    } else if (
      kind ===
      "live"
    ) {
      meta =
        liveMeta(
          origin
        );
    } else if (
      kind ===
      "post"
    ) {
      meta =
        await postMeta(
          origin,
          firstQuery(
            request.query?.id
          )
        );
    } else if (
      kind ===
      "profile"
    ) {
      meta =
        await profileMeta(
          origin,
          firstQuery(
            request.query?.username
          )
        );
    } else if (
      kind ===
      "slop"
    ) {
      meta =
        await slopMeta(
          origin,
          firstQuery(
            request.query?.username
          ),
          firstQuery(
            request.query?.id
          )
        );
    } else if (
      kind ===
      "forum-thread"
    ) {
      meta =
        await forumThreadMeta(
          origin,
          firstQuery(
            request.query?.id
          )
        );
    } else if (
      kind ===
      "blog-post"
    ) {
      meta =
        await editorialMeta(
          origin,
          firstQuery(
            request.query?.slug
          )
        );
    } else {
      meta =
        homeMeta(
          origin
        );
    }

    response.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    response.setHeader(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=600"
    );

    response.status(
      200
    );

    response.send(
      renderHtml(
        meta
      )
    );
  } catch (
    error
  ) {
    /*
      Never let preview generation turn into a Vercel crash page.
      If dynamic metadata fails, serve a perfectly usable branded
      homepage card and log the actual problem.
    */
    console.error(
      "[UNFILTEREDLOG OG ERROR]",
      error
    );

    response.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    response.setHeader(
      "Cache-Control",
      "no-store"
    );

    response.status(
      200
    );

    response.send(
      renderHtml(
        homeMeta(
          origin
        )
      )
    );
  }
}
