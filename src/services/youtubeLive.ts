import {
  supabase,
} from "../lib/supabase";


/* ==========================================================
   UNFILTEREDLOG
   YOUTUBE LIVE STATUS
   ========================================================== */


export type YouTubeBroadcast = {
  videoId: string;

  title: string;

  description:
    string | null;

  thumbnailUrl:
    string | null;

  watchUrl: string;

  embedUrl: string;

  scheduledStartTime:
    string | null;

  actualStartTime:
    string | null;

  concurrentViewers:
    number | null;
};


export type YouTubeLatestVideo = {
  videoId: string;

  title: string;

  description:
    string | null;

  thumbnailUrl:
    string | null;

  watchUrl: string;

  embedUrl: string;

  publishedAt:
    string | null;
};


export type YouTubeLiveStatus = {
  channelId: string;

  channelTitle: string;

  channelUrl: string;

  checkedAt: string;

  isLive: boolean;

  live:
    YouTubeBroadcast | null;

  upcoming:
    YouTubeBroadcast | null;

  latest:
    YouTubeLatestVideo | null;
};


type FunctionPayload =
  Partial<
    YouTubeLiveStatus
  > & {
    error?:
      string;
  };


export function getConfiguredYouTubeChannel() {
  return (
    import.meta.env
      .VITE_YOUTUBE_CHANNEL ??
    import.meta.env
      .VITE_YOUTUBE_CHANNEL_ID ??
    import.meta.env
      .VITE_YOUTUBE_CHANNEL_HANDLE ??
    ""
  ).trim();
}


export async function getYouTubeLiveStatus():
Promise<
  YouTubeLiveStatus
> {
  const channel =
    getConfiguredYouTubeChannel();

  if (!channel) {
    throw new Error(
      "YouTube Live is not configured yet. Set VITE_YOUTUBE_CHANNEL to your YouTube channel ID, @handle, or channel URL."
    );
  }


  const {
    data,
    error,
  } =
    await supabase.functions
      .invoke(
        "youtube-live",
        {
          body: {
            channel,
          },
        }
      );


  if (error) {
    throw error;
  }


  const payload =
    data as
      FunctionPayload |
      null;


  if (
    payload?.error
  ) {
    throw new Error(
      payload.error
    );
  }


  if (
    !payload?.channelId ||
    !payload.channelTitle ||
    !payload.channelUrl ||
    !payload.checkedAt ||
    typeof payload.isLive !==
      "boolean"
  ) {
    throw new Error(
      "YouTube Live returned an incomplete response."
    );
  }


  return {
    channelId:
      payload.channelId,

    channelTitle:
      payload.channelTitle,

    channelUrl:
      payload.channelUrl,

    checkedAt:
      payload.checkedAt,

    isLive:
      payload.isLive,

    live:
      payload.live ??
      null,

    upcoming:
      payload.upcoming ??
      null,

    latest:
      payload.latest ??
      null,
  };
}
