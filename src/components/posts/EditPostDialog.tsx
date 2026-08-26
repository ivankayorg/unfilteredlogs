import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronDown,
  Images,
  Save,
  UploadCloud,
  X,
} from "lucide-react";

import {
  fetchYouTubeMetadata,
  parseYouTubeUrl,
} from "../../lib/youtube";

import {
  updatePost,
} from "../../services/posts";

import {
  getActiveTaxonomy,
} from "../../services/taxonomy";

import type {
  GiphyGif,
} from "../../services/giphy";

import type {
  PostDisplaySize,
  PostRecord,
} from "../../types/post";

import type {
  PostCategory,
  PostTag,
} from "../../types/taxonomy";

import GiphyPicker from "./GiphyPicker";

import "./EditPostDialog.css";


/* ==========================================================
   UNFILTERED LOGS
   EDIT POST DIALOG
   ========================================================== */


type Props = {
  open: boolean;

  post:
    PostRecord | null;

  onClose:
    () => void;

  onSaved:
    (
      post:
        PostRecord
    ) => void;
};


function getInitialGif(
  post:
    PostRecord,
):
  GiphyGif | null {
  if (
    !post.gif_id ||
    !post.gif_url
  ) {
    return null;
  }

  return {
    id:
      post.gif_id,

    title:
      "Attached GIF",

    url:
      post.gif_url,

    previewUrl:
      post.gif_preview_url ??
      post.gif_url,
  };
}


export default function EditPostDialog({
  open,
  post,
  onClose,
  onSaved,
}: Props) {
  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    body,
    setBody,
  ] =
    useState("");

  const [
    youtubeUrl,
    setYoutubeUrl,
  ] =
    useState("");

  const [
    replacementImage,
    setReplacementImage,
  ] =
    useState<File | null>(
      null
    );

  const [
    replacementPreview,
    setReplacementPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    categories,
    setCategories,
  ] =
    useState<PostCategory[]>(
      []
    );

  const [
    tags,
    setTags,
  ] =
    useState<PostTag[]>(
      []
    );

  const [
    categoryId,
    setCategoryId,
  ] =
    useState("");

  const [
    tagIds,
    setTagIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    displaySize,
    setDisplaySize,
  ] =
    useState<PostDisplaySize>(
      "large"
    );

  const [
    selectedGif,
    setSelectedGif,
  ] =
    useState<GiphyGif | null>(
      null
    );

  const [
    gifOpen,
    setGifOpen,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  const [
    youtubeTitleLoading,
    setYoutubeTitleLoading,
  ] =
    useState(false);


  const parsedYouTube =
    useMemo(
      () =>
        post?.post_type ===
          "youtube"
          ? parseYouTubeUrl(
              youtubeUrl
            )
          : null,
      [
        post?.post_type,
        youtubeUrl,
      ]
    );


  useEffect(() => {
    if (
      !open ||
      !post
    ) {
      return;
    }

    setTitle(
      post.title ??
      ""
    );

    setBody(
      post.body ??
      ""
    );

    setYoutubeUrl(
      post.youtube_url ??
      ""
    );

    setCategoryId(
      post.category_id ??
      ""
    );

    setTagIds(
      (
        post.tags ??
        []
      ).map(
        (
          tag
        ) =>
          tag.id
      )
    );

    setDisplaySize(
      post.display_size ??
      "large"
    );

    setSelectedGif(
      getInitialGif(
        post
      )
    );

    setReplacementImage(
      null
    );

    setReplacementPreview(
      null
    );

    setGifOpen(
      false
    );

    setSaving(
      false
    );

    setSaved(
      false
    );

    setError(
      null
    );
  }, [
    open,
    post,
  ]);


  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    void getActiveTaxonomy()
      .then(
        (
          taxonomy
        ) => {
          if (!mounted) {
            return;
          }

          setCategories(
            taxonomy.categories
          );

          setTags(
            taxonomy.tags
          );

          setCategoryId(
            (
              current
            ) => {
              const stillActive =
                taxonomy.categories
                  .some(
                    (
                      category
                    ) =>
                      category.id ===
                      current
                  );

              if (
                stillActive
              ) {
                return current;
              }

              return (
                taxonomy.categories
                  .find(
                    (
                      category
                    ) =>
                      category.slug ===
                      "random"
                  )
                  ?.id ??
                taxonomy.categories[0]
                  ?.id ??
                ""
              );
            }
          );

          setTagIds(
            (
              current
            ) =>
              current.filter(
                (
                  selectedId
                ) =>
                  taxonomy.tags.some(
                    (
                      tag
                    ) =>
                      tag.id ===
                      selectedId
                  )
              )
          );
        }
      )
      .catch(
        (
          nextError
        ) => {
          setError(
            nextError
              instanceof Error
              ? nextError.message
              : "Could not load categories and tags."
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    open,
  ]);


  useEffect(() => {
    if (!open) {
      return;
    }

    const keyHandler =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    document.addEventListener(
      "keydown",
      keyHandler
    );

    const oldOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
        "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        keyHandler
      );

      document.body.style
        .overflow =
          oldOverflow;
    };
  }, [
    open,
    onClose,
  ]);


  useEffect(() => {
    return () => {
      if (
        replacementPreview
      ) {
        URL.revokeObjectURL(
          replacementPreview
        );
      }
    };
  }, [
    replacementPreview,
  ]);


  if (
    !open ||
    !post
  ) {
    return null;
  }


  const chooseReplacementImage =
    (
      file:
        File | null
    ) => {
      if (
        replacementPreview
      ) {
        URL.revokeObjectURL(
          replacementPreview
        );
      }

      setReplacementImage(
        file
      );

      setReplacementPreview(
        file
          ? URL.createObjectURL(
              file
            )
          : null
      );
    };


  const toggleTag =
    (
      tagId:
        string
    ) => {
      setTagIds(
        (
          current
        ) => {
          if (
            current.includes(
              tagId
            )
          ) {
            return current.filter(
              (
                id
              ) =>
                id !==
                tagId
            );
          }

          if (
            current.length >=
            5
          ) {
            return current;
          }

          return [
            ...current,
            tagId,
          ];
        }
      );
    };


  const useYouTubeMetadata =
    async () => {
      if (!parsedYouTube) {
        return;
      }

      setYoutubeTitleLoading(
        true
      );

      setError(
        null
      );

      try {
        const metadata =
          await fetchYouTubeMetadata(
            parsedYouTube
              .canonicalUrl
          );

        setTitle(
          metadata.title.slice(
            0,
            180
          )
        );

        setBody(
          (
            metadata.description ??
            ""
          ).slice(
            0,
            1500
          )
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not get YouTube metadata."
        );
      } finally {
        setYoutubeTitleLoading(
          false
        );
      }
    };


  const submit =
    async () => {
      setSaving(
        true
      );

      setError(
        null
      );

      try {
        const updated =
          await updatePost(
            {
              postId:
                post.id,

              postType:
                post.post_type,

              title,

              body,

              youtubeUrl,

              currentImageUrl:
                post.image_url,

              replacementImage,

              categoryId,

              tagIds,

              displaySize,

              gif:
                selectedGif,
            }
          );

        setSaved(
          true
        );

        onSaved(
          updated
        );

        window.setTimeout(
          () => {
            onClose();
          },
          400
        );
      } catch (
        nextError
      ) {
        console.error(
          "UNFILTERED LOGS POST EDIT ERROR:",
          nextError
        );

        if (
          nextError
            instanceof Error
        ) {
          setError(
            nextError.message
          );
        } else if (
          nextError &&
          typeof nextError ===
            "object" &&
          "message" in
            nextError
        ) {
          setError(
            String(
              (
                nextError as {
                  message:
                    unknown;
                }
              ).message
            )
          );
        } else {
          setError(
            "UNFILTERED LOGS could not update the post."
          );
        }
      } finally {
        setSaving(
          false
        );
      }
    };


  const canSave =
    Boolean(
      categoryId
    ) &&
    tagIds.length <=
      5 &&
    body.trim().length <=
      1500 &&
    title.trim().length <=
      180 &&
    (
      post.post_type ===
        "youtube"
        ? Boolean(
            parsedYouTube
          )
        : post.post_type ===
            "text"
          ? Boolean(
              title.trim()
            ) &&
            Boolean(
              body.trim()
            )
          : Boolean(
              replacementImage ||
              post.image_url
            )
    );


  const primaryTags =
    tags.slice(
      0,
      8
    );


  const additionalTags =
    tags
      .slice(
        8
      )
      .filter(
        (
          tag
        ) =>
          !tagIds.includes(
            tag.id
          )
      );


  const addTagFromMore =
    (
      tagId:
        string,
    ) => {
      if (
        !tagId ||
        tagIds.length >=
          5 ||
        tagIds.includes(
          tagId
        )
      ) {
        return;
      }

      setTagIds(
        (
          current
        ) => [
          ...current,
          tagId,
        ]
      );
    };


  const postTypeLabel =
    post.post_type ===
      "youtube"
      ? "YOUTUBE"
      : post.post_type ===
          "image"
        ? "IMAGE / GIF"
        : "TEXT";


  return (
    <div
      className="edit-compose-backdrop"
      role="presentation"
      onMouseDown={
        (
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }
      }
    >
      <section
        className="edit-compose-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-compose-title"
      >
        <header className="edit-compose-titlebar">
          <div className="edit-compose-titleblock">
            <span>
              EDIT POST
            </span>

            <strong id="edit-compose-title">
              Make your corrections.
            </strong>
          </div>

          <div className="edit-compose-type-readout">
            {postTypeLabel}
          </div>

          <button
            className="edit-compose-close"
            type="button"
            onClick={
              onClose
            }
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>

        <div className="edit-compose-scroll">
          <main className="edit-compose-canvas">
            {post.post_type ===
              "text" && (
              <>
                <label className="edit-compose-title-field">
                  <span>
                    TITLE
                    <small>
                      {title.length}/180
                    </small>
                  </span>

                  <input
                    type="text"
                    value={
                      title
                    }
                    maxLength={180}
                    onChange={
                      (
                        event
                      ) => {
                        setTitle(
                          event.target.value
                        );
                      }
                    }
                  />
                </label>

                <label className="edit-compose-body-field">
                  <span>
                    POST
                    <small>
                      {body.length}/1500
                    </small>
                  </span>

                  <textarea
                    value={
                      body
                    }
                    maxLength={1500}
                    onChange={
                      (
                        event
                      ) => {
                        setBody(
                          event.target.value
                        );
                      }
                    }
                  />
                </label>
              </>
            )}

            {post.post_type ===
              "youtube" && (
              <>
                <label className="edit-compose-line-field">
                  <span>
                    YOUTUBE URL
                  </span>

                  <input
                    type="url"
                    value={
                      youtubeUrl
                    }
                    onChange={
                      (
                        event
                      ) => {
                        setYoutubeUrl(
                          event.target.value
                        );
                      }
                    }
                  />
                </label>

                <div className="edit-compose-youtube-row">
                  <div className="edit-compose-video-stage">
                    {parsedYouTube ? (
                      <iframe
                        src={
                          parsedYouTube.embedUrl
                        }
                        title="YouTube preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="edit-compose-empty-stage">
                        <span>
                          Invalid YouTube URL
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="edit-compose-video-copy">
                    <label className="edit-compose-line-field">
                      <span>
                        TITLE
                        <small>
                          {title.length}/180
                        </small>
                      </span>

                      <input
                        type="text"
                        value={
                          title
                        }
                        maxLength={180}
                        onChange={
                          (
                            event
                          ) => {
                            setTitle(
                              event.target.value
                            );
                          }
                        }
                      />
                    </label>

                    <button
                      className="edit-compose-youtube-title"
                      type="button"
                      disabled={
                        !parsedYouTube ||
                        youtubeTitleLoading
                      }
                      onClick={() => {
                        void useYouTubeMetadata();
                      }}
                    >
                      {youtubeTitleLoading
                        ? "Getting title..."
                        : "Use YouTube metadata"}
                    </button>

                    <label className="edit-compose-commentary-field">
                      <span>
                        DESCRIPTION / COMMENTARY
                        <small>
                          {body.length}/1500
                        </small>
                      </span>

                      <textarea
                        value={
                          body
                        }
                        maxLength={1500}
                        onChange={
                          (
                            event
                          ) => {
                            setBody(
                              event.target.value
                            );
                          }
                        }
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {post.post_type ===
              "image" && (
              <div className="edit-compose-image-row">
                <div className="edit-compose-current-image">
                  <img
                    src={
                      replacementPreview ??
                      post.image_url ??
                      ""
                    }
                    alt=""
                  />

                  <label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={
                        (
                          event
                        ) => {
                          chooseReplacementImage(
                            event.target.files?.[0] ??
                            null
                          );
                        }
                      }
                    />

                    <UploadCloud size={12} />

                    {replacementImage
                      ? "CHANGE REPLACEMENT"
                      : "REPLACE IMAGE"}
                  </label>
                </div>

                <div className="edit-compose-image-copy">
                  <label className="edit-compose-line-field">
                    <span>
                      TITLE
                      <small>
                        {title.length}/180
                      </small>
                    </span>

                    <input
                      type="text"
                      value={
                        title
                      }
                      maxLength={180}
                      onChange={
                        (
                          event
                        ) => {
                          setTitle(
                            event.target.value
                          );
                        }
                      }
                    />
                  </label>

                  <label className="edit-compose-commentary-field">
                    <span>
                      CAPTION / COMMENTARY
                      <small>
                        {body.length}/1500
                      </small>
                    </span>

                    <textarea
                      value={
                        body
                      }
                      maxLength={1500}
                      onChange={
                        (
                          event
                        ) => {
                          setBody(
                            event.target.value
                          );
                        }
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </main>

          <div className="edit-compose-meta-ribbon">
            <label className="edit-compose-meta-control">
              <span>
                CATEGORY
              </span>

              <div className="edit-compose-select">
                <select
                  value={
                    categoryId
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setCategoryId(
                        event.target.value
                      );
                    }
                  }
                >
                  {categories.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown size={11} />
              </div>
            </label>

            <div className="edit-compose-meta-control edit-compose-width-control">
              <span>
                FEED WIDTH
              </span>

              <div className="edit-compose-width-buttons">
                {(
                  [
                    {
                      value:
                        "small",
                      label:
                        "S",
                    },
                    {
                      value:
                        "large",
                      label:
                        "L",
                    },
                    {
                      value:
                        "wide",
                      label:
                        "WIDE",
                    },
                  ] as Array<{
                    value:
                      PostDisplaySize;
                    label:
                      string;
                  }>
                ).map(
                  (
                    option
                  ) => (
                    <button
                      type="button"
                      key={
                        option.value
                      }
                      className={
                        displaySize ===
                          option.value
                          ? "active"
                          : ""
                      }
                      onClick={() => {
                        setDisplaySize(
                          option.value
                        );
                      }}
                    >
                      {option.label}
                    </button>
                  )
                )}
              </div>

              <small>
                Container width only. The post content itself is not resized or cropped.
              </small>
            </div>
          </div>

          <div className="edit-compose-tags-ribbon">
            <div className="edit-compose-tags-label">
              <strong>
                TAGS
              </strong>

              <span>
                {tagIds.length}/5
              </span>
            </div>

            <div className="edit-compose-tag-list">
              {primaryTags.map(
                (
                  tag
                ) => {
                  const selected =
                    tagIds.includes(
                      tag.id
                    );

                  return (
                    <button
                      key={
                        tag.id
                      }
                      type="button"
                      className={
                        selected
                          ? "selected"
                          : ""
                      }
                      disabled={
                        !selected &&
                        tagIds.length >=
                          5
                      }
                      onClick={() => {
                        toggleTag(
                          tag.id
                        );
                      }}
                    >
                      #{tag.name}
                    </button>
                  );
                }
              )}

              {tags.length >
                8 && (
                <div className="edit-compose-more-select">
                  <select
                    aria-label="More article tags"
                    value=""
                    disabled={
                      tagIds.length >=
                        5 ||
                      additionalTags.length ===
                        0
                    }
                    onChange={
                      (
                        event
                      ) => {
                        addTagFromMore(
                          event.target.value
                        );
                      }
                    }
                  >
                    <option value="">
                      MORE &gt;&gt;
                    </option>

                    {additionalTags.map(
                      (
                        tag
                      ) => (
                        <option
                          key={
                            tag.id
                          }
                          value={
                            tag.id
                          }
                        >
                          #{tag.name}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown size={10} />
                </div>
              )}
            </div>
          </div>

          <div className="edit-compose-utility-ribbon">
            <div className="edit-compose-gif-tools">
              <button
                type="button"
                className="edit-compose-gif-button"
                onClick={() => {
                  setGifOpen(
                    (
                      current
                    ) =>
                      !current
                  );
                }}
              >
                <Images size={12} />

                {gifOpen
                  ? "CLOSE GIPHY"
                  : selectedGif
                    ? "CHANGE GIF"
                    : "ADD GIF"}
              </button>

              {selectedGif && (
                <div className="edit-compose-gif-chip">
                  <img
                    src={
                      selectedGif.previewUrl
                    }
                    alt=""
                  />

                  <span>
                    GIF attached
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGif(
                        null
                      );
                    }}
                    aria-label="Remove GIF"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>

            <span className="edit-compose-utility-note">
              Existing attachment is preserved unless you change or remove it.
            </span>
          </div>

          {gifOpen && (
            <div className="edit-compose-giphy-drawer">
              <GiphyPicker
                selected={
                  selectedGif
                }
                onSelect={
                  (
                    gif
                  ) => {
                    setSelectedGif(
                      gif
                    );

                    setGifOpen(
                      false
                    );
                  }
                }
              />
            </div>
          )}

          {error && (
            <div className="edit-compose-message error">
              {error}
            </div>
          )}

          {saved && (
            <div className="edit-compose-message success">
              <CheckCircle2 size={12} />
              Saved.
            </div>
          )}
        </div>

        <footer className="edit-compose-footer">
          <span>
            Editing existing {postTypeLabel.toLowerCase()} post
          </span>

          <div>
            <button
              className="edit-compose-cancel"
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
            >
              Cancel
            </button>

            <button
              className="edit-compose-save"
              type="button"
              disabled={
                saving ||
                !canSave
              }
              onClick={() => {
                void submit();
              }}
            >
              <Save size={12} />

              {saving
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
