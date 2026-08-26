import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";
import QuickPostDialog from "../../components/posts/QuickPostDialog";

import {
  getMyAccess,
} from "../../services/admin";

import {
  getBlogPostBySlug,
  getPublishedBlogPosts,
} from "../../services/blog";

import type {
  UserRole,
} from "../../types/admin";

import type {
  BlogPost,
} from "../../types/blog";

import "./Blog.css";


/* ==========================================================
   BLOG 001
   HELPERS
   ========================================================== */


function formatBlogDate(
  value:
    string | null,
) {
  if (!value) {
    return "Draft";
  }

  return new Date(
    value
  ).toLocaleDateString(
    undefined,
    {
      year:
        "numeric",

      month:
        "long",

      day:
        "numeric",
    }
  );
}


function formatBlogDateShort(
  value:
    string | null,
) {
  if (!value) {
    return "Draft";
  }

  return new Date(
    value
  ).toLocaleDateString(
    undefined,
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    }
  );
}


function archiveLabel(
  value:
    string | null,
) {
  if (!value) {
    return "Unpublished";
  }

  return new Date(
    value
  ).toLocaleDateString(
    undefined,
    {
      month:
        "long",

      year:
        "numeric",
    }
  );
}


/* ==========================================================
   BLOG 002
   INDEX SIDEBAR
   ========================================================== */


function EditorialSidebar({
  posts,
}: {
  posts:
    BlogPost[];
}) {
  const archives =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();

        for (
          const post
          of posts
        ) {
          const label =
            archiveLabel(
              post.published_at
            );

          counts.set(
            label,
            (
              counts.get(
                label
              ) ??
              0
            ) +
            1
          );
        }

        return Array.from(
          counts.entries()
        );
      },
      [
        posts,
      ]
    );


  return (
    <aside className="editorial-sidebar">
      <section className="editorial-side-box">
        <header>
          ABOUT EDITORIAL
        </header>

        <div className="editorial-side-copy">
          <p>
            Longer-form writing from
            UNFILTERED LOG.
          </p>

          <p>
            Product notes, internet
            culture, site updates,
            opinions, and whatever
            needed more room than a
            regular post.
          </p>
        </div>
      </section>

      <section className="editorial-side-box">
        <header>
          RECENT ARTICLES
        </header>

        <div className="editorial-recent-list">
          {posts
            .slice(
              0,
              6
            )
            .map(
              (
                post
              ) => (
                <a
                  href={`/blog/${post.slug}`}
                  key={
                    post.id
                  }
                >
                  <strong>
                    {post.title}
                  </strong>

                  <span>
                    {formatBlogDateShort(
                      post.published_at
                    )}
                  </span>
                </a>
              )
            )}
        </div>
      </section>

      <section className="editorial-side-box">
        <header>
          ARCHIVES
        </header>

        <div className="editorial-archive-list">
          {archives.map(
            (
              [
                label,
                count,
              ]
            ) => (
              <div
                key={
                  label
                }
              >
                <span>
                  {label}
                </span>

                <strong>
                  {count}
                </strong>
              </div>
            )
          )}
        </div>
      </section>
    </aside>
  );
}


/* ==========================================================
   BLOG 003
   BLOG INDEX
   ========================================================== */


function BlogIndex() {
  const [
    posts,
    setPosts,
  ] =
    useState<BlogPost[]>(
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


  useEffect(() => {
    let mounted = true;

    void getPublishedBlogPosts()
      .then(
        (
          nextPosts
        ) => {
          if (mounted) {
            setPosts(
              nextPosts
            );
          }
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (mounted) {
            setError(
              nextError
                instanceof Error
                ? nextError.message
                : "UNFILTERED LOG Editorial could not load."
            );
          }
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
  }, []);


  return (
    <>
      <section className="blog-page-heading">
        <div>
          <span>
            UNFILTERED LOG
          </span>

          <h1>
            Editorial
          </h1>

          <p>
            Longer posts, site notes,
            opinions, and other things
            that needed more than a
            few lines.
          </p>
        </div>

        <BookOpen
          size={22}
        />
      </section>

      {error && (
        <div className="blog-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="blog-loading">
          Loading Editorial...
        </div>
      ) : posts.length ===
        0 ? (
        <div className="blog-empty">
          Nothing published yet.
        </div>
      ) : (
        <div className="editorial-layout">
          <main className="editorial-stream">
            {posts.map(
              (
                post
              ) => (
                <article
                  className={
                    post.is_highlighted
                      ? "editorial-post featured"
                      : "editorial-post"
                  }
                  key={
                    post.id
                  }
                >
                  <header className="editorial-post-header">
                    <div>
                      <span className="editorial-post-label">
                        {post.is_highlighted
                          ? "FEATURED EDITORIAL"
                          : "EDITORIAL"}
                      </span>

                      <h2>
                        <a
                          href={`/blog/${post.slug}`}
                        >
                          {post.title}
                        </a>
                      </h2>
                    </div>

                    <time>
                      {formatBlogDateShort(
                        post.published_at
                      )}
                    </time>
                  </header>

                  {post.hero_image_url && (
                    <a
                      className="editorial-post-image"
                      href={`/blog/${post.slug}`}
                    >
                      <img
                        src={
                          post.hero_image_url
                        }
                        alt=""
                      />
                    </a>
                  )}

                  <div className="editorial-post-copy">
                    {post.excerpt ? (
                      <p>
                        {post.excerpt}
                      </p>
                    ) : (
                      <p>
                        {post.body.slice(
                          0,
                          360
                        )}
                        {post.body.length >
                          360
                          ? "..."
                          : ""}
                      </p>
                    )}
                  </div>

                  <footer className="editorial-post-footer">
                    <span>
                      <Clock3
                        size={10}
                      />

                      {formatBlogDate(
                        post.published_at
                      )}
                    </span>

                    <a
                      href={`/blog/${post.slug}`}
                    >
                      Read full article
                      <ArrowRight
                        size={10}
                      />
                    </a>
                  </footer>
                </article>
              )
            )}
          </main>

          <EditorialSidebar
            posts={
              posts
            }
          />
        </div>
      )}
    </>
  );
}


/* ==========================================================
   BLOG 004
   ARTICLE
   ========================================================== */


function BlogArticle({
  slug,
}: {
  slug: string;
}) {
  const [
    post,
    setPost,
  ] =
    useState<BlogPost | null>(
      null
    );

  const [
    recentPosts,
    setRecentPosts,
  ] =
    useState<BlogPost[]>(
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


  useEffect(() => {
    let mounted = true;

    void Promise.all([
      getBlogPostBySlug(
        slug
      ),

      getPublishedBlogPosts(),
    ])
      .then(
        (
          [
            nextPost,
            nextPosts,
          ]
        ) => {
          if (!mounted) {
            return;
          }

          setPost(
            nextPost
          );

          setRecentPosts(
            nextPosts
          );
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (mounted) {
            setError(
              nextError
                instanceof Error
                ? nextError.message
                : "Could not load the Editorial article."
            );
          }
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
    slug,
  ]);


  if (loading) {
    return (
      <div className="blog-loading">
        Loading article...
      </div>
    );
  }


  if (!post) {
    return (
      <div className="blog-empty">
        <strong>
          Article not found.
        </strong>

        <a href="/blog">
          Back to Editorial
        </a>
      </div>
    );
  }


  return (
    <>
      <div className="blog-article-tools">
        <a
          className="blog-back"
          href="/blog"
        >
          <ArrowLeft
            size={11}
          />

          Back to Editorial
        </a>
      </div>

      <div className="editorial-layout article-layout">
        <main className="blog-article">
          <article className="blog-article-card">
            <header className="blog-article-header">
              <span>
                {post.is_highlighted
                  ? "FEATURED EDITORIAL"
                  : "UNFILTERED LOG EDITORIAL"}
              </span>

              <h1>
                {post.title}
              </h1>

              <div className="blog-article-meta">
                <CalendarDays
                  size={11}
                />

                <time>
                  {formatBlogDate(
                    post.published_at
                  )}
                </time>
              </div>
            </header>

            {post.hero_image_url && (
              <div className="blog-article-image">
                <img
                  src={
                    post.hero_image_url
                  }
                  alt=""
                />
              </div>
            )}

            {post.excerpt && (
              <div className="blog-article-deck">
                {post.excerpt}
              </div>
            )}

            {error && (
              <div className="blog-error">
                {error}
              </div>
            )}

            <div className="blog-article-body">
              {post.body}
            </div>
          </article>
        </main>

        <EditorialSidebar
          posts={
            recentPosts
          }
        />
      </div>
    </>
  );
}


/* ==========================================================
   BLOG 005
   PAGE / AUTH / SHARED HEADER
   ========================================================== */


export default function Blog() {
  const [
    session,
    setSession,
  ] =
    useState<Session | null>(
      null
    );

  const [
    authReady,
    setAuthReady,
  ] =
    useState(false);

  const [
    accessRole,
    setAccessRole,
  ] =
    useState<UserRole | null>(
      null
    );

  const [
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);


  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(
        ({
          data,
        }) => {
          if (!mounted) {
            return;
          }

          setSession(
            data.session
          );

          setAuthReady(
            true
          );
        }
      );

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            nextSession
          ) => {
            if (!mounted) {
              return;
            }

            setSession(
              nextSession
            );

            setAuthReady(
              true
            );
          }
        );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    if (!session) {
      setAccessRole(
        null
      );

      return () => {
        mounted = false;
      };
    }

    void getMyAccess()
      .then(
        (
          access
        ) => {
          if (mounted) {
            setAccessRole(
              access?.role ??
              null
            );
          }
        }
      )
      .catch(
        () => {
          if (mounted) {
            setAccessRole(
              null
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    session,
  ]);


  const openQuickPost =
    () => {
      if (!session) {
        window.location.assign(
          `/login?returnTo=${encodeURIComponent(
            window.location.pathname
          )}`
        );

        return;
      }

      setPostDialogOpen(
        true
      );
    };


  const signOut =
    async () => {
      await supabase.auth
        .signOut();

      window.location.assign(
        "/"
      );
    };


  const path =
    window.location.pathname;

  const articleMatch =
    path.match(
      /^\/blog\/([^/]+)\/?$/
    );


  return (
    <div className="classic-site blog-page">
      <SiteHeader
        session={
          session
        }
        authReady={
          authReady
        }
        accessRole={
          accessRole
        }
        activeSection="blog"
        onPost={
          openQuickPost
        }
        onSignOut={() => {
          void signOut();
        }}
      />

      <main className="site-width blog-shell">
        {articleMatch ? (
          <BlogArticle
            slug={
              decodeURIComponent(
                articleMatch[1]
              )
            }
          />
        ) : (
          <BlogIndex />
        )}
      </main>

      <QuickPostDialog
        open={
          postDialogOpen
        }
        onClose={() => {
          setPostDialogOpen(
            false
          );
        }}
        onPosted={() => {
          setPostDialogOpen(
            false
          );
        }}
      />

      <SiteFooter />
    </div>
  );
}
