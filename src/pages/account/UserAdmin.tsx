import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  CalendarClock,
  Copy,
  ExternalLink,
  ImageUp,
  Link,
  Send,
  Trash2,
  UserRoundCog,
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
  createProfileMicrologPost,
  deleteProfileMicrologPost,
  getMyProfile,
  getProfileMicrologPosts,
  saveMyProfile,
  uploadMyProfileLogo,
} from "../../services/profile";

import type {
  UserRole,
} from "../../types/admin";

import type {
  ProfileMicrologPost,
  UserPublicProfile,
} from "../../types/profile";

import "./UserAdmin.css";


/* ==========================================================
   UNFILTEREDLOG
   USER CONTROL PANEL
   /account
   ========================================================== */


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



const USERNAME_CHANGE_COOLDOWN_MS =
  30 *
  24 *
  60 *
  60 *
  1000;


function usernameChangeWindow(
  profile:
    UserPublicProfile | null,
) {
  if (
    !profile?.username_changed_at
  ) {
    return {
      locked:
        false,

      nextChangeAt:
        null as Date | null,
    };
  }

  const changedAt =
    new Date(
      profile.username_changed_at
    );

  const nextChangeAt =
    new Date(
      changedAt.getTime() +
      USERNAME_CHANGE_COOLDOWN_MS
    );

  return {
    locked:
      nextChangeAt.getTime() >
      Date.now(),

    nextChangeAt,
  };
}


function formatUsernameChangeDate(
  value:
    Date | null,
) {
  if (!value) {
    return "";
  }

  return value.toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


export default function UserAdmin() {
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
    username,
    setUsername,
  ] =
    useState("");

  const [
    selectedLogo,
    setSelectedLogo,
  ] =
    useState<File | null>(
      null
    );

  const [
    selectedLogoPreview,
    setSelectedLogoPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    micrologPosts,
    setMicrologPosts,
  ] =
    useState<
      ProfileMicrologPost[]
    >(
      []
    );

  const [
    micrologBody,
    setMicrologBody,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingProfile,
    setSavingProfile,
  ] =
    useState(false);

  const [
    posting,
    setPosting,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    quickPostOpen,
    setQuickPostOpen,
  ] =
    useState(false);


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
              !data.session
            ) {
              window.location.assign(
                `/login?returnTo=${encodeURIComponent("/account")}`
              );

              return;
            }

            try {
              const [
                nextProfile,
                access,
              ] =
                await Promise.all([
                  getMyProfile(),
                  getMyAccess(),
                ]);

              if (
                !mounted
              ) {
                return;
              }

              setAccessRole(
                access?.role ??
                null
              );

              if (
                !nextProfile
              ) {
                setError(
                  "Your account exists, but its public profile record is missing."
                );

                setLoading(
                  false
                );

                return;
              }

              setProfile(
                nextProfile
              );

              setUsername(
                nextProfile.username
              );

              const posts =
                await getProfileMicrologPosts(
                  nextProfile.id
                );

              if (
                mounted
              ) {
                setMicrologPosts(
                  posts
                );
              }
            } catch (
              nextError
            ) {
              if (
                mounted
              ) {
                setError(
                  nextError instanceof
                    Error
                    ? nextError.message
                    : "Could not load your page."
                );
              }
            } finally {
              if (
                mounted
              ) {
                setLoading(
                  false
                );
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
      if (
        !selectedLogo
      ) {
        setSelectedLogoPreview(
          null
        );

        return;
      }

      const url =
        URL.createObjectURL(
          selectedLogo
        );

      setSelectedLogoPreview(
        url
      );

      return () => {
        URL.revokeObjectURL(
          url
        );
      };
    },
    [
      selectedLogo,
    ]
  );


  const publicPath =
    profile
      ? `/u/${profile.username}`
      : "";

  const publicUrl =
    useMemo(
      () =>
        publicPath
          ? `${window.location.origin}${publicPath}`
          : "",
      [
        publicPath,
      ]
    );


  const usernameWindow =
    useMemo(
      () =>
        usernameChangeWindow(
          profile
        ),
      [
        profile,
      ]
    );


  const usernameLocked =
    usernameWindow.locked;


  const usernameChanged =
    Boolean(
      profile &&
      username.trim() !==
        profile.username
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


  const saveProfile =
    async () => {
      if (
        !profile
      ) {
        return;
      }

      setSavingProfile(
        true
      );

      setError(
        null
      );

      setMessage(
        null
      );

      try {
        let nextAvatarUrl:
          string | null =
            null;

        if (
          selectedLogo
        ) {
          nextAvatarUrl =
            await uploadMyProfileLogo(
              selectedLogo
            );
        }

        const nextProfile =
          await saveMyProfile(
            username,
            nextAvatarUrl
          );

        setProfile(
          nextProfile
        );

        setUsername(
          nextProfile.username
        );

        setSelectedLogo(
          null
        );

        setMessage(
          "Profile saved."
        );
      } catch (
        nextError
      ) {
        setError(
          nextError instanceof
            Error
            ? nextError.message
            : "Could not save your profile."
        );
      } finally {
        setSavingProfile(
          false
        );
      }
    };


  const postMicrolog =
    async () => {
      if (
        posting
      ) {
        return;
      }

      setPosting(
        true
      );

      setError(
        null
      );

      try {
        const created =
          await createProfileMicrologPost(
            micrologBody
          );

        setMicrologPosts(
          (
            current
          ) => [
            created,
            ...current,
          ]
        );

        setMicrologBody(
          ""
        );
      } catch (
        nextError
      ) {
        setError(
          nextError instanceof
            Error
            ? nextError.message
            : "Could not post."
        );
      } finally {
        setPosting(
          false
        );
      }
    };


  const removeMicrolog =
    async (
      postId:
        string,
    ) => {
      if (
        !window.confirm(
          "Delete this slop?"
        )
      ) {
        return;
      }

      try {
        await deleteProfileMicrologPost(
          postId
        );

        setMicrologPosts(
          (
            current
          ) =>
            current.filter(
              (
                post
              ) =>
                post.id !==
                postId
            )
        );
      } catch (
        nextError
      ) {
        setError(
          nextError instanceof
            Error
            ? nextError.message
            : "Could not delete the post."
        );
      }
    };


  const copyText =
    async (
      value:
        string,
    ) => {
      try {
        await navigator
          .clipboard
          .writeText(
            value
          );

        setMessage(
          "Link copied."
        );
      } catch {
        setMessage(
          value
        );
      }
    };


  return (
    <div className="classic-site user-admin-page">
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
              `/login?returnTo=${encodeURIComponent("/account")}`
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

      <main className="site-width user-admin-main">
        <div className="user-admin-breadcrumbs">
          <a href="/">
            Posts
          </a>

          <span>
            ›
          </span>

          <strong>
            My Page
          </strong>
        </div>

        <section className="user-admin-heading">
          <div>
            <span>
              USER CONTROL PANEL
            </span>

            <h1>
              My Page
            </h1>

            <p>
              Your profile, your logo, your username, and your own little corner of the internet.
            </p>
          </div>

          <UserRoundCog
            size={26}
          />
        </section>

        {loading && (
          <div className="user-admin-message">
            Loading your page...
          </div>
        )}

        {!loading &&
          error && (
          <div className="user-admin-error">
            {error}
          </div>
        )}

        {!loading &&
          profile && (
          <div className="user-admin-columns">
            <section className="user-admin-panel profile-settings-panel">
              <header className="user-admin-panel-title">
                <strong>
                  PROFILE SETTINGS
                </strong>

                <span>
                  public identity
                </span>
              </header>

              <div className="profile-settings-layout">
                <div className="profile-logo-editor">
                  <div className="profile-logo-preview">
                    <img
                    className={
                      !selectedLogoPreview &&
                      !profile.avatar_url
                        ? "ul-avatar-fallback-image"
                        : undefined
                    }
                    src={
                      selectedLogoPreview ??
                      profile.avatar_url ??
                      "/ul-avatar-fallback.png"
                    }
                    alt=""
                    onError={
                      (
                        event
                      ) => {
                        const image =
                          event.currentTarget;

                        if (
                          image.dataset
                            .ulFallback ===
                          "true"
                        ) {
                          return;
                        }

                        image.dataset
                          .ulFallback =
                          "true";

                        image.classList
                          .add(
                            "ul-avatar-fallback-image"
                          );

                        image.src =
                          "/ul-avatar-fallback.png";
                      }
                    }
                  />
                  </div>

                  <label className="profile-logo-upload">
                    <ImageUp
                      size={13}
                    />

                    Change logo

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={
                        (
                          event
                        ) => {
                          setSelectedLogo(
                            event.target.files?.[0] ??
                            null
                          );
                        }
                      }
                    />
                  </label>

                  <small>
                    PNG, JPG, WEBP, or GIF. 2 MB max.
                  </small>
                </div>

                <div className="profile-settings-fields">
                  <label>
                    <span>
                      USERNAME
                    </span>

                    <div
                      className={
                        `username-input-shell${usernameLocked ? " locked" : ""}`
                      }
                    >
                      <b>
                        @
                      </b>

                      <input
                        value={
                          username
                        }
                        maxLength={24}
                        disabled={
                          usernameLocked
                        }
                        onChange={
                          (
                            event
                          ) => {
                            setUsername(
                              event.target.value
                            );
                          }
                        }
                      />
                    </div>

                    <small>
                      3–24 letters, numbers, or underscores. Your public URL changes with your username.
                    </small>
                  </label>

                  <div
                    className={
                      `username-cooldown-box${usernameLocked ? " locked" : " ready"}`
                    }
                  >
                    <CalendarClock
                      size={15}
                    />

                    <div>
                      <strong>
                        {usernameLocked
                          ? "USERNAME CHANGE LOCKED"
                          : "USERNAME CHANGE AVAILABLE"}
                      </strong>

                      <span>
                        {usernameLocked
                          ? `You can change it again ${formatUsernameChangeDate(usernameWindow.nextChangeAt)}.`
                          : profile.username_changed_at
                            ? "Your 30-day waiting period is over."
                            : "You have not used your username change yet."}
                      </span>
                    </div>
                  </div>

                  <div className="public-page-linkbox">
                    <span>
                      PUBLIC PAGE
                    </span>

                    <code>
                      {publicUrl}
                    </code>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          void copyText(
                            publicUrl
                          );
                        }}
                      >
                        <Copy
                          size={11}
                        />

                        Copy
                      </button>

                      <a
                        href={
                          publicPath
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink
                          size={11}
                        />

                        Open
                      </a>
                    </div>
                  </div>

                  <button
                    className="profile-save-button"
                    type="button"
                    disabled={
                      savingProfile ||
                      (
                        usernameLocked &&
                        usernameChanged
                      )
                    }
                    onClick={() => {
                      void saveProfile();
                    }}
                  >
                    {savingProfile
                      ? "Saving..."
                      : "Save profile"}
                  </button>
                </div>
              </div>
            </section>

            <section className="user-admin-panel microlog-admin-panel">
              <header className="user-admin-panel-title">
                <strong>
                  MY THOUGHT SLOP
                </strong>

                <span>
                  your mental runoff · 280 characters
                </span>
              </header>

              <div className="microlog-composer">
                <textarea
                  value={
                    micrologBody
                  }
                  maxLength={280}
                  placeholder="Dump something into the slop..."
                  onChange={
                    (
                      event
                    ) => {
                      setMicrologBody(
                        event.target.value
                      );
                    }
                  }
                />

                <div className="microlog-composer-footer">
                  <span
                    className={
                      micrologBody.length >
                      250
                        ? "near-limit"
                        : ""
                    }
                  >
                    {micrologBody.length}/280
                  </span>

                  <button
                    type="button"
                    disabled={
                      posting ||
                      !micrologBody.trim()
                    }
                    onClick={() => {
                      void postMicrolog();
                    }}
                  >
                    <Send
                      size={12}
                    />

                    {posting
                      ? "Slopping..."
                      : "Add to slop"}
                  </button>
                </div>
              </div>

              <div className="microlog-admin-list">
                {micrologPosts.length ===
                  0 && (
                  <div className="microlog-empty">
                    No slop yet. Suspiciously well-adjusted.
                  </div>
                )}

                {micrologPosts.map(
                  (
                    post
                  ) => {
                    const permalink =
                      `${window.location.origin}/u/${profile.username}/status/${post.id}`;

                    return (
                      <article
                        className="microlog-admin-row"
                        key={
                          post.id
                        }
                      >
                        <p>
                          {post.body}
                        </p>

                        <footer>
                          <span>
                            {formatDate(
                              post.created_at
                            )}
                          </span>

                          <a
                            href={`/u/${profile.username}/status/${post.id}`}
                          >
                            <Link
                              size={10}
                            />

                            slop permalink
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              void copyText(
                                permalink
                              );
                            }}
                          >
                            <Copy
                              size={10}
                            />

                            copy
                          </button>

                          <button
                            className="danger"
                            type="button"
                            onClick={() => {
                              void removeMicrolog(
                                post.id
                              );
                            }}
                          >
                            <Trash2
                              size={10}
                            />

                            delete slop
                          </button>
                        </footer>
                      </article>
                    );
                  }
                )}
              </div>
            </section>
          </div>
        )}

        {message && (
          <div className="user-admin-toast">
            {message}
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
