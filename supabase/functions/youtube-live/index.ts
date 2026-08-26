// ==========================================================
// UNFILTEREDLOG
// SUPABASE EDGE FUNCTION: youtube-live
//
// Accepts:
//   channel = UC...
//   channel = @handle
//   channel = https://youtube.com/@handle
//
// Requires:
//   YOUTUBE_API_KEY
// ==========================================================


const corsHeaders = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};


type ChannelSpec = {
  channelId:
    string | null;

  handle:
    string | null;

  channelUrl:
    string | null;
};


type SearchItem = {
  id?: {
    videoId?:
      string;
  };

  snippet?: {
    title?:
      string;

    description?:
      string;

    channelId?:
      string;

    channelTitle?:
      string;

    publishedAt?:
      string;

    liveBroadcastContent?:
      "live" |
      "upcoming" |
      "none";

    thumbnails?: {
      maxres?: {
        url?:
          string;
      };

      standard?: {
        url?:
          string;
      };

      high?: {
        url?:
          string;
      };

      medium?: {
        url?:
          string;
      };

      default?: {
        url?:
          string;
      };
    };
  };
};


function json(
  body:
    unknown,

  status =
    200,
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

        "Cache-Control":
          "public, max-age=30",
      },
    }
  );
}


function bestThumbnail(
  thumbnails:
    SearchItem["snippet"] extends infer _T
      ? {
          maxres?: { url?: string };
          standard?: { url?: string };
          high?: { url?: string };
          medium?: { url?: string };
          default?: { url?: string };
        } | undefined
      : never,
) {
  return (
    thumbnails?.maxres
      ?.url ??
    thumbnails?.standard
      ?.url ??
    thumbnails?.high
      ?.url ??
    thumbnails?.medium
      ?.url ??
    thumbnails?.default
      ?.url ??
    null
  );
}


function parseChannelSpec(
  raw:
    string,
):
ChannelSpec {
  const value =
    raw.trim();

  if (
    /^UC[A-Za-z0-9_-]{20,30}$/
      .test(
        value
      )
  ) {
    return {
      channelId:
        value,

      handle:
        null,

      channelUrl:
        `https://www.youtube.com/channel/${value}`,
    };
  }


  if (
    value.startsWith(
      "@"
    )
  ) {
    return {
      channelId:
        null,

      handle:
        value.slice(
          1
        ),

      channelUrl:
        `https://www.youtube.com/${value}`,
    };
  }


  try {
    const url =
      new URL(
        value
      );

    const host =
      url.hostname
        .replace(
          /^www\./,
          ""
        )
        .toLowerCase();

    if (
      host ===
        "youtube.com" ||
      host ===
        "m.youtube.com"
    ) {
      const parts =
        url.pathname
          .split(
            "/"
          )
          .filter(
            Boolean
          );

      if (
        parts[0] ===
          "channel" &&
        parts[1] &&
        /^UC[A-Za-z0-9_-]{20,30}$/
          .test(
            parts[1]
          )
      ) {
        return {
          channelId:
            parts[1],

          handle:
            null,

          channelUrl:
            `https://www.youtube.com/channel/${parts[1]}`,
        };
      }

      if (
        parts[0]
          ?.startsWith(
            "@"
          )
      ) {
        return {
          channelId:
            null,

          handle:
            parts[0].slice(
              1
            ),

          channelUrl:
            `https://www.youtube.com/${parts[0]}`,
        };
      }
    }
  } catch {
    // Fall through to handle treatment.
  }


  return {
    channelId:
      null,

    handle:
      value.replace(
        /^@/,
        ""
      ),

    channelUrl:
      `https://www.youtube.com/@${value.replace(/^@/, "")}`,
  };
}


async function youtubeJson(
  endpoint:
    URL,
) {
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

    throw new Error(
      `YouTube API ${response.status}: ${detail}`
    );
  }

  return response
    .json();
}


async function resolveChannel(
  spec:
    ChannelSpec,

  apiKey:
    string,
) {
  if (
    spec.channelId
  ) {
    const endpoint =
      new URL(
        "https://www.googleapis.com/youtube/v3/channels"
      );

    endpoint.searchParams.set(
      "part",
      "snippet"
    );

    endpoint.searchParams.set(
      "id",
      spec.channelId
    );

    endpoint.searchParams.set(
      "key",
      apiKey
    );

    const payload =
      await youtubeJson(
        endpoint
      ) as {
        items?: Array<{
          id?:
            string;

          snippet?: {
            title?:
              string;
          };
        }>;
      };

    const channel =
      payload.items?.[0];

    if (
      !channel?.id
    ) {
      throw new Error(
        "YouTube channel was not found."
      );
    }

    return {
      channelId:
        channel.id,

      channelTitle:
        channel.snippet
          ?.title ??
        "YouTube",

      channelUrl:
        spec.channelUrl ??
        `https://www.youtube.com/channel/${channel.id}`,
    };
  }


  if (
    !spec.handle
  ) {
    throw new Error(
      "A YouTube channel ID or @handle is required."
    );
  }


  const endpoint =
    new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );

  endpoint.searchParams.set(
    "part",
    "snippet"
  );

  endpoint.searchParams.set(
    "forHandle",
    spec.handle
  );

  endpoint.searchParams.set(
    "key",
    apiKey
  );

  const payload =
    await youtubeJson(
      endpoint
    ) as {
      items?: Array<{
        id?:
          string;

        snippet?: {
          title?:
            string;
        };
      }>;
    };

  const channel =
    payload.items?.[0];

  if (
    !channel?.id
  ) {
    throw new Error(
      `YouTube channel @${spec.handle} was not found.`
    );
  }

  return {
    channelId:
      channel.id,

    channelTitle:
      channel.snippet
        ?.title ??
      `@${spec.handle}`,

    channelUrl:
      spec.channelUrl ??
      `https://www.youtube.com/@${spec.handle}`,
  };
}


function searchVideoToLatest(
  item:
    SearchItem,
) {
  const videoId =
    item.id?.videoId ??
    "";

  const snippet =
    item.snippet;

  return {
    videoId,

    title:
      snippet?.title ??
      "YouTube video",

    description:
      snippet?.description ??
      null,

    thumbnailUrl:
      bestThumbnail(
        snippet?.thumbnails
      ),

    watchUrl:
      `https://www.youtube.com/watch?v=${videoId}`,

    embedUrl:
      `https://www.youtube.com/embed/${videoId}`,

    publishedAt:
      snippet?.publishedAt ??
      null,
  };
}


async function enrichBroadcast(
  item:
    SearchItem,

  apiKey:
    string,
) {
  const videoId =
    item.id?.videoId;

  if (!videoId) {
    return null;
  }


  const endpoint =
    new URL(
      "https://www.googleapis.com/youtube/v3/videos"
    );

  endpoint.searchParams.set(
    "part",
    "snippet,liveStreamingDetails"
  );

  endpoint.searchParams.set(
    "id",
    videoId
  );

  endpoint.searchParams.set(
    "key",
    apiKey
  );


  const payload =
    await youtubeJson(
      endpoint
    ) as {
      items?: Array<{
        snippet?: {
          title?:
            string;

          description?:
            string;

          thumbnails?: {
            maxres?: { url?: string };
            standard?: { url?: string };
            high?: { url?: string };
            medium?: { url?: string };
            default?: { url?: string };
          };
        };

        liveStreamingDetails?: {
          scheduledStartTime?:
            string;

          actualStartTime?:
            string;

          concurrentViewers?:
            string;
        };
      }>;
    };


  const video =
    payload.items?.[0];

  const snippet =
    video?.snippet ??
    item.snippet;

  const live =
    video?.liveStreamingDetails;


  return {
    videoId,

    title:
      snippet?.title ??
      "YouTube Live",

    description:
      snippet?.description ??
      null,

    thumbnailUrl:
      bestThumbnail(
        snippet?.thumbnails
      ),

    watchUrl:
      `https://www.youtube.com/watch?v=${videoId}`,

    embedUrl:
      `https://www.youtube.com/embed/${videoId}`,

    scheduledStartTime:
      live?.scheduledStartTime ??
      null,

    actualStartTime:
      live?.actualStartTime ??
      null,

    concurrentViewers:
      live?.concurrentViewers
        ? Number(
            live.concurrentViewers
          )
        : null,
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
            "POST required.",
        },
        405
      );
    }


    try {
      const body =
        await request
          .json() as {
            channel?:
              string;
          };


      const channel =
        body.channel
          ?.trim();

      if (!channel) {
        return json(
          {
            error:
              "YouTube channel is required.",
          },
          400
        );
      }


      const apiKey =
        Deno.env.get(
          "YOUTUBE_API_KEY"
        );

      if (!apiKey) {
        return json(
          {
            error:
              "YOUTUBE_API_KEY is not configured in Supabase."
          },
          500
        );
      }


      const spec =
        parseChannelSpec(
          channel
        );

      const resolved =
        await resolveChannel(
          spec,
          apiKey
        );


      /*
       * One search request gives us:
       * - current live broadcast
       * - upcoming scheduled broadcast
       * - latest normal video
       *
       * This avoids doing three expensive search.list calls.
       */
      const searchEndpoint =
        new URL(
          "https://www.googleapis.com/youtube/v3/search"
        );

      searchEndpoint.searchParams.set(
        "part",
        "snippet"
      );

      searchEndpoint.searchParams.set(
        "channelId",
        resolved.channelId
      );

      searchEndpoint.searchParams.set(
        "type",
        "video"
      );

      searchEndpoint.searchParams.set(
        "order",
        "date"
      );

      searchEndpoint.searchParams.set(
        "maxResults",
        "15"
      );

      searchEndpoint.searchParams.set(
        "key",
        apiKey
      );


      const searchPayload =
        await youtubeJson(
          searchEndpoint
        ) as {
          items?:
            SearchItem[];
        };


      const items =
        searchPayload.items ??
        [];


      const liveItem =
        items.find(
          (
            item
          ) =>
            item.snippet
              ?.liveBroadcastContent ===
            "live"
        ) ??
        null;


      const upcomingItem =
        items.find(
          (
            item
          ) =>
            item.snippet
              ?.liveBroadcastContent ===
            "upcoming"
        ) ??
        null;


      const latestItem =
        items.find(
          (
            item
          ) =>
            item.snippet
              ?.liveBroadcastContent ===
            "none"
        ) ??
        null;


      const [
        live,
        upcoming,
      ] =
        await Promise.all([
          liveItem
            ? enrichBroadcast(
                liveItem,
                apiKey
              )
            : Promise.resolve(
                null
              ),

          upcomingItem
            ? enrichBroadcast(
                upcomingItem,
                apiKey
              )
            : Promise.resolve(
                null
              ),
        ]);


      const latest =
        latestItem
          ? searchVideoToLatest(
              latestItem
            )
          : null;


      return json({
        channelId:
          resolved.channelId,

        channelTitle:
          resolved.channelTitle,

        channelUrl:
          resolved.channelUrl,

        checkedAt:
          new Date()
            .toISOString(),

        isLive:
          Boolean(
            live
          ),

        live,

        upcoming,

        latest,
      });
    } catch (
      error
    ) {
      console.error(
        "youtube-live error:",
        error
      );

      return json(
        {
          error:
            error instanceof
              Error
              ? error.message
              : "Could not check YouTube Live.",
        },
        500
      );
    }
  }
);
