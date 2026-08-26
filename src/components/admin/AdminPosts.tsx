import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Pencil,
  Pin,
  RefreshCw,
  Search,
  Video,
} from "lucide-react";

import EditPostDialog from "../posts/EditPostDialog";

import {
  getFeedPosts,
  setFrontPagePin,
  setFrontPageVisibility,
} from "../../services/posts";

import type {
  PostRecord,
} from "../../types/post";


/* ==========================================================
   ADMIN POSTS 001
   Approved post management + front-page curation
   ========================================================== */


const FRONT_PAGE_LIMIT = 3;


function formatDate(
  value: string,
) {
  return new Date(
    value
  ).toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


function getPostLabel(
  post: PostRecord,
) {
  if (
    post.post_type ===
    "youtube"
  ) {
    return post.video_type ===
      "short"
      ? "YouTube Short"
      : "YouTube Video";
  }

  if (
    post.post_type ===
    "image"
  ) {
    return "Image";
  }

  return "Text";
}


function PostTypeIcon({
  post,
}: {
  post: PostRecord;
}) {
  if (
    post.post_type ===
    "youtube"
  ) {
    return <Video size={15} />;
  }

  if (
    post.post_type ===
    "image"
  ) {
    return <ImageIcon size={15} />;
  }

  return <FileText size={15} />;
}


export default function AdminPosts() {
  const [
    posts,
    setPosts,
  ] =
    useState<PostRecord[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    workingId,
    setWorkingId,
  ] =
    useState<string | null>(
      null
    );

  const [
    editingPost,
    setEditingPost,
  ] =
    useState<PostRecord | null>(
      null
    );


  const load =
    async () => {
      try {
        setLoading(true);
        setError(null);

        const nextPosts =
          await getFeedPosts();

        setPosts(
          nextPosts.filter(
            (
              post
            ) =>
              post.moderation_status ===
              "approved"
          )
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load approved posts."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const frontPagePosts =
    useMemo(
      () =>
        posts
          .filter(
            (
              post
            ) =>
              Boolean(
                post.front_page_pinned
              )
          )
          .sort(
            (
              left,
              right
            ) =>
              new Date(
                right.front_page_pinned_at ??
                  right.created_at
              ).getTime() -
              new Date(
                left.front_page_pinned_at ??
                  left.created_at
              ).getTime()
          ),
      [
        posts,
      ]
    );


  const visiblePosts =
    useMemo(
      () => {
        const normalized =
          search
            .trim()
            .toLowerCase();

        if (!normalized) {
          return posts;
        }

        return posts.filter(
          (
            post
          ) => {
            const haystack =
              [
                post.title,
                post.body,
                post.profiles
                  ?.display_name,
                getPostLabel(
                  post
                ),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(
              normalized
            );
          }
        );
      },
      [
        posts,
        search,
      ]
    );


  const toggleFrontPage =
    async (
      post: PostRecord,
    ) => {
      const nextPinned =
        !post.front_page_pinned;

      if (
        nextPinned &&
        frontPagePosts.length >=
          FRONT_PAGE_LIMIT
      ) {
        setError(
          "The front page already has three posts. Remove one before posting another."
        );

        return;
      }

      try {
        setWorkingId(
          post.id
        );

        setError(null);

        if (nextPinned) {
          await setFrontPageVisibility(
            post.id,
            true
          );
        }

        await setFrontPagePin(
          post.id,
          nextPinned
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not update front-page placement."
        );
      } finally {
        setWorkingId(null);
      }
    };


  const handleEdited =
    (
      updated:
        PostRecord
    ) => {
      setPosts(
        (
          current
        ) =>
          current.map(
            (
              post
            ) =>
              post.id ===
              updated.id
                ? updated
                : post
          )
      );

      setEditingPost(null);

      void load();
    };


  return (
    <>
      <section className="admin-panel admin-posts-panel">
        <header className="admin-panel-header admin-posts-header">
          <div>
            <span className="admin-eyebrow">
              CONTENT MANAGEMENT
            </span>

            <h2>
              Posts
            </h2>
          </div>

          <div className="admin-posts-header-actions">
            <div className="admin-front-page-count">
              <Pin size={13} />

              Front page

              <strong>
                {Math.min(
                  frontPagePosts.length,
                  FRONT_PAGE_LIMIT
                )}
                /
                {FRONT_PAGE_LIMIT}
              </strong>
            </div>

            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => {
                void load();
              }}
            >
              <RefreshCw size={14} />

              Refresh
            </button>
          </div>
        </header>

        <div className="admin-posts-toolbar">
          <label className="admin-post-search">
            <Search size={14} />

            <input
              value={search}
              onChange={(
                event
              ) => {
                setSearch(
                  event.target.value
                );
              }}
              placeholder="Search approved posts..."
            />
          </label>

          <span>
            Use “Post to front page” to choose the three square cards shown at the top of the site.
          </span>
        </div>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-empty">
            Loading posts...
          </div>
        ) : visiblePosts.length ===
          0 ? (
          <div className="admin-empty">
            No approved posts match this search.
          </div>
        ) : (
          <div className="admin-posts-list">
            {visiblePosts.map(
              (
                post
              ) => {
                const isFrontPage =
                  Boolean(
                    post.front_page_pinned
                  );

                const frontPageFull =
                  !isFrontPage &&
                  frontPagePosts.length >=
                    FRONT_PAGE_LIMIT;

                return (
                  <article
                    className={`admin-post-row ${
                      isFrontPage
                        ? "is-front-page"
                        : ""
                    }`}
                    key={
                      post.id
                    }
                  >
                    <div className="admin-post-preview">
                      {post.post_type ===
                        "youtube" &&
                      post.youtube_id ? (
                        <img
                          src={`https://img.youtube.com/vi/${post.youtube_id}/mqdefault.jpg`}
                          alt=""
                        />
                      ) : post.gif_preview_url ||
                        post.gif_url ? (
                        <img
                          src={
                            post.gif_preview_url ??
                            post.gif_url ??
                            ""
                          }
                          alt=""
                        />
                      ) : post.image_url ? (
                        <img
                          src={
                            post.image_url
                          }
                          alt=""
                        />
                      ) : (
                        <div className="admin-post-text-preview">
                          <FileText size={18} />
                        </div>
                      )}
                    </div>

                    <div className="admin-post-copy">
                      <div className="admin-post-meta">
                        <span>
                          <PostTypeIcon
                            post={
                              post
                            }
                          />

                          {getPostLabel(
                            post
                          )}
                        </span>

                        <span>
                          {formatDate(
                            post.created_at
                          )}
                        </span>

                        {isFrontPage && (
                          <span className="admin-front-page-badge">
                            <Pin size={11} />

                            Front page
                          </span>
                        )}
                      </div>

                      <h3>
                        {post.title ??
                          "Untitled post"}
                      </h3>

                      {post.body && (
                        <p>
                          {post.body}
                        </p>
                      )}

                      <span className="admin-post-author">
                        {post.profiles
                          ?.display_name ??
                          "UNFILTERED LOGS User"}
                      </span>
                    </div>

                    <div className="admin-post-actions">
                      {post.youtube_url && (
                        <a
                          className="admin-post-icon-action"
                          href={
                            post.youtube_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          title="Open YouTube"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}

                      <button
                        className="admin-post-edit-button"
                        type="button"
                        onClick={() => {
                          setEditingPost(
                            post
                          );
                        }}
                      >
                        <Pencil size={14} />

                        Edit
                      </button>

                      <button
                        className={`admin-front-page-button ${
                          isFrontPage
                            ? "active"
                            : ""
                        }`}
                        type="button"
                        disabled={
                          workingId ===
                            post.id ||
                          frontPageFull
                        }
                        title={
                          frontPageFull
                            ? "The front page already has three posts."
                            : undefined
                        }
                        onClick={() => {
                          void toggleFrontPage(
                            post
                          );
                        }}
                      >
                        <Pin size={14} />

                        {isFrontPage
                          ? "Remove from front page"
                          : frontPageFull
                            ? "Front page full"
                            : "Post to front page"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <EditPostDialog
        open={
          Boolean(
            editingPost
          )
        }
        post={
          editingPost
        }
        onClose={() => {
          setEditingPost(null);
        }}
        onSaved={
          handleEdited
        }
      />
    </>
  );
}
