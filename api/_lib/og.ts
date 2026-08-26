import {
  createClient,
} from "@supabase/supabase-js";


/* ==========================================================
   UNFILTEREDLOG
   OPEN GRAPH / SOCIAL PREVIEW HELPERS
   ========================================================== */


export type PreviewRequest = {
  headers:
    Record<
      string,
      string |
      string[] |
      undefined
    >;

  query:
    Record<
      string,
      string |
      string[] |
      undefined
    >;
};


export type PreviewResponse = {
  status:
    (
      code:
        number
    ) =>
      PreviewResponse;

  setHeader:
    (
      name:
        string,

      value:
        string
    ) =>
      PreviewResponse;

  send:
    (
      body:
        string
    ) =>
      void;
};


export type OpenGraphMeta = {
  title: string;

  description: string;

  image: string;

  url: string;

  type?:
    | "website"
    | "article";

  siteName?:
    string;

  imageWidth?:
    number;

  imageHeight?:
    number;

  imageAlt?:
    string;
};


function env(
  key:
    string,
) {
  return process.env[
    key
  ];
}


export function getSupabaseClient() {
  const url =
    env(
      "SUPABASE_URL"
    ) ??
    env(
      "VITE_SUPABASE_URL"
    );

  const key =
    env(
      "SUPABASE_ANON_KEY"
    ) ??
    env(
      "VITE_SUPABASE_PUBLISHABLE_KEY"
    );

  if (
    !url ||
    !key
  ) {
    throw new Error(
      "Supabase preview configuration is missing. Set SUPABASE_URL + SUPABASE_ANON_KEY or use the existing VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY values."
    );
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );
}


function firstHeader(
  value:
    string |
    string[] |
    undefined,
) {
  return Array.isArray(
    value
  )
    ? value[0] ?? ""
    : value ?? "";
}


export function getOrigin(
  request:
    PreviewRequest,
) {
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
    "localhost:5173";

  return `${protocol}://${host}`;
}


export function getQueryString(
  request:
    PreviewRequest,

  key:
    string,
) {
  const value =
    request.query[
      key
    ];

  return Array.isArray(
    value
  )
    ? value[0] ?? ""
    : value ?? "";
}


export function cleanUsername(
  value:
    string,
) {
  return value
    .trim()
    .replace(
      /^@/,
      ""
    );
}


export function truncate(
  value:
    string |
    null |
    undefined,

  max =
    190,
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


export function escapeHtml(
  value:
    string |
    null |
    undefined,
) {
  return String(
    value ??
    ""
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


export function absoluteUrl(
  origin:
    string,

  pathOrUrl:
    string |
    null |
    undefined,
) {
  const value =
    String(
      pathOrUrl ??
      ""
    ).trim();

  if (!value) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      value
    )
  ) {
    return value;
  }

  return `${origin}${value.startsWith(
    "/"
  )
    ? ""
    : "/"}${value}`;
}


export function socialPreviewImage(
  origin:
    string,
) {
  return absoluteUrl(
    origin,
    "/unfilteredlog-social-preview.png"
  );
}


export function chooseImage(
  origin:
    string,

  candidates:
    Array<
      string |
      null |
      undefined
    >,
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

  return socialPreviewImage(
    origin
  );
}


export function youtubeThumbnail(
  youtubeId:
    string |
    null |
    undefined,
) {
  const cleaned =
    String(
      youtubeId ??
      ""
    ).trim();

  if (!cleaned) {
    return "";
  }

  return `https://i.ytimg.com/vi/${cleaned}/maxresdefault.jpg`;
}


export function renderOpenGraphHtml(
  meta:
    OpenGraphMeta,
) {
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
      meta.type ??
      "website"
    );

  const siteName =
    escapeHtml(
      meta.siteName ??
      "UNFILTEREDLOG"
    );

  const imageAlt =
    escapeHtml(
      meta.imageAlt ??
      `${meta.title} preview`
    );

  const imageSize =
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
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:image:alt" content="${imageAlt}" />${imageSize}
<meta property="og:url" content="${url}" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="${siteName}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
<meta name="twitter:image:alt" content="${imageAlt}" />

<meta name="theme-color" content="#3865a5" />
<link rel="canonical" href="${url}" />

<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 34px 18px;
    background: #ccd5e2;
    color: #2c3440;
    font-family: Verdana, Tahoma, Arial, sans-serif;
  }

  .preview {
    width: min(820px, 100%);
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid #9eabbc;
    background: #fbfcfe;
  }

  .preview header {
    padding: 10px 13px;
    border-bottom: 1px solid #9eabbc;
    background: linear-gradient(#e7eef8, #c9d8ec);
    color: #2c466c;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .05em;
  }

  .preview main {
    padding: 20px;
  }

  .preview h1 {
    margin: 0;
    color: #223653;
    font-size: 24px;
    line-height: 1.15;
  }

  .preview p {
    margin: 10px 0 0;
    color: #5f6c7e;
    font-size: 13px;
    line-height: 1.55;
  }

  .preview a {
    color: #2f5f9f;
    font-weight: 800;
  }
</style>
</head>

<body>
  <section class="preview">
    <header>
      UNFILTEREDLOG LINK PREVIEW
    </header>

    <main>
      <h1>${title}</h1>
      <p>${description}</p>

      <p>
        <a href="${url}">
          Open this page on UNFILTEREDLOG »
        </a>
      </p>
    </main>
  </section>
</body>
</html>`;
}
