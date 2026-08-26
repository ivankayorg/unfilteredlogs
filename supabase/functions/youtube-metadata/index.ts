// ==========================================================
// UNFILTERED LOGS
// SUPABASE EDGE FUNCTION: youtube-metadata
//
// Title/channel/thumbnail:
//   YouTube oEmbed fallback, no API key required.
//
// Description:
//   YouTube Data API v3 when YOUTUBE_API_KEY is configured.
// ==========================================================


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


type MetadataPayload = {
  title: string;
  description: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
};


function json(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(
      body
    ),
    {
      status,

      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
      },
    }
  );
}


function parseYouTubeId(
  rawValue: string,
) {
  let url: URL;

  try {
    url =
      new URL(
        rawValue
      );
  } catch {
    return null;
  }

  const host =
    url.hostname
      .replace(
        /^www\./,
        ""
      )
      .toLowerCase();

  let id = "";

  if (
    host ===
    "youtu.be"
  ) {
    id =
      url.pathname
        .split("/")
        .filter(Boolean)[0] ??
      "";
  } else if (
    host ===
      "youtube.com" ||
    host ===
      "m.youtube.com" ||
    host ===
      "music.youtube.com"
  ) {
    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);

    if (
      parts[0] ===
        "shorts" ||
      parts[0] ===
        "embed" ||
      parts[0] ===
        "live"
    ) {
      id =
        parts[1] ??
        "";
    } else {
      id =
        url.searchParams
          .get(
            "v"
          ) ??
        "";
    }
  }

  id =
    id.split(
      /[?&#/]/
    )[0];

  return /^[A-Za-z0-9_-]{6,20}$/
    .test(
      id
    )
      ? id
      : null;
}


async function fetchOEmbed(
  canonicalUrl: string,
): Promise<
  Partial<MetadataPayload>
> {
  const endpoint =
    new URL(
      "https://www.youtube.com/oembed"
    );

  endpoint.searchParams.set(
    "url",
    canonicalUrl
  );

  endpoint.searchParams.set(
    "format",
    "json"
  );

  const response =
    await fetch(
      endpoint,
      {
        headers: {
          Accept:
            "application/json",
        },
      }
    );

  if (
    !response.ok
  ) {
    return {};
  }

  const payload =
    await response.json() as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };

  return {
    title:
      payload.title ??
      "",

    authorName:
      payload.author_name ??
      null,

    thumbnailUrl:
      payload.thumbnail_url ??
      null,
  };
}


async function fetchDataApi(
  videoId: string,
  apiKey: string,
): Promise<
  Partial<MetadataPayload>
> {
  const endpoint =
    new URL(
      "https://www.googleapis.com/youtube/v3/videos"
    );

  endpoint.searchParams.set(
    "part",
    "snippet"
  );

  endpoint.searchParams.set(
    "id",
    videoId
  );

  endpoint.searchParams.set(
    "key",
    apiKey
  );

  const response =
    await fetch(
      endpoint,
      {
        headers: {
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

    console.warn(
      "youtube-metadata Data API error:",
      response.status,
      detail
    );

    return {};
  }

  const payload =
    await response.json() as {
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          channelTitle?: string;
          thumbnails?: {
            maxres?: {
              url?: string;
            };
            standard?: {
              url?: string;
            };
            high?: {
              url?: string;
            };
            medium?: {
              url?: string;
            };
            default?: {
              url?: string;
            };
          };
        };
      }>;
    };

  const snippet =
    payload.items?.[0]
      ?.snippet;

  if (
    !snippet
  ) {
    return {};
  }

  return {
    title:
      snippet.title ??
      "",

    description:
      snippet.description ??
      null,

    authorName:
      snippet.channelTitle ??
      null,

    thumbnailUrl:
      snippet.thumbnails
        ?.maxres?.url ??
      snippet.thumbnails
        ?.standard?.url ??
      snippet.thumbnails
        ?.high?.url ??
      snippet.thumbnails
        ?.medium?.url ??
      snippet.thumbnails
        ?.default?.url ??
      null,
  };
}


Deno.serve(
  async (
    request
  ) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return json(
        {
          error:
            "Method not allowed.",
        },
        405
      );
    }

    let body:
      {
        url?: unknown;
      };

    try {
      body =
        await request.json();
    } catch {
      return json(
        {
          error:
            "Invalid JSON body.",
        },
        400
      );
    }

    const rawUrl =
      typeof body.url ===
        "string"
        ? body.url.trim()
        : "";

    const videoId =
      parseYouTubeId(
        rawUrl
      );

    if (
      !videoId
    ) {
      return json(
        {
          error:
            "Invalid YouTube URL.",
        },
        400
      );
    }

    const canonicalUrl =
      `https://www.youtube.com/watch?v=${videoId}`;

    const oembed =
      await fetchOEmbed(
        canonicalUrl
      );

    const apiKey =
      Deno.env.get(
        "YOUTUBE_API_KEY"
      )?.trim();

    let official:
      Partial<MetadataPayload> =
        {};

    if (
      apiKey
    ) {
      official =
        await fetchDataApi(
          videoId,
          apiKey
        );
    }

    const title =
      official.title
        ?.trim() ||
      oembed.title
        ?.trim() ||
      "";

    if (
      !title
    ) {
      return json(
        {
          error:
            "YouTube did not return metadata for this video.",
        },
        404
      );
    }

    return json(
      {
        title,

        description:
          official.description
            ?.trim() ||
          null,

        authorName:
          official.authorName
            ?.trim() ||
          oembed.authorName
            ?.trim() ||
          null,

        thumbnailUrl:
          official.thumbnailUrl
            ?.trim() ||
          oembed.thumbnailUrl
            ?.trim() ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      } satisfies MetadataPayload
    );
  }
);
