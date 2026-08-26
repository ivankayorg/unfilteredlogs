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


  const useYouTubeTitle =
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
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not get the YouTube title."
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
      500 &&
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


  return (
    <div
      className="edit-post-backdrop"
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
        className="edit-post-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-post-title"
      >
        <header className="edit-post-header">
          <div>
            <span className="edit-post-eyebrow">
              EDIT RECENT POST
            </span>

            <h2 id="edit-post-title">
              Edit post
            </h2>
          </div>

          <div className="edit-post-header-right">
            <span className="edit-post-type-badge">
              {post.post_type ===
                "youtube"
                ? "YOUTUBE"
                : post.post_type ===
                    "image"
                  ? "IMAGE / GIF"
                  : "TEXT"}
            </span>

            <button
              className="edit-post-close"
              type="button"
              onClick={
                onClose
              }
              aria-label="Close"
            >
              <X
                size={14}
              />
            </button>
          </div>
        </header>

        <div className="edit-post-body">
          <section className="edit-post-section">
            <div className="edit-post-section-heading">
              <strong>
                Content
              </strong>

              <span>
                Edit the post itself.
              </span>
            </div>

            {post.post_type ===
              "text" && (
              <div className="edit-post-content-fields">
                <label className="edit-post-field">
                  <span>
                    Title

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

                <label className="edit-post-field">
                  <span>
                    Post

                    <small>
                      {body.length}/500
                    </small>
                  </span>

                  <textarea
                    className="edit-post-main-textarea"
                    value={
                      body
                    }
                    maxLength={500}
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
            )}

            {post.post_type ===
              "youtube" && (
              <div className="edit-post-youtube-layout">
                <div className="edit-post-youtube-fields">
                  <label className="edit-post-field">
                    <span>
                      YouTube URL
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

                  <label className="edit-post-field">
                    <span>
                      Title

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

                    <div className="edit-post-title-tools">
                      <button
                        type="button"
                        disabled={
                          !parsedYouTube ||
                          youtubeTitleLoading
                        }
                        onClick={() => {
                          void useYouTubeTitle();
                        }}
                      >
                        {youtubeTitleLoading
                          ? "Getting title..."
                          : "Use YouTube title"}
                      </button>
                    </div>
                  </label>

                  <label className="edit-post-field">
                    <span>
                      Commentary

                      <small>
                        {body.length}/500
                      </small>
                    </span>

                    <textarea
                      value={
                        body
                      }
                      maxLength={500}
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

                <div className="edit-post-youtube-preview">
                  {parsedYouTube ? (
                    <>
                      <iframe
                        src={
                          parsedYouTube.embedUrl
                        }
                        title="YouTube preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />

                      <span>
                        Current video preview
                      </span>
                    </>
                  ) : (
                    <div className="edit-post-preview-empty">
                      Enter a valid YouTube URL to preview it.
                    </div>
                  )}
                </div>
              </div>
            )}

            {post.post_type ===
              "image" && (
              <div className="edit-post-image-layout">
                <div className="edit-post-image-preview">
                  <img
                    src={
                      replacementPreview ??
                      post.image_url ??
                      ""
                    }
                    alt=""
                  />
                </div>

                <div className="edit-post-image-fields">
                  <label className="edit-post-replace-image">
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

                    <UploadCloud
                      size={17}
                    />

                    <span>
                      <strong>
                        Replace image
                      </strong>

                      <small>
                        Optional
                      </small>
                    </span>
                  </label>

                  <label className="edit-post-field">
                    <span>
                      Title

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

                  <label className="edit-post-field">
                    <span>
                      Caption / commentary

                      <small>
                        {body.length}/500
                      </small>
                    </span>

                    <textarea
                      value={
                        body
                      }
                      maxLength={500}
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
          </section>

          <section className="edit-post-section">
            <div className="edit-post-section-heading">
              <strong>
                Post details
              </strong>

              <span>
                Feed placement and organization.
              </span>
            </div>

            <div className="edit-post-details-grid">
              <label className="edit-post-meta-field">
                <span>
                  Category
                </span>

                <div className="edit-post-select-wrap">
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

                  <ChevronDown
                    size={12}
                  />
                </div>
              </label>

              <div className="edit-post-meta-field">
                <span>
                  Post size
                </span>

                <div className="edit-post-size-options">
                  {(
                    [
                      {
                        value:
                          "small",
                        label:
                          "Small",
                      },
                      {
                        value:
                          "large",
                        label:
                          "Large",
                      },
                      {
                        value:
                          "wide",
                        label:
                          "Wide",
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
                            ? "selected"
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

                <small className="edit-post-size-help">
                  Changes only the width of the post container in the feed.
                  It does not resize or crop the actual post content.
                </small>
              </div>
            </div>
          </section>

          <section className="edit-post-section">
            <div className="edit-post-section-heading edit-post-tags-heading">
              <div>
                <strong>
                  Article tags
                </strong>

                <span>
                  Optional · choose up to five
                </span>
              </div>

              <em>
                {tagIds.length}/5 selected
              </em>
            </div>

            <div className="edit-post-tags-row">
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
                      #
                      {tag.name}
                    </button>
                  );
                }
              )}

              {tags.length >
                8 && (
                <div className="edit-post-more-tags">
                  <select
                    value=""
                    aria-label="More article tags"
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

                  <ChevronDown
                    size={11}
                  />
                </div>
              )}
            </div>
          </section>

          <section className="edit-post-section edit-post-gif-section">
            <div className="edit-post-gif-bar">
              <div>
                <Images
                  size={13}
                />

                <span>
                  GIF attachment
                </span>

                <small>
                  Keep, replace, or remove
                </small>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGifOpen(
                    (
                      current
                    ) =>
                      !current
                  );
                }}
              >
                {gifOpen
                  ? "Close GIPHY"
                  : selectedGif
                    ? "Change GIF"
                    : "Add GIF"}
              </button>
            </div>

            {selectedGif && (
              <div className="edit-post-selected-gif">
                <img
                  src={
                    selectedGif.url
                  }
                  alt={
                    selectedGif.title
                  }
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGif(
                      null
                    );
                  }}
                >
                  <X
                    size={10}
                  />

                  Remove
                </button>
              </div>
            )}

            {gifOpen && (
              <div className="edit-post-giphy-drawer">
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
          </section>

          {error && (
            <div className="edit-post-error">
              {error}
            </div>
          )}

          {saved && (
            <div className="edit-post-success">
              <CheckCircle2
                size={13}
              />

              Saved.
            </div>
          )}
        </div>

        <footer className="edit-post-footer">
          <span>
            Editing existing post
          </span>

          <div>
            <button
              className="edit-post-cancel"
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
              className="edit-post-save"
              type="button"
              disabled={
                saving ||
                !canSave
              }
              onClick={() => {
                void submit();
              }}
            >
              <Save
                size={12}
              />

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
