import {
  useEffect,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  Flag,
  Images,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  createPostComment,
  deletePostComment,
  getPostComments,
  reportPostComment,
} from "../../services/comments";

import type {
  GiphyGif,
} from "../../services/giphy";

import type {
  CommentRecord,
} from "../../types/comment";

import GiphyPicker from "./GiphyPicker";

import "./PostComments.css";


/* ==========================================================
   UNFILTERED LOGS
   INLINE POST COMMENTS
   Text + Optional GIF
   ========================================================== */


type Props = {
  postId: string;

  session:
    Session | null;

  onCountChanged: (
    count: number,
  ) => void;

  isStaff: boolean;
};


function formatCommentDate(
  value: string,
) {
  return new Date(
    value
  ).toLocaleString(
    undefined,
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    }
  );
}


export default function PostComments({
  postId,
  session,
  onCountChanged,
  isStaff,
}: Props) {
  const [
    comments,
    setComments,
  ] =
    useState<CommentRecord[]>(
      []
    );

  const [
    body,
    setBody,
  ] =
    useState("");

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
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    flaggedComments,
    setFlaggedComments,
  ] =
    useState<Set<string>>(
      new Set()
    );


  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    void getPostComments(
      postId
    )
      .then(
        (
          records
        ) => {
          if (!mounted) {
            return;
          }

          setComments(
            records
          );

          onCountChanged(
            records.length
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

          setError(
            nextError
              instanceof Error
              ? nextError.message
              : "Could not load comments."
          );
        }
      )
      .finally(
        () => {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    postId,
  ]);


  const submit =
    async () => {
      setSaving(true);
      setError(null);

      try {
        const created =
          await createPostComment(
            postId,
            body,
            selectedGif
          );

        const next = [
          ...comments,
          created,
        ];

        setComments(
          next
        );

        setBody("");
        setSelectedGif(
          null
        );
        setGifOpen(
          false
        );

        onCountChanged(
          next.length
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not post comment."
        );
      } finally {
        setSaving(false);
      }
    };


  const remove =
    async (
      commentId:
        string
    ) => {
      try {
        await deletePostComment(
          commentId
        );

        const next =
          comments.filter(
            (
              comment
            ) =>
              comment.id !==
              commentId
          );

        setComments(
          next
        );

        onCountChanged(
          next.length
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not delete comment."
        );
      }
    };


  const report =
    async (
      commentId:
        string
    ) => {
      setError(null);

      try {
        await reportPostComment(
          commentId
        );

        setFlaggedComments(
          (
            current
          ) => {
            const next =
              new Set(
                current
              );

            next.add(
              commentId
            );

            return next;
          }
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not report comment."
        );
      }
    };


  return (
    <section className="post-comments">
      <header className="post-comments-heading">
        <strong>
          Comments
        </strong>

        <span>
          {comments.length}
        </span>
      </header>

      {loading ? (
        <div className="post-comments-empty">
          Loading comments...
        </div>
      ) : comments.length ===
        0 ? (
        <div className="post-comments-empty">
          Nobody has said anything yet. Suspicious.
        </div>
      ) : (
        <div className="post-comment-list">
          {comments.map(
            (
              comment
            ) => {
              const author =
                comment.profile
                  ?.username ??
                comment.profile
                  ?.display_name ??
                "UNFILTERED LOGS User";

              const avatar =
                author
                  .trim()
                  .charAt(0)
                  .toUpperCase() ||
                "R";

              const isMine =
                session?.user.id ===
                comment.user_id;

              return (
                <article
                  className="post-comment"
                  key={
                    comment.id
                  }
                >
                  <div className="post-comment-avatar">
                    {avatar}
                  </div>

                  <div className="post-comment-copy">
                    <div className="post-comment-meta">
                      <strong>
                        {comment.profile
                          ?.username
                          ? `@${author}`
                          : author}
                      </strong>

                      <span>
                        {formatCommentDate(
                          comment.created_at
                        )}
                      </span>
                    </div>

                    {comment.body && (
                      <p>
                        {comment.body}
                      </p>
                    )}

                    {comment.gif_url && (
                      <div className="post-comment-gif">
                        <img
                          src={
                            comment.gif_url
                          }
                          alt="Comment GIF"
                          loading="lazy"
                        />

                        <small>
                          GIF
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="post-comment-actions">
                    {(isMine ||
                      isStaff) && (
                      <button
                        className="post-comment-delete"
                        type="button"
                        aria-label="Delete comment"
                        title={
                          isStaff &&
                          !isMine
                            ? "Delete as moderator"
                            : "Delete comment"
                        }
                        onClick={() => {
                          void remove(
                            comment.id
                          );
                        }}
                      >
                        <Trash2
                          size={13}
                        />

                        <span>
                          Delete
                        </span>
                      </button>
                    )}

                    {session &&
                      !isMine && (
                      <button
                        className={
                          flaggedComments.has(
                            comment.id
                          )
                            ? "post-comment-report reported"
                            : "post-comment-report"
                        }
                        type="button"
                        disabled={
                          flaggedComments.has(
                            comment.id
                          )
                        }
                        onClick={() => {
                          void report(
                            comment.id
                          );
                        }}
                      >
                        <Flag
                          size={13}
                        />

                        <span>
                          {flaggedComments.has(
                            comment.id
                          )
                            ? "Flagged"
                            : "Report"}
                        </span>
                      </button>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {error && (
        <div className="post-comments-error">
          {error}
        </div>
      )}

      {session ? (
        <div className="post-comment-form">
          <textarea
            value={body}
            maxLength={500}
            onChange={
              (
                event
              ) => {
                setBody(
                  event.target
                    .value
                );
              }
            }
            placeholder="Add a comment..."
          />

          {selectedGif && (
            <div className="post-comment-selected-gif">
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
                  size={13}
                />

                Remove
              </button>
            </div>
          )}

          {gifOpen && (
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
          )}

          <div className="post-comment-form-footer">
            <div>
              <button
                className="post-comment-gif-button"
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
                <Images
                  size={14}
                />

                {selectedGif
                  ? "Change GIF"
                  : "GIF"}
              </button>

              <span>
                {body.length}/500
              </span>
            </div>

            <button
              className="post-comment-submit"
              type="button"
              disabled={
                saving ||
                (
                  !body.trim() &&
                  !selectedGif
                )
              }
              onClick={() => {
                void submit();
              }}
            >
              <Send
                size={14}
              />

              {saving
                ? "Posting..."
                : "Comment"}
            </button>
          </div>
        </div>
      ) : (
        <a
          className="post-comment-signin"
          href="/login"
        >
          Sign in to comment
        </a>
      )}
    </section>
  );
}
