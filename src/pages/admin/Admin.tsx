import {
  useEffect,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  ArchiveX,
  BookOpen,
  FileClock,
  ShieldCheck,
  Tag,
  Users,
  PanelRight,
} from "lucide-react";

import AdminUsers from "../../components/admin/AdminUsers";
import BlogManager from "../../components/admin/BlogManager";
import FlaggedComments from "../../components/admin/FlaggedComments";
import ModerationQueue from "../../components/admin/ModerationQueue";
import RejectedPosts from "../../components/admin/RejectedPosts";
import TaxonomyManager from "../../components/admin/TaxonomyManager";
import SidebarManager from "../../components/admin/SidebarManager";
import QuickPostDialog from "../../components/posts/QuickPostDialog";
import SiteHeader from "../../components/layout/SiteHeader";

import {
  supabase,
} from "../../lib/supabase";

import {
  getAdminStats,
  getMyAccess,
} from "../../services/admin";

import type {
  AdminStats,
  MyAccess,
} from "../../types/admin";

import "./Admin.css";


/* ==========================================================
   UNFILTERED LOGS
   ADMIN
   ========================================================== */


type Tab =
  | "dashboard"
  | "moderation"
  | "rejected"
  | "taxonomy"
  | "blog"
  | "sidebar"
  | "users";


export default function Admin() {
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
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);

  const [
    access,
    setAccess,
  ] =
    useState<MyAccess | null>(
      null
    );

  const [
    stats,
    setStats,
  ] =
    useState<AdminStats | null>(
      null
    );

  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "dashboard"
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


  const refreshStats =
    async () => {
      try {
        setStats(
          await getAdminStats()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not refresh admin stats."
        );
      }
    };


  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth
      .onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) return;
          setSession(nextSession);
          setAuthReady(true);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    const load =
      async () => {
        try {
          const nextAccess =
            await getMyAccess();

          if (!mounted) {
            return;
          }

          setAccess(
            nextAccess
          );

          if (
            !nextAccess ||
            (
              nextAccess.role !==
                "moderator" &&
              nextAccess.role !==
                "admin"
            ) ||
            nextAccess.account_status !==
              "active"
          ) {
            return;
          }

          const nextStats =
            await getAdminStats();

          if (mounted) {
            setStats(
              nextStats
            );
          }
        } catch (
          nextError
        ) {
          setError(
            nextError
              instanceof Error
              ? nextError.message
              : "UNFILTERED LOGS admin could not load."
          );
        } finally {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      };

    void load();

    return () => {
      mounted = false;
    };
  }, []);


  const signOut =
    async () => {
      await supabase.auth.signOut();
      window.location.assign("/");
    };


  if (loading) {
    return (
      <div className="admin-page classic-site">
        <SiteHeader
          session={session}
          authReady={authReady}
          accessRole={access?.role ?? null}
          activeSection="home"
          onPost={() => setPostDialogOpen(true)}
          onSignOut={() => void signOut()}
        />
        <main className="admin-gate site-width">
          Loading UNFILTERED LOGS admin...
        </main>
      </div>
    );
  }


  const allowed =
    access &&
    (
      access.role ===
        "moderator" ||
      access.role ===
        "admin"
    ) &&
    access.account_status ===
      "active";


  if (!allowed) {
    return (
      <div className="admin-page classic-site">
        <SiteHeader
          session={session}
          authReady={authReady}
          accessRole={access?.role ?? null}
          activeSection="home"
          onPost={() => {
            if (!session) {
              window.location.assign("/login?returnTo=%2Fadmin");
              return;
            }
            setPostDialogOpen(true);
          }}
          onSignOut={() => void signOut()}
        />
        <main className="admin-gate site-width">
        <ShieldCheck
          size={28}
        />

        <h1>
          Nope.
        </h1>

        <p>
          This part of UNFILTERED LOGS is for moderators and admins.
        </p>

        <a href="/">
          Back to Posts
        </a>
        </main>
      </div>
    );
  }


  return (
    <div className="admin-page">
      <SiteHeader
        session={session}
        authReady={authReady}
        accessRole={access.role}
        activeSection="home"
        onPost={() => setPostDialogOpen(true)}
        onSignOut={() => void signOut()}
      />

      <div className="admin-shell">
        <aside className="admin-nav">
          <button
            className={
              tab ===
                "dashboard"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "dashboard"
              );
            }}
          >
            <ShieldCheck
              size={16}
            />

            Dashboard
          </button>

          <button
            className={
              tab ===
                "moderation"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "moderation"
              );
            }}
          >
            <FileClock
              size={16}
            />

            Moderation

            {stats &&
              stats.pending_posts >
                0 && (
              <span className="admin-nav-count">
                {stats.pending_posts}
              </span>
            )}
          </button>

          <button
            className={
              tab ===
                "rejected"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "rejected"
              );
            }}
          >
            <ArchiveX
              size={16}
            />

            Rejected

            {stats &&
              stats.rejected_posts >
                0 && (
              <span className="admin-nav-count rejected">
                {stats.rejected_posts}
              </span>
            )}
          </button>

          <button
            className={
              tab ===
                "taxonomy"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "taxonomy"
              );
            }}
          >
            <Tag
              size={16}
            />

            Categories & Tags
          </button>

          {access.role ===
            "admin" && (
            <button
              className={
                tab ===
                  "blog"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(
                  "blog"
                );
              }}
            >
              <BookOpen
                size={16}
              />

              Blog
            </button>
          )}

          {access.role ===
            "admin" && (
            <button
              className={
                tab ===
                  "sidebar"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(
                  "sidebar"
                );
              }}
            >
              <PanelRight
                size={16}
              />

              Right Sidebar
            </button>
          )}

          {access.role ===
            "admin" && (
            <button
              className={
                tab ===
                  "users"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(
                  "users"
                );
              }}
            >
              <Users
                size={16}
              />

              Users
            </button>
          )}
        </aside>

        <main className="admin-content">
          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          {tab ===
            "dashboard" && (
            <>
              <div className="admin-page-title">
                <span className="admin-eyebrow">
                  UNFILTERED LOGS CONTROL ROOM
                </span>

                <h1>
                  Dashboard
                </h1>
              </div>

              <div className="admin-stat-grid">
                <div className="admin-stat">
                  <span>
                    Users
                  </span>

                  <strong>
                    {stats?.total_users ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat">
                  <span>
                    Posts
                  </span>

                  <strong>
                    {stats?.total_posts ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat attention">
                  <span>
                    Pending
                  </span>

                  <strong>
                    {stats?.pending_posts ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat">
                  <span>
                    Approved
                  </span>

                  <strong>
                    {stats?.approved_posts ??
                      0}
                  </strong>
                </div>
              </div>

              <div className="admin-dashboard-queue">
                <ModerationQueue
                  limit={5}
                  onChanged={() => {
                    void refreshStats();
                  }}
                  onViewAll={() => {
                    setTab(
                      "moderation"
                    );
                  }}
                />
              </div>

              <div className="admin-dashboard-queue">
                <FlaggedComments
                  limit={8}
                />
              </div>
            </>
          )}

          {tab ===
            "moderation" && (
            <ModerationQueue
              onChanged={() => {
                void refreshStats();
              }}
            />
          )}

          {tab ===
            "rejected" && (
            <RejectedPosts />
          )}

          {tab ===
            "taxonomy" && (
            <TaxonomyManager />
          )}

          {tab ===
            "blog" &&
            access.role ===
              "admin" && (
            <BlogManager />
          )}

          {tab ===
            "sidebar" &&
            access.role ===
              "admin" && (
            <SidebarManager />
          )}

          {tab ===
            "users" &&
            access.role ===
              "admin" && (
            <AdminUsers />
          )}
        </main>
      </div>

      <QuickPostDialog
        open={postDialogOpen}
        onClose={() => setPostDialogOpen(false)}
        onPosted={() => setPostDialogOpen(false)}
      />
    </div>
  );
}
