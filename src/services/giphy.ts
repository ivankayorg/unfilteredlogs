/* ==========================================================
   UNFILTERED LOGS
   GIPHY SEARCH SERVICE
   ========================================================== */


export type GiphyGif = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
};


type GiphyImage = {
  url?: string;
};


type GiphyApiGif = {
  id: string;
  title?: string;

  images?: {
    fixed_width?: GiphyImage;
    fixed_width_small?: GiphyImage;
    downsized?: GiphyImage;
    downsized_medium?: GiphyImage;
    original?: GiphyImage;
    preview_gif?: GiphyImage;
  };
};


type GiphySearchResponse = {
  data?: GiphyApiGif[];
};


const GIPHY_API_KEY =
  (
    import.meta.env
      .VITE_GIPHY_API_KEY ??
    ""
  ).trim();


const GIPHY_RATING =
  (
    import.meta.env
      .VITE_GIPHY_RATING ??
    "pg-13"
  ).trim();


export function hasGiphyApiKey() {
  return Boolean(
    GIPHY_API_KEY
  );
}


function firstUrl(
  ...values:
    Array<
      string | undefined
    >
) {
  return values.find(
    Boolean
  );
}


export async function searchGiphy(
  query: string,
  signal?:
    AbortSignal,
): Promise<GiphyGif[]> {
  const cleaned =
    query.trim();

  if (!cleaned) {
    return [];
  }

  if (!GIPHY_API_KEY) {
    throw new Error(
      "Add VITE_GIPHY_API_KEY to .env.local to enable GIF search."
    );
  }

  const url =
    new URL(
      "https://api.giphy.com/v1/gifs/search"
    );

  url.searchParams.set(
    "api_key",
    GIPHY_API_KEY
  );

  url.searchParams.set(
    "q",
    cleaned
  );

  url.searchParams.set(
    "limit",
    "16"
  );

  url.searchParams.set(
    "offset",
    "0"
  );

  url.searchParams.set(
    "rating",
    GIPHY_RATING
  );

  url.searchParams.set(
    "lang",
    "en"
  );

  const response =
    await fetch(
      url,
      {
        signal,
      }
    );

  if (!response.ok) {
    throw new Error(
      `GIPHY search failed (${response.status}).`
    );
  }

  const payload =
    await response.json() as
      GiphySearchResponse;

  return (
    payload.data ??
    []
  )
    .map(
      (
        item
      ):
        GiphyGif | null => {
        const full =
          firstUrl(
            item.images
              ?.original
              ?.url,

            item.images
              ?.downsized_medium
              ?.url,

            item.images
              ?.downsized
              ?.url,

            item.images
              ?.fixed_width
              ?.url
          );

        const preview =
          firstUrl(
            item.images
              ?.fixed_width_small
              ?.url,

            item.images
              ?.preview_gif
              ?.url,

            item.images
              ?.fixed_width
              ?.url,

            full
          );

        if (
          !item.id ||
          !full ||
          !preview
        ) {
          return null;
        }

        return {
          id:
            item.id,

          title:
            item.title?.trim() ||
            "GIPHY GIF",

          url:
            full,

          previewUrl:
            preview,
        };
      }
    )
    .filter(
      (
        item
      ):
        item is GiphyGif =>
          item !== null
    );
}
