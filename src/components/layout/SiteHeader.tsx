import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "../../types/admin";
import {
  getPublicSiteStats,
  type PublicSiteStats,
} from "../../services/siteStats";

/* ==========================================================
   HEADER 001
   SHARED UNFILTERED LOGS CLASSIC BLOG HEADER
   ========================================================== */

type ActiveSection =
  | "home"
  | "blog"
  | "forums";

type Props = {
  session: Session | null;
  authReady: boolean;
  accessRole: UserRole | null;
  activeSection: ActiveSection;
  onPost: () => void;
  onSignOut: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
};

export function UnfilteredLogsLogo() {
  return (
    <a
      className="roffle-logo site-title"
      href="/"
      aria-label="UNFILTERED LOGS home"
    >
      <span className="logo-mark site-logo">UL</span>

      <span className="site-wordmark">
        <strong className="logo-word">UNFILTERED LOGS</strong>
        <small>by OneTime Labs</small>
      </span>
    </a>
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
  const [localSearch, setLocalSearch] = useState("");

  const [siteStats, setSiteStats] =
    useState<PublicSiteStats | null>(
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
        } catch (error) {
          console.warn(
            "UNFILTERED LOGS SITE STATS ERROR:",
            error
          );
        }
      },
      []
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
    [refreshSiteStats]
  );

  const signInReturnTo =
    encodeURIComponent(
      `${window.location.pathname}${window.location.search}`
    );

  const provider = session?.user.app_metadata?.provider;
  const providerLabel =
    provider === "google"
      ? "Google"
      : provider === "discord"
        ? "Discord"
        : provider
          ? String(provider)
          : "Account";

  const userLabel =
    session?.user.user_metadata?.full_name ??
    session?.user.user_metadata?.preferred_username ??
    session?.user.user_metadata?.user_name ??
    session?.user.email ??
    "Signed in";

  const currentSearch = searchValue ?? localSearch;

  const setSearch = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearch(value);
    }
  };

  const submitSearch = () => {
    const cleaned = currentSearch.trim();

    if (onSearchSubmit) {
      onSearchSubmit(cleaned);
      return;
    }

    if (!cleaned) {
      window.location.assign("/");
      return;
    }

    window.location.assign(`/?q=${encodeURIComponent(cleaned)}`);
  };

  return (
    <header className="top-shell site-header">
      <div className="brand-row site-width">
        <UnfilteredLogsLogo />

        <div className="top-right">
          {authReady && session && (
            <span
              className="welcome-text"
              title={`${userLabel} via ${providerLabel}`}
            >
              Welcome back, <strong>{userLabel}</strong>.
            </span>
          )}

          <button className="new-log" type="button" onClick={onPost}>
            NEW
          </button>

          {authReady &&
            (session ? (
              <>
                {(accessRole === "moderator" || accessRole === "admin") && (
                  <a className="header-admin-link" href="/admin">
                    Admin
                  </a>
                )}

                <button className="user-chip" type="button" onClick={onSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <a
                className="login-link"
                href={`/login?returnTo=${signInReturnTo}`}
                onClick={(event) => {
                  event.preventDefault();
                  window.location.assign(
                    `/login?returnTo=${signInReturnTo}`
                  );
                }}
              >
                Sign in
              </a>
            ))}
        </div>
      </div>

      <nav className="nav-bar" aria-label="Primary navigation">
        <div className="site-width nav-inner">
          <div className="nav-links">
            <a
              className={activeSection === "home" ? "active" : ""}
              href="/"
            >
              Posts
            </a>

            <a
              className={activeSection === "blog" ? "active" : ""}
              href="/blog"
            >
              Editorial
            </a>

            <a
              className={activeSection === "forums" ? "active" : ""}
              href="/forum"
            >
              Forum
            </a>
          </div>

          <form
            className="header-search"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <input
              value={currentSearch}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search posts..."
              aria-label="Search posts"
            />

            <button type="submit">Search</button>
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
              {siteStats?.latestMember ?? "—"}
            </strong>
          </span>
        </div>
      </div>
    </header>
  );
}
