import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  CalendarClock,
  ExternalLink,
  MessageSquare,
  Radio,
  RefreshCw,
  Tv,
  Users,
  Video,
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
  getConfiguredYouTubeChannel,
  getYouTubeLiveStatus,
  type YouTubeBroadcast,
  type YouTubeLiveStatus,
} from "../../services/youtubeLive";

import type {
  UserRole,
} from "../../types/admin";

import "./LivePage.css";


/* ==========================================================
   LIVE 001
   HELPERS
   ========================================================== */


function formatBroadcastDate(
  value:
    string | null,
) {
  if (!value) {
    return null;
  }

  return new Date(
    value
  ).toLocaleString(
    undefined,
    {
      weekday:
        "short",

      month:
        "short",

      day:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}


function formatViewerCount(
  value:
    number | null,
) {
  if (
    value ===
    null
  ) {
    return null;
  }

  return value
    .toLocaleString();
}


function BroadcastPlayer({
  broadcast,
}: {
  broadcast:
    YouTubeBroadcast;
}) {
  return (
    <div className="live-player-frame">
      <iframe
        src={`${broadcast.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
        title={
          broadcast.title
        }
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}


/* ==========================================================
   LIVE 002
   PAGE
   ========================================================== */


export default function LivePage() {
  const [
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);

  const [
    session,
    setSession,
  ] =
    useState<
      Session | null
    >(
      null
    );

  const [
    accessRole,
    setAccessRole,
  ] =
    useState<
      UserRole | null
    >(
      null
    );

  const [
    authReady,
    setAuthReady,
  ] =
    useState(false);

  const [
    status,
    setStatus,
  ] =
    useState<
      YouTubeLiveStatus | null
    >(
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
    useState<
      string | null
    >(
      null
    );


  const configuredChannel =
    getConfiguredYouTubeChannel();


  const refresh =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setError(
          null
        );

        try {
          const next =
            await getYouTubeLiveStatus();

          setStatus(
            next
          );
        } catch (
          nextError
        ) {
          setStatus(
            null
          );

          setError(
            nextError instanceof
              Error
              ? nextError.message
              : "Could not check YouTube Live."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );


  useEffect(
    () => {
      let mounted =
        true;

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

      if (!session) {
        setAccessRole(
          null
        );

        return () => {
          mounted =
            false;
        };
      }

      void getMyAccess()
        .then(
          (
            access
          ) => {
            if (
              mounted
            ) {
              setAccessRole(
                access?.role ??
                null
              );
            }
          }
        )
        .catch(
          () => {
            if (
              mounted
            ) {
              setAccessRole(
                null
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
      session,
    ]
  );


  useEffect(
    () => {
      void refresh();
    },
    [
      refresh,
    ]
  );


  const signOut =
    async () => {
      await supabase.auth
        .signOut();

      window.location.assign(
        "/"
      );
    };


  const openQuickPost =
    () => {
      if (!session) {
        window.location.assign(
          `/login?returnTo=${encodeURIComponent("/live")}`
        );

        return;
      }

      setPostDialogOpen(
        true
      );
    };


  const live =
    status?.live ??
    null;

  const upcoming =
    status?.upcoming ??
    null;

  const latest =
    status?.latest ??
    null;


  const chatUrl =
    useMemo(
      () => {
        if (!live) {
          return null;
        }

        const domain =
          window.location.hostname;

        return `https://www.youtube.com/live_chat?v=${encodeURIComponent(live.videoId)}&embed_domain=${encodeURIComponent(domain)}`;
      },
      [
        live,
      ]
    );


  return (
    <div className="live-page">
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
        activeSection="live"
        onPost={
          openQuickPost
        }
        onSignOut={() => {
          void signOut();
        }}
      />


      <main className="live-shell">
        <section
          className={
            live
              ? "live-status-banner broadcasting"
              : "live-status-banner"
          }
        >
          <div className="live-status-icon">
            <Radio
              size={21}
            />
          </div>

          <div className="live-status-copy">
            <span>
              UNFILTEREDLOG LIVE
            </span>

            <h1>
              {live
                ? "IVAN IS LIVE"
                : "NOT LIVE. MIRACULOUSLY."}
            </h1>

            <p>
              {live
                ? "Live from the bad decision factory. Whatever seemed reasonable five minutes ago is now being broadcast."
                : "The camera is off. Society gets a brief window to recover."}
            </p>
          </div>

          <div className="live-status-actions">
            <button
              type="button"
              disabled={
                loading
              }
              onClick={() => {
                void refresh();
              }}
            >
              <RefreshCw
                size={13}
                className={
                  loading
                    ? "spinning"
                    : undefined
                }
              />

              {loading
                ? "Checking..."
                : "Check status"}
            </button>

            {status && (
              <a
                href={
                  status.channelUrl
                }
                target="_blank"
                rel="noreferrer"
              >
                YouTube channel

                <ExternalLink
                  size={12}
                />
              </a>
            )}
          </div>
        </section>


        {error && (
          <section className="live-error-panel">
            <strong>
              YOUTUBE IS BEING DIFFICULT
            </strong>

            <p>
              {error}
            </p>

            {!configuredChannel && (
              <code>
                VITE_YOUTUBE_CHANNEL=@yourhandle
              </code>
            )}
          </section>
        )}


        {loading &&
          !status &&
          !error && (
          <section className="live-loading-panel">
            <Radio
              size={24}
            />

            <strong>
              Checking whether Ivan has made the mistake of going live...
            </strong>
          </section>
        )}


        {live && (
          <>
            <div className="live-broadcast-grid">
              <section className="live-video-panel">
                <header className="live-panel-header live-panel-header-red">
                  <div>
                    <span className="live-dot" />

                    <strong>
                      LIVE BROADCAST
                    </strong>
                  </div>

                  {formatViewerCount(
                    live.concurrentViewers
                  ) && (
                    <span>
                      <Users
                        size={12}
                      />

                      {formatViewerCount(
                        live.concurrentViewers
                      )} watching
                    </span>
                  )}
                </header>

                <BroadcastPlayer
                  broadcast={
                    live
                  }
                />

                <div className="live-video-info">
                  <h2>
                    {live.title}
                  </h2>

                  {live.actualStartTime && (
                    <span>
                      Started{" "}
                      {formatBroadcastDate(
                        live.actualStartTime
                      )}
                    </span>
                  )}

                  {live.description && (
                    <p>
                      {live.description}
                    </p>
                  )}

                  <a
                    href={
                      live.watchUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    WATCH ON YOUTUBE »

                    <ExternalLink
                      size={12}
                    />
                  </a>
                </div>
              </section>


              <aside className="live-chat-panel">
                <header className="live-panel-header">
                  <div>
                    <MessageSquare
                      size={14}
                    />

                    <strong>
                      YOUTUBE LIVE CHAT
                    </strong>
                  </div>
                </header>

                {chatUrl ? (
                  <iframe
                    className="live-chat-frame"
                    src={
                      chatUrl
                    }
                    title="YouTube live chat"
                  />
                ) : (
                  <div className="live-chat-unavailable">
                    Chat is unavailable.
                  </div>
                )}

                <footer>
                  YouTube controls the chat. We merely put a window around it.
                </footer>
              </aside>
            </div>
          </>
        )}


        {!loading &&
          !error &&
          !live && (
          <div className="live-offline-grid">
            <section className="live-offline-main">
              <header className="live-panel-header">
                <div>
                  <Tv
                    size={14}
                  />

                  <strong>
                    OFFLINE FEED
                  </strong>
                </div>
              </header>

              {latest ? (
                <>
                  <div className="live-player-frame">
                    <iframe
                      src={`${latest.embedUrl}?rel=0&modestbranding=1`}
                      title={
                        latest.title
                      }
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>

                  <div className="live-video-info">
                    <span className="live-small-label">
                      LATEST VIDEO
                    </span>

                    <h2>
                      {latest.title}
                    </h2>

                    {latest.description && (
                      <p>
                        {latest.description}
                      </p>
                    )}

                    <a
                      href={
                        latest.watchUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      WATCH ON YOUTUBE »

                      <ExternalLink
                        size={12}
                      />
                    </a>
                  </div>
                </>
              ) : (
                <div className="live-empty-video">
                  <Video
                    size={30}
                  />

                  <strong>
                    Nothing to play right now.
                  </strong>

                  <span>
                    Apparently even YouTube gets a day off.
                  </span>
                </div>
              )}
            </section>


            <aside className="live-offline-sidebar">
              <section className="live-info-box">
                <header>
                  <CalendarClock
                    size={14}
                  />

                  <strong>
                    NEXT BROADCAST
                  </strong>
                </header>

                {upcoming ? (
                  <div>
                    <span className="live-small-label">
                      SCHEDULED
                    </span>

                    <h3>
                      {upcoming.title}
                    </h3>

                    <strong className="live-upcoming-time">
                      {formatBroadcastDate(
                        upcoming.scheduledStartTime
                      ) ??
                      "YouTube says eventually."}
                    </strong>

                    <a
                      href={
                        upcoming.watchUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      OPEN WAITING ROOM »
                    </a>
                  </div>
                ) : (
                  <div>
                    <strong>
                      NOTHING SCHEDULED
                    </strong>

                    <p>
                      Which means the next live stream will probably be announced with the organizational discipline of someone yelling from another room.
                    </p>
                  </div>
                )}
              </section>


              <section className="live-info-box">
                <header>
                  <Radio
                    size={14}
                  />

                  <strong>
                    BROADCAST STATUS
                  </strong>
                </header>

                <div className="live-status-table">
                  <span>
                    Channel
                  </span>

                  <strong>
                    {status?.channelTitle ??
                      "YouTube"}
                  </strong>

                  <span>
                    Status
                  </span>

                  <strong>
                    OFFLINE
                  </strong>

                  <span>
                    Last checked
                  </span>

                  <strong>
                    {status
                      ? formatBroadcastDate(
                          status.checkedAt
                        )
                      : "—"}
                  </strong>
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>


      <SiteFooter />


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
    </div>
  );
}
