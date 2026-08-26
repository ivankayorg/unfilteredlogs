import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ExternalLink,
  FileText,
  Plus,
  Save,
  Star,
  Trash2,
} from "lucide-react";

import {
  deleteBlogPost,
  getAdminBlogPosts,
  saveBlogPost,
  setBlogPostHighlighted,
} from "../../services/blog";

import type {
  BlogAccent,
  BlogPost,
} from "../../types/blog";

import "./BlogManager.css";


/* ==========================================================
   BLOG ADMIN 001
   HELPERS
   ========================================================== */


function slugify(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


function formatDate(
  value:
    string |
    null,
) {
  if (!value) {
    return "Not published";
  }

  return new Date(
    value
  ).toLocaleDateString(
    undefined,
    {
      year:
        "numeric",

      month:
        "short",

      day:
        "numeric",
    }
  );
}


type EditorState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  heroImageUrl: string;
  accentStyle: BlogAccent;
  published: boolean;
  highlighted: boolean;
};


const emptyEditor:
EditorState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  heroImageUrl: "",
  accentStyle:
    "orange",
  published: false,
  highlighted: false,
};


function toEditor(
  post: BlogPost,
): EditorState {
  return {
    id:
      post.id,

    title:
      post.title,

    slug:
      post.slug,

    excerpt:
      post.excerpt ??
      "",

    body:
      post.body,

    heroImageUrl:
      post.hero_image_url ??
      "",

    accentStyle:
      post.accent_style,

    published:
      post.published,

    highlighted:
      post.is_highlighted,
  };
}


/* ==========================================================
   BLOG ADMIN 002
   MANAGER
   ========================================================== */


export default function BlogManager() {
  const [
    posts,
    setPosts,
  ] =
    useState<BlogPost[]>(
      []
    );

  const [
    editor,
    setEditor,
  ] =
    useState<EditorState>(
      emptyEditor
    );

  const [
    slugTouched,
    setSlugTouched,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    featureSaving,
    setFeatureSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const publishedCount =
    useMemo(
      () =>
        posts.filter(
          (
            post
          ) =>
            post.published
        ).length,
      [
        posts,
      ]
    );


  const draftCount =
    posts.length -
    publishedCount;


  const load =
    async () => {
      try {
        setPosts(
          await getAdminBlogPosts()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load blog posts."
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const updateTitle =
    (
      value: string,
    ) => {
      setEditor(
        (
          current
        ) => ({
          ...current,

          title:
            value,

          slug:
            slugTouched
              ? current.slug
              : slugify(
                  value
                ),
        })
      );
    };


  const selectPost =
    (
      post: BlogPost,
    ) => {
      setEditor(
        toEditor(
          post
        )
      );

      setSlugTouched(
        true
      );

      setError(
        null
      );
    };


  const startNew =
    () => {
      setEditor(
        emptyEditor
      );

      setSlugTouched(
        false
      );

      setError(
        null
      );
    };


  const save =
    async () => {
      if (
        !editor.title.trim() ||
        !editor.slug.trim() ||
        !editor.body.trim()
      ) {
        setError(
          "Title, slug, and body are required."
        );

        return;
      }

      setSaving(
        true
      );

      setError(
        null
      );

      try {
        const id =
          await saveBlogPost({
            id:
              editor.id,

            title:
              editor.title,

            slug:
              editor.slug,

            excerpt:
              editor.excerpt,

            body:
              editor.body,

            heroImageUrl:
              editor.heroImageUrl,

            accentStyle:
              editor.accentStyle,

            published:
              editor.published,

            highlighted:
              editor.highlighted,
          });

        await setBlogPostHighlighted(
          id,
          editor.published
            ? editor.highlighted
            : false
        );

        const refreshed =
          await getAdminBlogPosts();

        setPosts(
          refreshed
        );

        const saved =
          refreshed.find(
            (
              post
            ) =>
              post.id ===
              id
          );

        if (saved) {
          setEditor(
            toEditor(
              saved
            )
          );

          setSlugTouched(
            true
          );
        }
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not save blog post."
        );
      } finally {
        setSaving(
          false
        );
      }
    };


  const toggleHomepageFeature =
    async (
      checked:
        boolean,
    ) => {
      if (
        !editor.published
      ) {
        return;
      }

      /*
       * New unsaved articles do not have an ID yet.
       * Keep the intended state locally; Save article will
       * persist it immediately after the new row is created.
       */
      if (!editor.id) {
        setEditor(
          (
            current
          ) => ({
            ...current,

            highlighted:
              checked,
          })
        );

        return;
      }

      setFeatureSaving(
        true
      );

      setError(
        null
      );

      try {
        await setBlogPostHighlighted(
          editor.id,
          checked
        );

        const refreshed =
          await getAdminBlogPosts();

        setPosts(
          refreshed
        );

        const refreshedEditor =
          refreshed.find(
            (
              post
            ) =>
              post.id ===
              editor.id
          );

        if (
          refreshedEditor
        ) {
          setEditor(
            toEditor(
              refreshedEditor
            )
          );
        } else {
          setEditor(
            (
              current
            ) => ({
              ...current,

              highlighted:
                checked,
            })
          );
        }
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not update Homepage feature."
        );
      } finally {
        setFeatureSaving(
          false
        );
      }
    };


  const remove =
    async () => {
      if (!editor.id) {
        return;
      }

      if (
        !window.confirm(
          `Delete "${editor.title}"?`
        )
      ) {
        return;
      }

      try {
        await deleteBlogPost(
          editor.id
        );

        startNew();

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not delete blog post."
        );
      }
    };


  if (loading) {
    return (
      <div className="blog-admin-loading">
        Loading blog...
      </div>
    );
  }


  return (
    <section className="blog-admin">
      <header className="blog-admin-heading">
        <div>
          <span className="admin-eyebrow">
            UNFILTERED LOG EDITORIAL
          </span>

          <h1>
            Blog
          </h1>

          <p>
            {publishedCount}
            {" published · "}
            {draftCount}
            {" drafts"}
          </p>
        </div>

        <button
          className="blog-new-button"
          type="button"
          onClick={
            startNew
          }
        >
          <Plus
            size={13}
          />

          New article
        </button>
      </header>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <div className="blog-admin-grid">
        <aside className="blog-admin-library">
          <div className="blog-library-heading">
            <strong>
              Articles
            </strong>

            <span>
              {posts.length}
            </span>
          </div>

          <div className="blog-card-list">
            {posts.length ===
              0 ? (
              <div className="blog-admin-empty">
                No articles yet.
              </div>
            ) : (
              posts.map(
                (
                  post
                ) => (
                  <article
                    className={
                      editor.id ===
                        post.id
                        ? "blog-admin-card selected"
                        : "blog-admin-card"
                    }
                    key={
                      post.id
                    }
                  >
                    {post.hero_image_url ? (
                      <button
                        className="blog-card-image"
                        type="button"
                        onClick={() => {
                          selectPost(
                            post
                          );
                        }}
                      >
                        <img
                          src={
                            post.hero_image_url
                          }
                          alt=""
                        />
                      </button>
                    ) : (
                      <button
                        className="blog-card-image placeholder"
                        type="button"
                        onClick={() => {
                          selectPost(
                            post
                          );
                        }}
                      >
                        <FileText
                          size={24}
                        />
                      </button>
                    )}

                    <div className="blog-card-copy">
                      <div className="blog-card-statusline">
                        <span
                          className={
                            post.published
                              ? "blog-status published"
                              : "blog-status draft"
                          }
                        >
                          {post.published
                            ? "Published"
                            : "Draft"}
                        </span>

                        {post.is_highlighted && (
                          <span className="blog-highlighted">
                            <Star
                              size={10}
                              fill="currentColor"
                            />

                            Homepage feature
                          </span>
                        )}
                      </div>

                      <button
                        className="blog-card-title"
                        type="button"
                        onClick={() => {
                          selectPost(
                            post
                          );
                        }}
                      >
                        {post.title}
                      </button>

                      <p>
                        {post.excerpt?.trim() ||
                          post.body.slice(
                            0,
                            150
                          )}
                      </p>

                      <div className="blog-card-meta">
                        <span>
                          <CalendarDays
                            size={10}
                          />

                          {post.published
                            ? formatDate(
                                post.published_at
                              )
                            : `Updated ${formatDate(
                                post.updated_at
                              )}`}
                        </span>

                        {post.published && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                            <ExternalLink
                              size={10}
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )
            )}
          </div>
        </aside>

        <section className="blog-admin-editor">
          <div className="blog-editor-heading">
            <div>
              <span className="admin-eyebrow">
                {editor.id
                  ? "EDIT ARTICLE"
                  : "NEW ARTICLE"}
              </span>

              <strong>
                {editor.title.trim() ||
                  "Untitled article"}
              </strong>
            </div>

            {editor.id &&
              editor.published && (
              <a
                href={`/blog/${editor.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                View article
                <ExternalLink
                  size={11}
                />
              </a>
            )}
          </div>

          <div className="blog-editor-fields">
            <label>
              <span>
                Title
              </span>

              <input
                value={
                  editor.title
                }
                maxLength={180}
                onChange={
                  (
                    event
                  ) => {
                    updateTitle(
                      event.target.value
                    );
                  }
                }
              />
            </label>

            <label>
              <span>
                Slug
              </span>

              <input
                value={
                  editor.slug
                }
                maxLength={180}
                onChange={
                  (
                    event
                  ) => {
                    setSlugTouched(
                      true
                    );

                    setEditor(
                      (
                        current
                      ) => ({
                        ...current,

                        slug:
                          slugify(
                            event.target.value
                          ),
                      })
                    );
                  }
                }
              />
            </label>

            <label>
              <span>
                Excerpt

                <small>
                  {editor.excerpt.length}/500
                </small>
              </span>

              <textarea
                className="blog-admin-excerpt"
                value={
                  editor.excerpt
                }
                maxLength={500}
                onChange={
                  (
                    event
                  ) => {
                    setEditor(
                      (
                        current
                      ) => ({
                        ...current,

                        excerpt:
                          event.target.value,
                      })
                    );
                  }
                }
              />
            </label>

            <label>
              <span>
                Body

                <small>
                  {editor.body.length}/20000
                </small>
              </span>

              <textarea
                className="blog-admin-body"
                value={
                  editor.body
                }
                maxLength={20000}
                onChange={
                  (
                    event
                  ) => {
                    setEditor(
                      (
                        current
                      ) => ({
                        ...current,

                        body:
                          event.target.value,
                      })
                    );
                  }
                }
              />
            </label>

            <label>
              <span>
                Hero image URL
              </span>

              <input
                value={
                  editor.heroImageUrl
                }
                onChange={
                  (
                    event
                  ) => {
                    setEditor(
                      (
                        current
                      ) => ({
                        ...current,

                        heroImageUrl:
                          event.target.value,
                      })
                    );
                  }
                }
                placeholder="https://..."
              />
            </label>

            <label>
              <span>
                Highlight color
              </span>

              <select
                value={
                  editor.accentStyle
                }
                onChange={
                  (
                    event
                  ) => {
                    setEditor(
                      (
                        current
                      ) => ({
                        ...current,

                        accentStyle:
                          event.target.value as
                            BlogAccent,
                      })
                    );
                  }
                }
              >
                <option value="orange">
                  UNFILTERED LOG Blue
                </option>

                <option value="blue">
                  Light Blue
                </option>
              </select>
            </label>

            <div className="blog-admin-toggles">
              <label>
                <input
                  type="checkbox"
                  checked={
                    editor.published
                  }
                  onChange={
                    (
                      event
                    ) => {
                      const published =
                        event.target.checked;

                      setEditor(
                        (
                          current
                        ) => ({
                          ...current,

                          published,

                          highlighted:
                            published
                              ? current.highlighted
                              : false,
                        })
                      );
                    }
                  }
                />

                Published
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    editor.highlighted
                  }
                  disabled={
                    !editor.published ||
                    featureSaving
                  }
                  onChange={
                    (
                      event
                    ) => {
                      void toggleHomepageFeature(
                        event.target.checked
                      );
                    }
                  }
                />

                {featureSaving
                  ? "Updating homepage..."
                  : "Homepage feature"}
              </label>
            </div>
          </div>

          <footer className="blog-admin-actions">
            {editor.id && (
              <button
                className="danger"
                type="button"
                onClick={() => {
                  void remove();
                }}
              >
                <Trash2
                  size={12}
                />

                Delete
              </button>
            )}

            <button
              className="primary"
              type="button"
              disabled={
                saving
              }
              onClick={() => {
                void save();
              }}
            >
              <Save
                size={12}
              />

              {saving
                ? "Saving..."
                : "Save article"}
            </button>
          </footer>
        </section>
      </div>
    </section>
  );
}
