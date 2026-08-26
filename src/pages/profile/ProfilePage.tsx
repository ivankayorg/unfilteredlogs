import {
  useEffect,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  Copy,
  Edit3,
  Link,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";

import SiteFooter from "../../components/layout/SiteFooter";

import SiteHeader from "../../components/layout/SiteHeader";

import QuickPostDialog from "../../components/posts/QuickPostDialog";

import {
  supabase,
} from "../../lib/supabase";

import {
  getMyAccess,
} from "../../services/admin";

import {
  createProfileShoutboxMessage,
  deleteProfileShoutboxMessage,
  getProfileMicrologPost,
  getProfileMicrologPosts,
  getProfileShoutboxMessages,
  getPublicProfile,
} from "../../services/profile";

import type {
  UserRole,
} from "../../types/admin";

import type {
  ProfileMicrologPost,
  ProfileShoutboxAuthor,
  ProfileShoutboxMessage,
  UserPublicProfile,
} from "../../types/profile";

import "./ProfilePage.css";


/* ==========================================================
   UNFILTEREDLOG
   PUBLIC USER PAGE + PERSONAL POST PERMALINK
   /u/:username
   /u/:username/status/:id
   ========================================================== */


function pathParts() {
  return window.location.pathname
    .split("/")
    .filter(Boolean);
}


function profileUsernameFromPath() {
  return decodeURIComponent(
    pathParts()[1] ??
    ""
  );
}


function statusIdFromPath() {
  const parts =
    pathParts();

  if (
    parts[2] !==
    "status"
  ) {
    return null;
  }

  return parts[3] ??
    null;
}


function formatDate(
  value:
    string,
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


function avatarLetters(
  profile:
    UserPublicProfile,
) {
  return (
    profile.username
      .slice(
        0,
        2
      )
      .toUpperCase() ||
    "UL"
  );
}


function shoutboxAuthorLetters(
  author:
    ProfileShoutboxAuthor | null,
) {
  return (
    author?.username
      .slice(
        0,
        2
      )
      .toUpperCase() ||
    "UL"
  );
}


export default function ProfilePage() {
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
    profile,
    setProfile,
  ] =
    useState<UserPublicProfile | null>(
      null
    );

  const [
    posts,
    setPosts,
  ] =
    useState<
      ProfileMicrologPost[]
    >(
      []
    );

  const [
    shoutboxMessages,
    setShoutboxMessages,
  ] =
    useState<
      ProfileShoutboxMessage[]
    >(
      []
    );

  const [
    shoutboxBody,
    setShoutboxBody,
  ] =
    useState("");

  const [
    shoutboxPosting,
    setShoutboxPosting,
  ] =
    useState(false);

  const [
    shoutboxError,
    setShoutboxError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    status,
    setStatus,
  ] =
    useState<ProfileMicrologPost | null>(
      null
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
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    quickPostOpen,
    setQuickPostOpen,
  ] =
    useState(false);

  const username =
    profileUsernameFromPath();

  const statusId =
    statusIdFromPath();


  useEffect(
    () => {
      let mounted =
        true;

      void supabase.auth
        .getSession()
        .then(
          async (
            {
              data,
            }
          ) => {
            if (
              !mounted
            ) {
              return;
            }

            setSession(
              data.session
            );

            setAuthReady(
              true
            );

            if (
              data.session
            ) {
              try {
                const access =
                  await getMyAccess();

                if (
                  mounted
                ) {
                  setAccessRole(
                    access?.role ??
                    null
                  );
                }
              } catch {
                // Public profile still works if role lookup fails.
              }
            }
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
              if (
                mounted
              ) {
                setSession(
                  nextSession
                );

                setAuthReady(
                  true
                );
              }
            }
          );

      return () => {
        mounted =
          false;

        subscription
          .unsubscribe();
      };
    },
    []
  );


  useEffect(
    () => {
      let mounted =
        true;

      setLoading(
        true
      );

      setError(
        null
      );

      void getPublicProfile(
        username
      )
        .then(
          async (
            nextProfile
          ) => {
            if (
              !mounted
            ) {
              return;
            }

            if (
              !nextProfile
            ) {
              setError(
                "User page not found."
              );

              return;
            }

            setProfile(
              nextProfile
            );

            if (
              statusId
            ) {
              const nextStatus =
                await getProfileMicrologPost(
                  statusId
                );

              if (
                !mounted
              ) {
                return;
              }

              if (
                !nextStatus ||
                nextStatus.user_id !==
                  nextProfile.id
              ) {
                setError(
                  "Personal post not found."
                );

                return;
              }

              setStatus(
                nextStatus
              );

              return;
            }

            const [
              nextPosts,
              nextShoutboxMessages,
            ] =
              await Promise.all([
                getProfileMicrologPosts(
                  nextProfile.id
                ),

                getProfileShoutboxMessages(
                  nextProfile.id
                ),
              ]);

            if (
              mounted
            ) {
              setPosts(
                nextPosts
              );

              setShoutboxMessages(
                nextShoutboxMessages
              );
            }
          }
        )
        .catch(
          (
            nextError
          ) => {
            if (
              mounted
            ) {
              setError(
                nextError instanceof
                  Error
                  ? nextError.message
                  : "Could not load this user page."
              );
            }
          }
        )
        .finally(
          () => {
            if (
              mounted
            ) {
              setLoading(
                false
              );
            }
          }
        );

      return () => {
        mounted =
          false;
      };
    },
    [
      username,
      statusId,
    ]
  );


  const signOut =
    async () => {
      await supabase.auth
        .signOut();

      window.location
        .assign(
          "/"
        );
    };


  const copyCurrentUrl =
    async () => {
      try {
        await navigator
          .clipboard
          .writeText(
            window.location.href
          );

        setCopied(
          true
        );

        window.setTimeout(
          () => {
            setCopied(
              false
            );
          },
          1400
        );
      } catch {
        // Nothing else to do.
      }
    };


  const isOwner =
    Boolean(
      session &&
      profile &&
      session.user.id ===
        profile.id
    );


  const submitShoutboxMessage =
    async () => {
      if (
        !session
      ) {
        window.location.assign(
          `/login?returnTo=${encodeURIComponent(window.location.pathname)}`
        );

        return;
      }

      if (!profile) {
        return;
      }

      setShoutboxPosting(
        true
      );

      setShoutboxError(
        null
      );

      try {
        const created =
          await createProfileShoutboxMessage(
            profile.id,
            shoutboxBody
          );

        setShoutboxMessages(
          (
            current
          ) => [
            created,
            ...current,
          ].slice(
            0,
            40
          )
        );

        setShoutboxBody(
          ""
        );
      } catch (
        nextError
      ) {
        setShoutboxError(
          nextError instanceof
            Error
            ? nextError.message
            : "Could not post to this shoutbox."
        );
      } finally {
        setShoutboxPosting(
          false
        );
      }
    };


  const removeShoutboxMessage =
    async (
      message:
        ProfileShoutboxMessage,
    ) => {
      if (!session) {
        return;
      }

      const allowed =
        session.user.id ===
          message.author_user_id ||
        session.user.id ===
          message.target_user_id ||
        accessRole ===
          "moderator" ||
        accessRole ===
          "admin";

      if (!allowed) {
        return;
      }

      setShoutboxError(
        null
      );

      try {
        await deleteProfileShoutboxMessage(
          message.id
        );

        setShoutboxMessages(
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                message.id
            )
        );
      } catch (
        nextError
      ) {
        setShoutboxError(
          nextError instanceof
            Error
            ? nextError.message
            : "Could not remove that shout."
        );
      }
    };


  return (
    <div
      className={
        `classic-site profile-page-shell${statusId ? " single-status-shell" : ""}`
      }
    >
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
        activeSection="home"
        onPost={() => {
          if (
            !session
          ) {
            window.location.assign(
              `/login?returnTo=${encodeURIComponent(window.location.pathname)}`
            );

            return;
          }

          setQuickPostOpen(
            true
          );
        }}
        onSignOut={() => {
          void signOut();
        }}
      />

      <main
        className={
          `site-width profile-page-main${statusId ? " single-status-main" : " public-user-main"}`
        }
      >
        {loading && (
          <section className="profile-system-message">
            Loading user page...
          </section>
        )}

        {!loading &&
          error && (
          <section className="profile-system-message error">
            <h1>
              Nothing here.
            </h1>

            <p>
              {error}
            </p>

            <a href="/">
              Back to Posts »
            </a>
          </section>
        )}

        {!loading &&
          profile &&
          !error &&
          status && (
          <section className="single-microlog-page">
            <div className="single-microlog-window">
              <div className="single-microlog-workspace">
                <article className="single-microlog-note">
                  <div className="single-microlog-author">
                    <div className="profile-avatar small">
                      {profile.avatar_url ? (
                        <img
                          src={
                            profile.avatar_url
                          }
                          alt=""
                        />
                      ) : (
                        <span>
                          {avatarLetters(
                            profile
                          )}
                        </span>
                      )}
                    </div>

                    <div>
                      <strong>
                        @{profile.username}
                      </strong>

                      <span>
                        {formatDate(
                          status.created_at
                        )}
                      </span>
                    </div>
                  </div>

                  <p>
                    {status.body}
                  </p>

                  <footer>
                    <span>
                      permanent personal post
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        void copyCurrentUrl();
                      }}
                    >
                      <Copy
                        size={11}
                      />

                      {copied
                        ? "copied"
                        : "copy permalink"}
                    </button>
                  </footer>
                </article>

                <div className="single-microlog-help">
                  <b>
                    SLOP PERMALINK
                  </b>

                  <span>
                    A permanent little piece of somebody’s internet.
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {!loading &&
          profile &&
          !error &&
          !statusId && (
          <div className="public-profile-layout">
            <section className="public-profile-card">
              <div className="profile-avatar">
                {profile.avatar_url ? (
                  <img
                    src={
                      profile.avatar_url
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    {avatarLetters(
                      profile
                    )}
                  </span>
                )}
              </div>

              <div className="public-profile-copy">
                <span className="public-profile-kicker">
                  MEMBER PAGE
                </span>

                <h1>
                  @{profile.username}
                </h1>

                <p>
                  {profile.display_name}
                </p>

                <div className="public-profile-meta">
                  <span>
                    {posts.length} {posts.length === 1 ? "blob of slop" : "blobs of slop"}
                  </span>

                  <span>
                    {shoutboxMessages.length} {shoutboxMessages.length === 1 ? "shout" : "shouts"}
                  </span>

                  <span>
                    /u/{profile.username}
                  </span>
                </div>
              </div>

              <div className="public-profile-actions">
                {isOwner && (
                  <a href="/account">
                    <Edit3
                      size={13}
                    />

                    Edit my page
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    void copyCurrentUrl();
                  }}
                >
                  <Copy
                    size={13}
                  />

                  {copied
                    ? "Copied"
                    : "Copy page"}
                </button>
              </div>
            </section>

            <div className="public-profile-content">
              <section className="public-microlog">
                <header className="public-microlog-heading">
                  <strong>
                    @{profile.username}'S THOUGHT SLOP
                  </strong>

                  <span>
                    newest first
                  </span>
                </header>

                <div className="public-microlog-stream">
                  {posts.length ===
                    0 && (
                    <div className="public-microlog-empty">
                      No slop yet. Suspiciously well-adjusted.
                    </div>
                  )}

                  {posts.map(
                    (
                      post
                    ) => (
                      <article
                        className="public-microlog-row"
                        key={
                          post.id
                        }
                      >
                        <div className="profile-avatar tiny">
                          {profile.avatar_url ? (
                            <img
                              src={
                                profile.avatar_url
                              }
                              alt=""
                            />
                          ) : (
                            <span>
                              {avatarLetters(
                                profile
                              )}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="public-microlog-row-head">
                            <strong>
                              @{profile.username}
                            </strong>

                            <span>
                              {formatDate(
                                post.created_at
                              )}
                            </span>
                          </div>

                          <p>
                            {post.body}
                          </p>

                          <footer>
                            <a
                              href={`/u/${profile.username}/status/${post.id}`}
                            >
                              <Link
                                size={11}
                              />

                              slop permalink
                            </a>
                          </footer>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>

              <section className="profile-shoutbox">
                <header className="profile-shoutbox-heading">
                  <div>
                    <MessageSquare
                      size={15}
                    />

                    <strong>
                      @{profile.username}'S SHOUTBOX
                    </strong>
                  </div>

                  <span>
                    say something
                  </span>
                </header>

                <div className="profile-shoutbox-messages">
                  {shoutboxMessages.length ===
                    0 && (
                    <div className="profile-shoutbox-empty">
                      Nobody has yelled at @{profile.username} yet.
                    </div>
                  )}

                  {shoutboxMessages.map(
                    (
                      message
                    ) => {
                      const canDelete =
                        Boolean(
                          session &&
                          (
                            session.user.id ===
                              message.author_user_id ||
                            isOwner ||
                            accessRole ===
                              "moderator" ||
                            accessRole ===
                              "admin"
                          )
                        );

                      return (
                        <article
                          className="profile-shoutbox-message"
                          key={
                            message.id
                          }
                        >
                          <a
                            className="profile-shoutbox-avatar"
                            href={
                              message.author
                                ? `/u/${message.author.username}`
                                : "#"
                            }
                          >
                            {message.author
                              ?.avatar_url ? (
                              <img
                                src={
                                  message.author.avatar_url
                                }
                                alt=""
                              />
                            ) : (
                              <span>
                                {shoutboxAuthorLetters(
                                  message.author
                                )}
                              </span>
                            )}
                          </a>

                          <div>
                            <header>
                              {message.author ? (
                                <a
                                  href={`/u/${message.author.username}`}
                                >
                                  @{message.author.username}
                                </a>
                              ) : (
                                <strong>
                                  unknown user
                                </strong>
                              )}

                              <time>
                                {formatDate(
                                  message.created_at
                                )}
                              </time>
                            </header>

                            <p>
                              {message.body}
                            </p>

                            {canDelete && (
                              <button
                                className="profile-shoutbox-delete"
                                type="button"
                                onClick={() => {
                                  void removeShoutboxMessage(
                                    message
                                  );
                                }}
                              >
                                <Trash2
                                  size={10}
                                />

                                remove
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>

                <footer className="profile-shoutbox-composer">
                  {session ? (
                    <>
                      <label>
                        <span>
                          SHOUT AT @{profile.username}
                        </span>

                        <textarea
                          value={
                            shoutboxBody
                          }
                          maxLength={280}
                          placeholder={`Leave something on @${profile.username}'s page...`}
                          onChange={
                            (
                              event
                            ) => {
                              setShoutboxBody(
                                event.target.value
                              );

                              setShoutboxError(
                                null
                              );
                            }
                          }
                        />
                      </label>

                      <div className="profile-shoutbox-composer-actions">
                        <span>
                          {shoutboxBody.length}/280
                        </span>

                        <button
                          type="button"
                          disabled={
                            shoutboxPosting ||
                            !shoutboxBody.trim()
                          }
                          onClick={() => {
                            void submitShoutboxMessage();
                          }}
                        >
                          <Send
                            size={12}
                          />

                          {shoutboxPosting
                            ? "Shouting..."
                            : "Post shout"}
                        </button>
                      </div>

                      {shoutboxError && (
                        <div className="profile-shoutbox-error">
                          {shoutboxError}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="profile-shoutbox-signin">
                      <strong>
                        WANT TO YELL SOMETHING?
                      </strong>

                      <span>
                        You can read this mess without an account, but only signed-in users can post.
                      </span>

                      <a
                        href={`/login?returnTo=${encodeURIComponent(window.location.pathname)}`}
                      >
                        Sign in to shout »
                      </a>
                    </div>
                  )}
                </footer>
              </section>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />

      <QuickPostDialog
        open={
          quickPostOpen
        }
        onClose={() => {
          setQuickPostOpen(
            false
          );
        }}
        onPosted={
          (
            post
          ) => {
            setQuickPostOpen(
              false
            );

            window.location.assign(
              `/posts/${post.id}`
            );
          }
        }
      />
    </div>
  );
}
