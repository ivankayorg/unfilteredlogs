import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Image as ImageIcon,
  Images,
  Send,
  Trash2,
  Type,
  UploadCloud,
  Video,
  X,
} from "lucide-react";

import {
  fetchYouTubeMetadata,
  parseYouTubeUrl,
} from "../../lib/youtube";

import {
  createQuickPost,
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
  QuickPostType,
} from "../../types/post";

import type {
  PostCategory,
  PostTag,
} from "../../types/taxonomy";

import GiphyPicker from "./GiphyPicker";

import "./QuickPostDialog.css";


/* ==========================================================
   UNFILTERED LOGS
   QUICK POST DIALOG
   YouTube + Text + Image + Optional GIPHY Attachment
   ========================================================== */


type Props = {
  open: boolean;

  onClose: () => void;

  onPosted: (
    post: PostRecord,
  ) => void;
};


type PendingPostImage = {
  id: string;
  file: File;
  previewUrl: string;
};


export default function QuickPostDialog({
  open,
  onClose,
  onPosted,
}: Props) {
  const [
    postType,
    setPostType,
  ] =
    useState<QuickPostType>(
      "text"
    );

  const [
    displaySize,
    setDisplaySize,
  ] =
    useState<PostDisplaySize>(
      "large"
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    youtubeUrl,
    setYoutubeUrl,
  ] =
    useState("");

  const [
    body,
    setBody,
  ] =
    useState("");

  const [
    images,
    setImages,
  ] =
    useState<PendingPostImage[]>(
      []
    );

  const imagePreviewUrlsRef =
    useRef<Set<string>>(
      new Set()
    );

  const [
    gifOpen,
    setGifOpen,
  ] =
    useState(false);

  const [
    selectedGif,
    setSelectedGif,
  ] =
    useState<GiphyGif | null>(
      null
    );

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
    postedMessage,
    setPostedMessage,
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
    availableTags,
    setAvailableTags,
  ] =
    useState<PostTag[]>(
      []
    );

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] =
    useState("");

  const [
    selectedTagIds,
    setSelectedTagIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    taxonomyLoading,
    setTaxonomyLoading,
  ] =
    useState(false);

  const [
    taxonomyError,
    setTaxonomyError,
  ] =
    useState<string | null>(
      null
    );

  const [
    youtubeTitleMode,
    setYoutubeTitleMode,
  ] =
    useState<
      "auto"
      | "user"
    >(
      "auto"
    );

  const [
    youtubeTitleLoading,
    setYoutubeTitleLoading,
  ] =
    useState(false);

  const [
    youtubeTitleError,
    setYoutubeTitleError,
  ] =
    useState<string | null>(
      null
    );


  const youtubeDescriptionAutoRef =
    useRef(
      true
    );


  const parsedYouTube =
    useMemo(
      () =>
        parseYouTubeUrl(
          youtubeUrl
        ),
      [youtubeUrl]
    );


  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    setTaxonomyLoading(
      true
    );

    setTaxonomyError(
      null
    );

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

          setAvailableTags(
            taxonomy.tags
          );

          setSelectedCategoryId(
            (
              current
            ) =>
              current ||
              taxonomy.categories
                .find(
                  (
                    category
                  ) =>
                    category.slug ===
                    "random"
                )
                ?.id ||
              taxonomy.categories[0]
                ?.id ||
              ""
          );
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (!mounted) {
            return;
          }

          setTaxonomyError(
            nextError
              instanceof Error
              ? nextError.message
              : "Could not load categories and tags."
          );
        }
      )
      .finally(
        () => {
          if (mounted) {
            setTaxonomyLoading(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    open,
  ]);


  useEffect(() => {
    if (
      !open ||
      postType !==
        "youtube" ||
      !parsedYouTube
    ) {
      setYoutubeTitleLoading(
        false
      );

      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        () => {
          setYoutubeTitleLoading(
            true
          );

          setYoutubeTitleError(
            null
          );

          void fetchYouTubeMetadata(
            parsedYouTube
              .canonicalUrl,
            controller.signal
          )
            .then(
              (
                metadata
              ) => {
                if (
                  controller.signal
                    .aborted
                ) {
                  return;
                }

                if (
                  youtubeTitleMode ===
                  "auto"
                ) {
                  setTitle(
                    metadata.title
                      .slice(
                        0,
                        180
                      )
                  );
                }

                if (
                  youtubeDescriptionAutoRef
                    .current
                ) {
                  setBody(
                    (
                      metadata.description ??
                      ""
                    ).slice(
                      0,
                      1500
                    )
                  );
                }
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

                console.warn(
                  "UNFILTERED LOGS YOUTUBE TITLE ERROR:",
                  nextError
                );

                setYoutubeTitleError(
                  "Could not fetch YouTube metadata. You can enter the title and description manually."
                );
              }
            )
            .finally(
              () => {
                if (
                  !controller.signal
                    .aborted
                ) {
                  setYoutubeTitleLoading(
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
  }, [
    open,
    postType,
    parsedYouTube
      ?.canonicalUrl,
    youtubeTitleMode,
  ]);


  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown =
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
      onKeyDown
    );

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
        "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown
      );

      document.body.style
        .overflow =
          previousOverflow;
    };
  }, [
    open,
    onClose,
  ]);


  useEffect(() => {
    return () => {
      for (
        const previewUrl
        of imagePreviewUrlsRef.current
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      imagePreviewUrlsRef.current.clear();
    };
  }, []);


  if (!open) {
    return null;
  }


  const resetForm = () => {
    setPostType(
      "text"
    );

    setDisplaySize(
      "large"
    );

    setTitle("");
    setYoutubeUrl("");
    setBody("");

    setYoutubeTitleMode(
      "auto"
    );

    setYoutubeTitleLoading(
      false
    );

    setYoutubeTitleError(
      null
    );

    youtubeDescriptionAutoRef
      .current =
        true;

    setSelectedCategoryId(
      categories.find(
        (
          category
        ) =>
          category.slug ===
          "random"
      )?.id ??
      categories[0]?.id ??
      ""
    );

    setSelectedTagIds(
      []
    );

    for (
      const previewUrl
      of imagePreviewUrlsRef.current
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    imagePreviewUrlsRef.current.clear();
    setImages([]);

    setGifOpen(false);
    setSelectedGif(null);

    setSaving(false);
    setError(null);
    setPostedMessage(null);
  };


  const closeDialog = () => {
    resetForm();
    onClose();
  };


  const changePostType =
    (
      next:
        QuickPostType
    ) => {
      setPostType(
        next
      );

      setError(null);
      setPostedMessage(null);
    };


  const addImages =
    (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      setImages((current) => {
        const available =
          Math.max(0, 10 - current.length);

        if (available === 0) {
          setError(
            "Image posts are limited to 10 images."
          );
          return current;
        }

        const accepted =
          files.slice(0, available);

        if (files.length > available) {
          setError(
            "Only the first 10 images were added."
          );
        } else {
          setError(null);
        }

        const nextImages =
          accepted.map((file) => {
            const previewUrl =
              URL.createObjectURL(file);

            imagePreviewUrlsRef.current.add(
              previewUrl
            );

            return {
              id: crypto.randomUUID(),
              file,
              previewUrl,
            };
          });

        return [
          ...current,
          ...nextImages,
        ];
      });
    };


  const removeImage =
    (index: number) => {
      setImages((current) => {
        const target = current[index];

        if (target) {
          URL.revokeObjectURL(
            target.previewUrl
          );

          imagePreviewUrlsRef.current.delete(
            target.previewUrl
          );
        }

        return current.filter(
          (_, imageIndex) =>
            imageIndex !== index
        );
      });
    };


  const moveImage =
    (fromIndex: number, toIndex: number) => {
      setImages((current) => {
        if (
          fromIndex < 0 ||
          fromIndex >= current.length ||
          toIndex < 0 ||
          toIndex >= current.length ||
          fromIndex === toIndex
        ) {
          return current;
        }

        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    };


  const toggleTag =
    (
      tagId: string,
    ) => {
      setSelectedTagIds(
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


  const submit =
    async () => {
      setSaving(true);
      setError(null);

      try {
        let created:
          PostRecord;

        if (
          postType ===
          "youtube"
        ) {
          created =
            await createQuickPost(
              {
                postType:
                  "youtube",

                title,

                body,

                youtubeUrl,

                categoryId:
                  selectedCategoryId,

                tagIds:
                  selectedTagIds,

                displaySize,

                gif:
                  selectedGif,
              }
            );
        } else if (
          postType ===
          "text"
        ) {
          created =
            await createQuickPost(
              {
                postType:
                  "text",

                title,

                body,

                categoryId:
                  selectedCategoryId,

                tagIds:
                  selectedTagIds,

                displaySize,

                gif:
                  selectedGif,
              }
            );
        } else {
          if (
            images.length === 0 &&
            !selectedGif
          ) {
            throw new Error(
              "Pick an image or choose a GIF from GIPHY."
            );
          }

          const usingGifAsMain =
            images.length === 0 &&
            Boolean(
              selectedGif
            );

          created =
            await createQuickPost(
              {
                postType:
                  "image",

                title,

                body,

                images:
                  images.map(
                    (item) => item.file
                  ),

                mainGif:
                  usingGifAsMain
                    ? selectedGif
                    : null,

                categoryId:
                  selectedCategoryId,

                tagIds:
                  selectedTagIds,

                displaySize,

                gif:
                  usingGifAsMain
                    ? null
                    : selectedGif,
              }
            );
        }

        setPostedMessage(
          created.moderation_status ===
            "approved"
            ? "Posted."
            : "Submitted for approval."
        );

        onPosted(
          created
        );

        window.setTimeout(
          () => {
            closeDialog();
          },
          450
        );
      } catch (
        nextError
      ) {
        console.error(
          "UNFILTERED LOGS POST CREATE ERROR:",
          nextError
        );

        let message =
          "UNFILTERED LOGS could not create the post.";

        if (
          nextError
            instanceof Error
        ) {
          message =
            nextError.message;
        } else if (
          nextError &&
          typeof nextError ===
            "object" &&
          "message" in
            nextError
        ) {
          const errorObject =
            nextError as {
              message?: unknown;
              details?: unknown;
              hint?: unknown;
              code?: unknown;
            };

          const parts = [
            errorObject.message,
            errorObject.details,
            errorObject.hint,
          ]
            .filter(
              (
                value
              ) =>
                typeof value ===
                  "string" &&
                value.trim()
                  .length > 0
            )
            .map(
              String
            );

          message =
            parts.join(
              " — "
            ) ||
            "UNFILTERED LOGS could not create the post.";
        }

        setError(
          message
        );

        setSaving(false);
      }
    };


  const canSubmit =
    Boolean(
      selectedCategoryId
    ) &&
    !taxonomyLoading &&
    (
      postType ===
        "youtube"
        ? Boolean(
            parsedYouTube
          ) &&
          body.trim()
            .length <=
            1500
        : postType ===
            "text"
          ? Boolean(
              title.trim()
            ) &&
            title.trim()
              .length <=
              180 &&
            Boolean(
              body.trim()
            ) &&
            body.trim()
              .length <=
              1500
          : Boolean(
              images.length > 0 ||
              selectedGif
            ) &&
            body.trim()
              .length <=
              1500
    );


  const primaryTags =
    availableTags.slice(
      0,
      8
    );


  const additionalTags =
    availableTags
      .slice(
        8
      )
      .filter(
        (
          tag
        ) =>
          !selectedTagIds.includes(
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
        selectedTagIds.length >=
          5 ||
        selectedTagIds.includes(
          tagId
        )
      ) {
        return;
      }

      setSelectedTagIds(
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
      className="quick-compose-backdrop"
      role="presentation"
      onMouseDown={
        (
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeDialog();
          }
        }
      }
    >
      <section
        className="quick-compose-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-compose-title"
      >
        <header className="quick-compose-titlebar">
          <div className="quick-compose-titleblock">
            <span>
              NEW POST
            </span>

            <strong id="quick-compose-title">
              Say something.
            </strong>
          </div>

          <nav
            className="quick-compose-modebar"
            aria-label="Post type"
          >
            <button
              type="button"
              className={
                postType ===
                "text"
                  ? "active"
                  : ""
              }
              onClick={() => {
                changePostType(
                  "text"
                );
              }}
            >
              <Type size={12} />
              TEXT
            </button>

            <button
              type="button"
              className={
                postType ===
                "youtube"
                  ? "active"
                  : ""
              }
              onClick={() => {
                changePostType(
                  "youtube"
                );
              }}
            >
              <Video size={12} />
              YOUTUBE
            </button>

            <button
              type="button"
              className={
                postType ===
                "image"
                  ? "active"
                  : ""
              }
              onClick={() => {
                changePostType(
                  "image"
                );
              }}
            >
              <ImageIcon size={12} />
              IMAGE / GIF
            </button>
          </nav>

          <button
            className="quick-compose-close"
            type="button"
            onClick={
              closeDialog
            }
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>

        <div className="quick-compose-scroll">
          <main className="quick-compose-canvas">
            {postType ===
              "text" && (
              <>
                <label className="quick-compose-title-field">
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
                    placeholder="Give the post a title..."
                    autoFocus
                  />
                </label>

                <label className="quick-compose-body-field">
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
                        youtubeDescriptionAutoRef
                          .current =
                            false;

                        setBody(
                          event.target.value
                        );
                      }
                    }
                    placeholder="Write the thing..."
                  />
                </label>
              </>
            )}

            {postType ===
              "youtube" && (
              <>
                <label className="quick-compose-line-field">
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

                        if (
                          youtubeTitleMode ===
                          "auto"
                        ) {
                          setTitle(
                            ""
                          );
                        }

                        if (
                          youtubeDescriptionAutoRef
                            .current
                        ) {
                          setBody(
                            ""
                          );
                        }

                        setYoutubeTitleError(
                          null
                        );
                      }
                    }
                    placeholder="Paste a YouTube or Shorts URL..."
                    autoFocus
                  />
                </label>

                <div className="quick-compose-youtube-row">
                  <div className="quick-compose-video-stage">
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
                      <div className="quick-compose-empty-stage">
                        <Video size={22} />
                        <span>
                          Video preview
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="quick-compose-video-copy">
                    <label className="quick-compose-line-field">
                      <span>
                        TITLE

                        <small>
                          {youtubeTitleLoading
                            ? "fetching..."
                            : `${title.length}/180`}
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

                            setYoutubeTitleMode(
                              "user"
                            );
                          }
                        }
                        placeholder="Video title..."
                      />
                    </label>

                    <div className="quick-compose-title-helper">
                      {youtubeTitleMode ===
                        "user" &&
                        parsedYouTube && (
                        <button
                          type="button"
                          onClick={() => {
                            setYoutubeTitleMode(
                              "auto"
                            );

                            setTitle(
                              ""
                            );
                          }}
                        >
                          Use YouTube title
                        </button>
                      )}

                      {youtubeTitleError && (
                        <span>
                          {youtubeTitleError}
                        </span>
                      )}
                    </div>

                    <label className="quick-compose-commentary-field">
                      <span>
                        DESCRIPTION / COMMENTARY
                        <small>
                          YouTube auto-fill · editable · {body.length}/1500
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
                        placeholder="YouTube description will appear here. Edit it however you want."
                      />
                    </label>
                  </div>
                </div>

                {youtubeUrl &&
                  !parsedYouTube && (
                  <div className="quick-compose-error-inline">
                    That does not look like a valid YouTube URL.
                  </div>
                )}
              </>
            )}

            {postType ===
              "image" && (
              <>
                <div className="quick-compose-image-row">
                  <div
                    className="quick-compose-image-stage"
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      addImages(
                        Array.from(event.dataTransfer.files)
                      );
                    }}
                  >
                    {images.length > 0 ? (
                      <img
                        src={images[0].previewUrl}
                        alt="Primary upload preview"
                      />
                    ) : (
                      <div>
                        <UploadCloud size={24} />
                        <strong>
                          DROP / CHOOSE IMAGES
                        </strong>
                        <span>
                          JPG · PNG · WEBP · GIF · UP TO 10
                        </span>
                      </div>
                    )}

                    <label className="quick-compose-image-picker">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(event) => {
                          addImages(
                            Array.from(
                              event.target.files ?? []
                            )
                          );
                          event.target.value = "";
                        }}
                      />

                      <UploadCloud size={11} />
                      {images.length > 0
                        ? `ADD PHOTOS (${images.length}/10)`
                        : "CHOOSE PHOTOS"}
                    </label>
                  </div>

                  <div className="quick-compose-image-copy">
                    <label className="quick-compose-line-field">
                      <span>
                        TITLE

                        <small>
                          optional · {title.length}/180
                        </small>
                      </span>

                      <input
                        type="text"
                        value={title}
                        maxLength={180}
                        onChange={(event) => {
                          setTitle(
                            event.target.value
                          );
                        }}
                        placeholder="What are we looking at?"
                      />
                    </label>

                    <label className="quick-compose-commentary-field">
                      <span>
                        CAPTION

                        <small>
                          optional · {body.length}/1500
                        </small>
                      </span>

                      <textarea
                        value={body}
                        maxLength={1500}
                        onChange={(event) => {
                          setBody(
                            event.target.value
                          );
                        }}
                        placeholder="Context, explanation, nonsense..."
                      />
                    </label>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="quick-compose-gallery-editor">
                    <div className="quick-compose-gallery-heading">
                      <strong>PHOTO ORDER</strong>
                      <span>
                        Drag to reorder. Image 1 is the primary feed image.
                      </span>
                    </div>

                    <div className="quick-compose-gallery-list">
                      {images.map((item, index) => (
                        <div
                          className={
                            index === 0
                              ? "quick-compose-gallery-item primary"
                              : "quick-compose-gallery-item"
                          }
                          key={item.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData(
                              "text/plain",
                              String(index)
                            );
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const fromIndex = Number(
                              event.dataTransfer.getData("text/plain")
                            );
                            if (Number.isInteger(fromIndex)) {
                              moveImage(fromIndex, index);
                            }
                          }}
                        >
                          <div className="quick-compose-gallery-thumb">
                            <img
                              src={item.previewUrl}
                              alt={`Upload ${index + 1}`}
                            />

                            <span>
                              {index === 0
                                ? "PRIMARY"
                                : `#${index + 1}`}
                            </span>
                          </div>

                          <div className="quick-compose-gallery-controls">
                            <GripVertical
                              size={12}
                              aria-hidden="true"
                            />

                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() =>
                                moveImage(index, index - 1)
                              }
                              aria-label="Move image left"
                            >
                              <ChevronLeft size={11} />
                            </button>

                            <button
                              type="button"
                              disabled={index === images.length - 1}
                              onClick={() =>
                                moveImage(index, index + 1)
                              }
                              aria-label="Move image right"
                            >
                              <ChevronRight size={11} />
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() => removeImage(index)}
                              aria-label="Remove image"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          <div className="quick-compose-meta-ribbon">
            <label className="quick-compose-meta-control">
              <span>
                CATEGORY
              </span>

              {taxonomyLoading ? (
                <div className="quick-compose-taxonomy-status">
                  Loading...
                </div>
              ) : taxonomyError ? (
                <div className="quick-compose-taxonomy-status error">
                  {taxonomyError}
                </div>
              ) : (
                <div className="quick-compose-select">
                  <select
                    value={
                      selectedCategoryId
                    }
                    onChange={
                      (
                        event
                      ) => {
                        setSelectedCategoryId(
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
              )}
            </label>

            <div className="quick-compose-meta-control quick-compose-width-control">
              <span>
                FEED WIDTH
              </span>

              <div className="quick-compose-width-buttons">
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
                Container width only. Your text, image, GIF, or video keeps its own proportions.
              </small>
            </div>
          </div>

          <div className="quick-compose-tags-ribbon">
            <div className="quick-compose-tags-label">
              <strong>
                TAGS
              </strong>

              <span>
                {selectedTagIds.length}/5
              </span>
            </div>

            <div className="quick-compose-tag-list">
              {primaryTags.map(
                (
                  tag
                ) => {
                  const selected =
                    selectedTagIds.includes(
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
                        selectedTagIds.length >=
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

              {availableTags.length >
                8 && (
                <div className="quick-compose-more-select">
                  <select
                    aria-label="More article tags"
                    value=""
                    disabled={
                      selectedTagIds.length >=
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

          <div className="quick-compose-utility-ribbon">
            <div className="quick-compose-gif-tools">
              <button
                type="button"
                className="quick-compose-gif-button"
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
                <div className="quick-compose-gif-chip">
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

            <span className="quick-compose-utility-note">
              {postType ===
                "image" &&
              images.length === 0
                ? "No upload? A chosen GIF can be the main image."
                : "Optional attachment."}
            </span>
          </div>

          {gifOpen && (
            <div className="quick-compose-giphy-drawer">
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
            <div className="quick-compose-message error">
              {error}
            </div>
          )}

          {postedMessage && (
            <div className="quick-compose-message success">
              <CheckCircle2 size={12} />
              {postedMessage}
            </div>
          )}
        </div>

        <footer className="quick-compose-footer">
          <span>
            One category · up to five tags
          </span>

          <div>
            <button
              className="quick-compose-cancel"
              type="button"
              onClick={
                closeDialog
              }
              disabled={
                saving
              }
            >
              Cancel
            </button>

            <button
              className="quick-compose-submit"
              type="button"
              onClick={() => {
                void submit();
              }}
              disabled={
                saving ||
                !canSubmit
              }
            >
              <Send size={12} />

              {saving
                ? "Posting..."
                : "Post"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
