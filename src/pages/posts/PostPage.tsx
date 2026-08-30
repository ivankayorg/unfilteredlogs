import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import SiteHeader from "../../components/layout/SiteHeader";
import PostComments from "../../components/posts/PostComments";
import PostImageGallery from "../../components/posts/PostImageGallery";
import { supabase } from "../../lib/supabase";
import { getMyAccess } from "../../services/admin";
import { togglePostLike } from "../../services/engagement";
import { getPostById } from "../../services/posts";
import type { UserRole } from "../../types/admin";
import type { PostRecord } from "../../types/post";
import "./PostPage.css";

function postIdFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[1] ?? "";
}

export default function PostPage() {
  const [post, setPost] = useState<PostRecord | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accessRole, setAccessRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session) {
        try {
          const access = await getMyAccess();
          if (mounted) setAccessRole(access?.role ?? null);
        } catch {}
      }
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) {
          setSession(nextSession);
          setAuthReady(true);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const postId = postIdFromPath();

    if (!postId) {
      setError("Post not found.");
      setLoading(false);
      return;
    }

    void getPostById(postId)
      .then((record) => {
        if (!mounted) return;
        if (!record) setError("Post not found.");
        else setPost(record);
      })
      .catch((nextError) => {
        if (mounted) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Could not load post."
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  const toggleLike = async () => {
    if (!post) return;

    if (!session) {
      window.location.assign(
        `/login?returnTo=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    const nextLiked = await togglePostLike(
      post.id,
      Boolean(post.liked_by_me)
    );

    setPost({
      ...post,
      liked_by_me: nextLiked,
      like_count: Math.max(
        0,
        (post.like_count ?? 0) + (nextLiked ? 1 : -1)
      ),
    });
  };

  const isStaff = accessRole === "moderator" || accessRole === "admin";

  return (
    <div className="classic-site post-page-shell">
      <SiteHeader
        session={session}
        authReady={authReady}
        accessRole={accessRole}
        activeSection="home"
        onPost={() => {
          if (!session) {
            window.location.assign(
              `/login?returnTo=${encodeURIComponent(window.location.pathname)}`
            );
            return;
          }
          window.location.assign("/");
        }}
        onSignOut={() => void signOut()}
      />

      <main className="site-width post-page-main">
        <div className="post-page-breadcrumbs">
          <a href="/">Posts</a><span>›</span><span>Post</span>
        </div>

        {loading && (
          <section className="post-page-card post-page-message">
            Loading post...
          </section>
        )}

        {!loading && error && (
          <section className="post-page-card post-page-message">
            <h1>Could not open this post.</h1>
            <p>{error}</p>
            <a href="/">Back to posts »</a>
          </section>
        )}

        {!loading && post && (
          <>
            <article className="post-page-card">
              <header className="post-page-titlebar">
                <span
                  className={`type-badge type-${
                    post.post_type === "youtube"
                      ? "video"
                      : post.post_type
                  }`}
                >
                  {post.post_type.toUpperCase()}
                </span>
                <h1>{post.title || "Untitled post"}</h1>
              </header>

              <div className="post-page-byline">
                <strong>{post.profiles?.display_name || "UNFILTERED LOGS User"}</strong>
                <span>{new Date(post.created_at).toLocaleString()}</span>
                {post.category && <span>{post.category.name}</span>}
              </div>

              {post.post_type === "youtube" && post.youtube_id && (
                <div className="post-page-media">
                  <iframe
                    src={`https://www.youtube.com/embed/${post.youtube_id}`}
                    title={post.title || "YouTube video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}

              {post.post_type === "image" && post.image_url && (
                <div className="post-page-media post-page-image-gallery">
                  <PostImageGallery
                    images={
                      post.images?.length
                        ? post.images
                        : [{
                            id: `legacy-${post.id}`,
                            post_id: post.id,
                            image_url: post.image_url,
                            storage_path: null,
                            position: 0,
                          }]
                    }
                    title={post.title ?? "Image post"}
                  />
                </div>
              )}

              {post.body && <div className="post-page-body">{post.body}</div>}

              {post.gif_url && (
                <div className="post-page-media post-page-gif">
                  <img src={post.gif_url} alt="Attached GIF" />
                </div>
              )}

              {(post.category || (post.tags && post.tags.length > 0)) && (
                <div className="post-page-tags">
                  <span>Filed under:</span>
                  {post.category && <span>{post.category.name}</span>}
                  {post.tags?.map((tag) => (
                    <span key={tag.id}>#{tag.name}</span>
                  ))}
                </div>
              )}

              <footer className="post-page-actions">
                <button
                  className={post.liked_by_me ? "reacted" : ""}
                  type="button"
                  onClick={() => void toggleLike()}
                >
                  ♥ {post.like_count ?? 0}
                </button>

                <span>💬 {post.comment_count ?? 0} comments</span>

                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(window.location.href);
                  }}
                >
                  Copy permalink
                </button>
              </footer>
            </article>

            <section className="post-page-comments">
              <PostComments
                postId={post.id}
                session={session}
                onCountChanged={(count) => {
                  setPost((current) =>
                    current ? { ...current, comment_count: count } : current
                  );
                }}
                isStaff={isStaff}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
