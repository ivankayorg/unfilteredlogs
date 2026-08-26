import {
  useEffect,
  useState,
} from "react";

import {
  Flag,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  getFlaggedComments,
} from "../../services/admin";

import {
  deletePostComment,
} from "../../services/comments";

import type {
  FlaggedComment,
} from "../../types/admin";


/* ==========================================================
   UNFILTERED LOGS ADMIN
   FLAGGED COMMENTS
   ========================================================== */


type Props = {
  limit?: number;
};


export default function FlaggedComments({
  limit,
}: Props) {
  const [
    comments,
    setComments,
  ] =
    useState<FlaggedComment[]>(
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
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(
      null
    );


  const load =
    async () => {
      setLoading(true);
      setError(null);

      try {
        setComments(
          await getFlaggedComments()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load flagged comments."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const remove =
    async (
      commentId:
        string
    ) => {
      setDeletingId(
        commentId
      );

      setError(null);

      try {
        await deletePostComment(
          commentId
        );

        setComments(
          (
            current
          ) =>
            current.filter(
              (
                comment
              ) =>
                comment.comment_id !==
                commentId
            )
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
      } finally {
        setDeletingId(
          null
        );
      }
    };


  const visible =
    typeof limit ===
      "number"
      ? comments.slice(
          0,
          limit
        )
      : comments;


  return (
    <section className="admin-panel admin-flagged-panel">
      <header className="admin-panel-header">
        <div>
          <span className="admin-eyebrow">
            COMMUNITY FLAGS
          </span>

          <h2>
            Flagged comments
          </h2>
        </div>

        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => {
            void load();
          }}
        >
          <RefreshCw
            size={14}
          />

          Refresh
        </button>
      </header>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          Loading flags...
        </div>
      ) : visible.length ===
        0 ? (
        <div className="admin-empty">
          No comments are flagged.
        </div>
      ) : (
        <div className="flagged-comment-list">
          {visible.map(
            (
              comment
            ) => {
              const author =
                comment.author_username
                  ? `@${comment.author_username}`
                  : comment.author_display_name;

              return (
                <article
                  className="flagged-comment-card"
                  key={
                    comment.comment_id
                  }
                >
                  <div className="flagged-comment-meta">
                    <span>
                      <Flag
                        size={12}
                      />

                      {comment.report_count ===
                        1
                        ? "1 flag"
                        : `${comment.report_count} flags`}
                    </span>

                    <span>
                      {author}
                    </span>

                    <span>
                      Last flagged{" "}
                      {new Date(
                        comment.last_reported_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  {comment.comment_body && (
                    <p>
                      {comment.comment_body}
                    </p>
                  )}

                  {comment.comment_gif_url && (
                    <div className="flagged-comment-gif">
                      <img
                        src={
                          comment.comment_gif_url
                        }
                        alt="Flagged comment GIF"
                      />
                    </div>
                  )}

                  <div className="flagged-comment-actions">
                    <a
                      href={`/#post-${comment.post_id}`}
                    >
                      Open post
                    </a>

                    <button
                      type="button"
                      disabled={
                        deletingId ===
                        comment.comment_id
                      }
                      onClick={() => {
                        void remove(
                          comment.comment_id
                        );
                      }}
                    >
                      <Trash2
                        size={14}
                      />

                      Delete comment
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}
