import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  Check,
  CheckCheck,
  Mail,
} from "lucide-react";

import type {
  UserRole,
} from "../../types/admin";

import type {
  NotificationRecord,
} from "../../types/notification";

import {
  getPublicSiteStats,
  type PublicSiteStats,
} from "../../services/siteStats";

import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToMyNotifications,
} from "../../services/notifications";

import "./SiteHeader.css";


/* ==========================================================
   HEADER 001
   SHARED UNFILTEREDLOG CLASSIC BLOG HEADER
   ========================================================== */


type ActiveSection =
  | "home"
  | "blog"
  | "forums";


type Props = {
  session:
    Session | null;

  authReady:
    boolean;

  accessRole:
    UserRole | null;

  activeSection:
    ActiveSection;

  onPost:
    () => void;

  onSignOut:
    () => void;

  searchValue?:
    string;

  onSearchChange?:
    (
      value:
        string
    ) => void;

  onSearchSubmit?:
    (
      value:
        string
    ) => void;
};


type LogoVariant =
  | "light"
  | "dark";


type LogoProps = {
  variant?:
    LogoVariant;
};


export function UnfilteredLogsLogo({
  variant = "light",
}: LogoProps) {
  const logoSource =
    variant ===
      "dark"
      ? "/unfilteredlog-logo-dark.png"
      : "/unfilteredlog-logo.png";

  return (
    <a
      className={`roffle-logo site-title logo-${variant}`}
      href="/"
      aria-label="UNFILTEREDLOG home"
    >
      <img
        className="unfiltered-logo-image"
        src={
          logoSource
        }
        alt="UNFILTEREDLOG by OneTime Labs"
      />
    </a>
  );
}


function formatNotificationDate(
  value:
    string,
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


export default function SiteHeader({
  session,
  authReady,
  accessRole,
  activeSection,
  onPost,
  onSignOut,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: Props) {
  const [
    localSearch,
    setLocalSearch,
  ] =
    useState("");

  const [
    siteStats,
    setSiteStats,
  ] =
    useState<
      PublicSiteStats | null
    >(
      null
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationRecord[]
    >(
      []
    );

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(false);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] =
    useState(false);

  const [
    notificationError,
    setNotificationError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const notificationRef =
    useRef<
      HTMLDivElement | null
    >(
      null
    );


  const refreshSiteStats =
    useCallback(
      async () => {
        try {
          const stats =
            await getPublicSiteStats();

          setSiteStats(
            stats
          );
        } catch (
          error
        ) {
          console.warn(
            "UNFILTEREDLOG SITE STATS ERROR:",
            error
          );
        }
      },
      []
    );


  const refreshNotifications =
    useCallback(
      async (
        showLoading =
          false
      ) => {
        if (
          !session?.user.id
        ) {
          setNotifications(
            []
          );

          return;
        }

        if (
          showLoading
        ) {
          setNotificationsLoading(
            true
          );
        }

        try {
          const next =
            await getMyNotifications(
              30
            );

          setNotifications(
            next
          );

          setNotificationError(
            null
          );
        } catch (
          error
        ) {
          console.warn(
            "UNFILTEREDLOG NOTIFICATION ERROR:",
            error
          );

          setNotificationError(
            "Could not load notifications."
          );
        } finally {
          if (
            showLoading
          ) {
            setNotificationsLoading(
              false
            );
          }
        }
      },
      [
        session?.user.id,
      ]
    );


  useEffect(
    () => {
      void refreshSiteStats();

      const handleFocus =
        () => {
          void refreshSiteStats();
        };

      window.addEventListener(
        "focus",
        handleFocus
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus
        );
      };
    },
    [
      refreshSiteStats,
    ]
  );


  useEffect(
    () => {
      if (
        !session?.user.id
      ) {
        setNotifications(
          []
        );

        setNotificationsOpen(
          false
        );

        return;
      }

      void refreshNotifications();

      const stopRealtime =
        subscribeToMyNotifications(
          session.user.id,
          () => {
            void refreshNotifications();
          }
        );

      const interval =
        window.setInterval(
          () => {
            void refreshNotifications();
          },
          30000
        );

      const handleFocus =
        () => {
          void refreshNotifications();
        };

      window.addEventListener(
        "focus",
        handleFocus
      );

      return () => {
        stopRealtime();

        window.clearInterval(
          interval
        );

        window.removeEventListener(
          "focus",
          handleFocus
        );
      };
    },
    [
      session?.user.id,
      refreshNotifications,
    ]
  );


  useEffect(
    () => {
      const handlePointerDown =
        (
          event:
            MouseEvent
        ) => {
          if (
            !notificationsOpen ||
            !notificationRef.current
          ) {
            return;
          }

          if (
            !notificationRef.current
              .contains(
                event.target as
                  Node
              )
          ) {
            setNotificationsOpen(
              false
            );
          }
        };

      const handleKeyDown =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setNotificationsOpen(
              false
            );
          }
        };

      document.addEventListener(
        "mousedown",
        handlePointerDown
      );

      document.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handlePointerDown
        );

        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      notificationsOpen,
    ]
  );


  const unreadCount =
    notifications.filter(
      (
        notification
      ) =>
        !notification.read_at
    ).length;


  const signInReturnTo =
    encodeURIComponent(
      `${window.location.pathname}${window.location.search}`
    );

  const provider =
    session?.user
      .app_metadata
      ?.provider;

  const providerLabel =
    provider ===
      "google"
      ? "Google"
      : provider ===
          "discord"
        ? "Discord"
        : provider
          ? String(
              provider
            )
          : "Account";

  const userLabel =
    session?.user
      .user_metadata
      ?.full_name ??
    session?.user
      .user_metadata
      ?.preferred_username ??
    session?.user
      .user_metadata
      ?.user_name ??
    session?.user.email ??
    "Signed in";

  const currentSearch =
    searchValue ??
    localSearch;


  const setSearch =
    (
      value:
        string
    ) => {
      if (
        onSearchChange
      ) {
        onSearchChange(
          value
        );
      } else {
        setLocalSearch(
          value
        );
      }
    };


  const submitSearch =
    () => {
      const cleaned =
        currentSearch
          .trim();

      if (
        onSearchSubmit
      ) {
        onSearchSubmit(
          cleaned
        );

        return;
      }

      if (!cleaned) {
        window.location.assign(
          "/"
        );

        return;
      }

      window.location.assign(
        `/?q=${encodeURIComponent(cleaned)}`
      );
    };


  const readOne =
    async (
      notification:
        NotificationRecord,
    ) => {
      if (
        notification.read_at
      ) {
        return;
      }

      try {
        await markNotificationRead(
          notification.id
        );

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                notification.id
                  ? {
                      ...item,

                      read_at:
                        new Date()
                          .toISOString(),
                    }
                  : item
            )
        );
      } catch (
        error
      ) {
        console.warn(
          "UNFILTEREDLOG MARK NOTIFICATION READ ERROR:",
          error
        );
      }
    };


  const readAll =
    async () => {
      try {
        await markAllNotificationsRead();

        const readAt =
          new Date()
            .toISOString();

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                item
              ) => ({
                ...item,

                read_at:
                  item.read_at ??
                  readAt,
              })
            )
        );
      } catch (
        error
      ) {
        console.warn(
          "UNFILTEREDLOG MARK ALL READ ERROR:",
          error
        );
      }
    };


  return (
    <header className="top-shell site-header">
      <div className="brand-row site-width">
        <div className="site-brand-lockup">
          <UnfilteredLogsLogo />
        </div>

        <a
          className="header-discord-join"
          href="https://discord.gg/ErbQfdpcHD"
          target="_blank"
          rel="noreferrer"
          aria-label="Join our Discord"
        >
          <span className="header-discord-mark">
            D
          </span>

          <strong>
            JOIN OUR DISCORD
          </strong>
        </a>

        <div className="top-right">
          {authReady &&
            session && (
            <span
              className="welcome-text"
              title={`${userLabel} via ${providerLabel}`}
            >
              Welcome back,{" "}
              <strong>
                {userLabel}
              </strong>.
            </span>
          )}

          <button
            className="new-log"
            type="button"
            onClick={
              onPost
            }
          >
            NEW
          </button>

          {authReady &&
            (
              session
                ? (
                <>
                  <a
                    className="header-user-page-link"
                    href="/account"
                  >
                    My Page
                  </a>

                  <div
                    className="header-notifications"
                    ref={
                      notificationRef
                    }
                  >
                    <button
                      className={
                        `header-notification-button${unreadCount > 0 ? " has-unread" : ""}`
                      }
                      type="button"
                      aria-label={
                        unreadCount > 0
                          ? `${unreadCount} unread notifications`
                          : "Notifications"
                      }
                      aria-expanded={
                        notificationsOpen
                      }
                      title={
                        unreadCount > 0
                          ? `${unreadCount} unread notifications`
                          : "No new notifications"
                      }
                      onClick={() => {
                        const nextOpen =
                          !notificationsOpen;

                        setNotificationsOpen(
                          nextOpen
                        );

                        if (
                          nextOpen
                        ) {
                          void refreshNotifications(
                            true
                          );
                        }
                      }}
                    >
                      <Mail
                        size={16}
                      />

                      {unreadCount >
                        0 && (
                        <span className="header-notification-count">
                          {unreadCount >
                            99
                            ? "99+"
                            : unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="notification-menu">
                        <header className="notification-menu-header">
                          <div>
                            <strong>
                              NOTIFICATIONS
                            </strong>

                            <span>
                              {unreadCount >
                                0
                                ? `${unreadCount} unread`
                                : "all caught up"}
                            </span>
                          </div>

                          {unreadCount >
                            0 && (
                            <button
                              type="button"
                              onClick={() => {
                                void readAll();
                              }}
                            >
                              <CheckCheck
                                size={12}
                              />

                              Mark all read
                            </button>
                          )}
                        </header>

                        <div className="notification-menu-list">
                          {notificationsLoading &&
                            notifications.length ===
                              0 && (
                            <div className="notification-empty">
                              Checking the mail...
                            </div>
                          )}

                          {!notificationsLoading &&
                            notificationError &&
                            notifications.length ===
                              0 && (
                            <div className="notification-empty error">
                              {notificationError}
                            </div>
                          )}

                          {!notificationsLoading &&
                            !notificationError &&
                            notifications.length ===
                              0 && (
                            <div className="notification-empty">
                              Nothing new. The internet has briefly stopped yelling at you.
                            </div>
                          )}

                          {notifications.map(
                            (
                              notification
                            ) => (
                              <article
                                className={
                                  notification.read_at
                                    ? "notification-row"
                                    : "notification-row unread"
                                }
                                key={
                                  notification.id
                                }
                              >
                                <a
                                  href={
                                    notification.url
                                  }
                                  onClick={() => {
                                    void readOne(
                                      notification
                                    );
                                  }}
                                >
                                  <strong>
                                    {notification.title}
                                  </strong>

                                  {notification.body && (
                                    <p>
                                      {notification.body}
                                    </p>
                                  )}

                                  <time>
                                    {formatNotificationDate(
                                      notification.created_at
                                    )}
                                  </time>
                                </a>

                                {!notification.read_at && (
                                  <button
                                    className="notification-mark-read"
                                    type="button"
                                    title="Mark as read"
                                    onClick={() => {
                                      void readOne(
                                        notification
                                      );
                                    }}
                                  >
                                    <Check
                                      size={11}
                                    />

                                    Read
                                  </button>
                                )}
                              </article>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {(accessRole ===
                    "moderator" ||
                    accessRole ===
                      "admin") && (
                    <a
                      className="header-admin-link"
                      href="/admin"
                    >
                      Admin
                    </a>
                  )}

                  <button
                    className="user-chip"
                    type="button"
                    onClick={
                      onSignOut
                    }
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <a
                  className="login-link"
                  href={`/login?returnTo=${signInReturnTo}`}
                  onClick={
                    (
                      event
                    ) => {
                      event.preventDefault();

                      window.location.assign(
                        `/login?returnTo=${signInReturnTo}`
                      );
                    }
                  }
                >
                  Sign in
                </a>
              )
            )}
        </div>
      </div>

      <nav
        className="nav-bar"
        aria-label="Primary navigation"
      >
        <div className="site-width nav-inner">
          <div className="nav-links">
            <a
              className={
                activeSection ===
                  "home"
                  ? "active"
                  : ""
              }
              href="/"
            >
              Posts
            </a>

            <a
              className={
                activeSection ===
                  "blog"
                  ? "active"
                  : ""
              }
              href="/blog"
            >
              Editorial
            </a>

            <a
              className={
                activeSection ===
                  "forums"
                  ? "active"
                  : ""
              }
              href="/forum"
            >
              Forum
            </a>
          </div>

          <form
            className="header-search"
            onSubmit={
              (
                event
              ) => {
                event.preventDefault();

                submitSearch();
              }
            }
          >
            <input
              value={
                currentSearch
              }
              onChange={
                (
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
              }
              placeholder="Search posts..."
              aria-label="Search posts"
            />

            <button type="submit">
              Search
            </button>
          </form>
        </div>
      </nav>

      <div className="status-strip">
        <div className="site-width status-inner">
          <span>
            <strong>
              {siteStats
                ? siteStats.totalUsers.toLocaleString()
                : "—"}
            </strong>{" "}
            users
          </span>

          <span>
            <strong>
              {siteStats
                ? siteStats.totalPosts.toLocaleString()
                : "—"}
            </strong>{" "}
            posts
          </span>

          <span>
            Last new member:{" "}
            <strong className="latest-member-name">
              {siteStats
                ?.latestMember ??
                "—"}
            </strong>
          </span>
        </div>
      </div>
    </header>
  );
}
