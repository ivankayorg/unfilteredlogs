import {
  useEffect,
  useState,
} from "react";

import {
  Search,
} from "lucide-react";

import {
  hasGiphyApiKey,
  searchGiphy,
  type GiphyGif,
} from "../../services/giphy";

import "./GiphyPicker.css";


/* ==========================================================
   UNFILTERED LOGS
   GIPHY PICKER
   ========================================================== */


type Props = {
  selected:
    GiphyGif | null;

  onSelect: (
    gif: GiphyGif,
  ) => void;
};


export default function GiphyPicker({
  selected,
  onSelect,
}: Props) {
  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    results,
    setResults,
  ] =
    useState<GiphyGif[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  useEffect(() => {
    const cleaned =
      query.trim();

    if (
      cleaned.length < 2
    ) {
      setResults([]);
      setLoading(false);
      setError(null);

      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        () => {
          setLoading(true);
          setError(null);

          void searchGiphy(
            cleaned,
            controller.signal
          )
            .then(
              (
                nextResults
              ) => {
                setResults(
                  nextResults
                );
              }
            )
            .catch(
              (
                nextError
              ) => {
                if (
                  controller.signal
                    .aborted
                ) {
                  return;
                }

                setResults([]);

                setError(
                  nextError
                    instanceof Error
                    ? nextError.message
                    : "GIF search failed."
                );
              }
            )
            .finally(
              () => {
                if (
                  !controller.signal
                    .aborted
                ) {
                  setLoading(
                    false
                  );
                }
              }
            );
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [query]);


  return (
    <div className="giphy-picker">
      <div className="giphy-search">
        <Search size={15} />

        <input
          value={query}
          onChange={
            (
              event
            ) => {
              setQuery(
                event.target
                  .value
              );
            }
          }
          placeholder="Search GIPHY..."
          autoComplete="off"
        />
      </div>

      {!hasGiphyApiKey() && (
        <div className="giphy-message">
          Add your GIPHY API key to
          <code>
            VITE_GIPHY_API_KEY
          </code>
          and restart Vite.
        </div>
      )}

      {hasGiphyApiKey() &&
        query.trim().length <
          2 && (
        <div className="giphy-message">
          Type at least two characters to search.
        </div>
      )}

      {loading && (
        <div className="giphy-message">
          Looking for poor decisions...
        </div>
      )}

      {error && (
        <div className="giphy-message error">
          {error}
        </div>
      )}

      {results.length >
        0 && (
        <div className="giphy-grid">
          {results.map(
            (
              gif
            ) => (
              <button
                className={
                  selected?.id ===
                  gif.id
                    ? "selected"
                    : ""
                }
                type="button"
                key={gif.id}
                title={gif.title}
                onClick={() => {
                  onSelect(
                    gif
                  );
                }}
              >
                <img
                  src={
                    gif.previewUrl
                  }
                  alt={
                    gif.title
                  }
                  loading="lazy"
                />
              </button>
            )
          )}
        </div>
      )}

      <div className="giphy-attribution">
        Powered by GIPHY
      </div>
    </div>
  );
}
