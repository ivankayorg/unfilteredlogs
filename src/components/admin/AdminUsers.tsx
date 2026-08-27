import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Flag,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
} from "lucide-react";

import {
  adminChangeUsername,
  getAdminUserReports,
  resolveAdminUserReports,
  searchAdminUsers,
  setAccountStatus,
  setUserRole,
} from "../../services/admin";

import type {
  AccountStatus,
  AdminUser,
  UserReportDetail,
  UserRole,
} from "../../types/admin";

import "./AdminUsers.css";


/* ==========================================================
   UNFILTERED LOGS
   ADMIN USERS
   SEARCHABLE / PAGINATED / REPORTED USERS
   ========================================================== */


const PAGE_SIZE = 25;

type UserView =
  | "all"
  | "reported";


function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}


function reportReasonLabel(reason: string) {
  switch (reason) {
    case "spam":
      return "Spam";
    case "harassment":
      return "Harassment";
    case "hate_or_abuse":
      return "Hate / abuse";
    case "impersonation":
      return "Impersonation";
    case "threats_or_safety":
      return "Threats / safety";
    default:
      return "Other";
  }
}


export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [view, setView] = useState<UserView>("all");
  const [page, setPage] = useState(1);
  const [usernameDrafts, setUsernameDrafts] = useState<Record<string, string>>({});
  const [savingUsernameFor, setSavingUsernameFor] = useState<string | null>(null);
  const [expandedReportsFor, setExpandedReportsFor] = useState<string | null>(null);
  const [reportsByUser, setReportsByUser] = useState<Record<string, UserReportDetail[]>>({});
  const [reportLoadingFor, setReportLoadingFor] = useState<string | null>(null);
  const [resolvingReportsFor, setResolvingReportsFor] = useState<string | null>(null);


  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);


  useEffect(() => {
    setPage(1);
    setExpandedReportsFor(null);
  }, [view]);


  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchAdminUsers({
        query: debouncedQuery,
        page,
        pageSize: PAGE_SIZE,
        reportedOnly: view === "reported",
      });

      setUsers(result.users);
      setTotal(result.total);
      setUsernameDrafts((current) => {
        const next = { ...current };
        for (const user of result.users) {
          next[user.user_id] = user.username ?? "";
        }
        return next;
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not load users."
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, view]);


  useEffect(() => {
    void load();
  }, [load]);


  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );


  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);


  const changeUsername = async (user: AdminUser) => {
    const draft = usernameDrafts[user.user_id] ?? "";
    setError(null);
    setSavingUsernameFor(user.user_id);

    try {
      const changed = await adminChangeUsername(user.user_id, draft);
      setUsers((current) => current.map((currentUser) =>
        currentUser.user_id === user.user_id
          ? {
              ...currentUser,
              username: changed,
              display_name: changed,
            }
          : currentUser
      ));
      setUsernameDrafts((current) => ({
        ...current,
        [user.user_id]: changed,
      }));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not change username."
      );
    } finally {
      setSavingUsernameFor(null);
    }
  };


  const updateRole = async (userId: string, role: UserRole) => {
    setError(null);
    try {
      await setUserRole(userId, role);
      setUsers((current) => current.map((user) =>
        user.user_id === userId ? { ...user, role } : user
      ));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not change role."
      );
    }
  };


  const updateStatus = async (
    userId: string,
    account_status: AccountStatus,
  ) => {
    setError(null);
    try {
      await setAccountStatus(userId, account_status);
      setUsers((current) => current.map((user) =>
        user.user_id === userId
          ? { ...user, account_status }
          : user
      ));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not change account status."
      );
    }
  };


  const toggleReports = async (user: AdminUser) => {
    if (expandedReportsFor === user.user_id) {
      setExpandedReportsFor(null);
      return;
    }

    setExpandedReportsFor(user.user_id);

    if (reportsByUser[user.user_id]) return;

    setReportLoadingFor(user.user_id);
    setError(null);

    try {
      const reports = await getAdminUserReports(user.user_id);
      setReportsByUser((current) => ({
        ...current,
        [user.user_id]: reports,
      }));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not load user reports."
      );
    } finally {
      setReportLoadingFor(null);
    }
  };


  const resolveReports = async (
    userId: string,
    resolution: "reviewed" | "dismissed",
  ) => {
    setResolvingReportsFor(userId);
    setError(null);

    try {
      await resolveAdminUserReports(userId, resolution);
      setReportsByUser((current) => ({
        ...current,
        [userId]: (current[userId] ?? []).map((report) =>
          report.status === "open"
            ? { ...report, status: resolution }
            : report
        ),
      }));
      await load();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not resolve user reports."
      );
    } finally {
      setResolvingReportsFor(null);
    }
  };


  const firstResult = total === 0
    ? 0
    : ((page - 1) * PAGE_SIZE) + 1;

  const lastResult = Math.min(page * PAGE_SIZE, total);


  return (
    <section className="admin-panel admin-users-panel">
      <header className="admin-panel-header admin-users-header">
        <div>
          <span className="admin-eyebrow">ACCOUNTS</span>
          <h2>Users</h2>
        </div>

        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => void load()}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      <div className="admin-users-toolbar">
        <label className="admin-users-search">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            type="search"
            placeholder="Search username, name, or email..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div
          className="admin-users-view-tabs"
          role="tablist"
          aria-label="User views"
        >
          <button
            className={view === "all" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={view === "all"}
            onClick={() => setView("all")}
          >
            All users
          </button>

          <button
            className={view === "reported" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={view === "reported"}
            onClick={() => setView("reported")}
          >
            <ShieldAlert size={13} />
            Reported
          </button>
        </div>
      </div>

      <div className="admin-users-summary">
        <span>
          {loading
            ? "Loading..."
            : total === 0
              ? "No users found"
              : `Showing ${firstResult}-${lastResult} of ${total}`}
        </span>

        {debouncedQuery && (
          <span>Search: "{debouncedQuery}"</span>
        )}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="admin-empty">
          {view === "reported"
            ? "No users currently have open reports."
            : "No users matched that search."}
        </div>
      ) : (
        <div className="admin-users-list">
          {users.map((user) => {
            const reports = reportsByUser[user.user_id] ?? [];
            const expanded = expandedReportsFor === user.user_id;

            return (
              <article
                className={
                  user.report_count > 0
                    ? "admin-user-row reported"
                    : "admin-user-row"
                }
                key={user.user_id}
              >
                <div className="admin-user-primary">
                  <div className="admin-user-name-line">
                    {user.username ? (
                      <a
                        className="admin-user-profile-link"
                        href={`/u/${encodeURIComponent(user.username)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {user.display_name}
                      </a>
                    ) : (
                      <strong>{user.display_name}</strong>
                    )}

                    {user.report_count > 0 && (
                      <span className="admin-user-report-badge">
                        <Flag size={11} />
                        {user.report_count === 1
                          ? "1 report"
                          : `${user.report_count} reports`}
                      </span>
                    )}
                  </div>

                  <div className="admin-user-identity-meta">
                    <span>{user.username ? `@${user.username}` : "No username"}</span>
                    <span>{user.email ?? "No email"}</span>
                    <span>{user.provider ?? "unknown provider"}</span>
                    <span>{user.email_confirmed_at ? "email confirmed" : "email unconfirmed"}</span>
                  </div>

                  <div className="admin-user-created">
                    Joined {formatDate(user.created_at)}
                  </div>
                </div>

                <div className="admin-user-controls">
                  <div className="admin-user-control-block admin-user-username-block">
                    <label>Username</label>
                    <div className="admin-username-editor">
                      <span>@</span>
                      <input
                        value={usernameDrafts[user.user_id] ?? ""}
                        maxLength={24}
                        aria-label={`Username for ${user.display_name}`}
                        onChange={(event) => {
                          setUsernameDrafts((current) => ({
                            ...current,
                            [user.user_id]: event.target.value,
                          }));
                        }}
                      />
                      <button
                        type="button"
                        title="Admin override: change username regardless of the 30-day user cooldown."
                        disabled={
                          savingUsernameFor === user.user_id ||
                          !(usernameDrafts[user.user_id] ?? "").trim() ||
                          (usernameDrafts[user.user_id] ?? "").trim() === (user.username ?? "")
                        }
                        onClick={() => void changeUsername(user)}
                      >
                        <Save size={11} />
                        {savingUsernameFor === user.user_id ? "Saving" : "Change"}
                      </button>
                    </div>
                  </div>

                  <div className="admin-user-control-block">
                    <label>Role</label>
                    <select
                      value={user.role}
                      onChange={(event) => {
                        void updateRole(
                          user.user_id,
                          event.target.value as UserRole
                        );
                      }}
                    >
                      <option value="user">user</option>
                      <option value="moderator">moderator</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  <div className="admin-user-control-block">
                    <label>Status</label>
                    <select
                      value={user.account_status}
                      onChange={(event) => {
                        void updateStatus(
                          user.user_id,
                          event.target.value as AccountStatus
                        );
                      }}
                    >
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="banned">banned</option>
                    </select>
                  </div>

                  {user.report_count > 0 && (
                    <div className="admin-user-control-block admin-user-report-control">
                      <label>Reports</label>
                      <button
                        className="admin-user-reports-button"
                        type="button"
                        onClick={() => void toggleReports(user)}
                      >
                        <Flag size={12} />
                        {expanded ? "Hide reports" : "View reports"}
                      </button>
                    </div>
                  )}
                </div>

                {user.report_count > 0 && (
                  <div className="admin-user-report-summary">
                    Latest report: {formatDate(user.latest_report_at)}
                  </div>
                )}

                {expanded && (
                  <div className="admin-user-report-details">
                    {reportLoadingFor === user.user_id ? (
                      <div className="admin-user-report-loading">Loading reports...</div>
                    ) : reports.length === 0 ? (
                      <div className="admin-user-report-loading">No report records found.</div>
                    ) : (
                      <>
                        <div className="admin-user-report-list">
                          {reports.map((report) => (
                            <div
                              className={
                                report.status === "open"
                                  ? "admin-user-report-item open"
                                  : "admin-user-report-item"
                              }
                              key={report.report_id}
                            >
                              <div className="admin-user-report-item-head">
                                <strong>{reportReasonLabel(report.reason)}</strong>
                                <span>{report.status}</span>
                                <span>{formatDate(report.created_at)}</span>
                              </div>

                              <div className="admin-user-report-reporter">
                                Reported by {report.reporter_username
                                  ? `@${report.reporter_username}`
                                  : report.reporter_display_name}
                              </div>

                              {report.details && <p>{report.details}</p>}
                            </div>
                          ))}
                        </div>

                        {reports.some((report) => report.status === "open") && (
                          <div className="admin-user-report-actions">
                            <button
                              type="button"
                              disabled={resolvingReportsFor === user.user_id}
                              onClick={() => void resolveReports(user.user_id, "reviewed")}
                            >
                              Mark reviewed
                            </button>

                            <button
                              type="button"
                              disabled={resolvingReportsFor === user.user_id}
                              onClick={() => void resolveReports(user.user_id, "dismissed")}
                            >
                              Dismiss reports
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <footer className="admin-users-pagination">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <ChevronLeft size={13} />
          Previous
        </button>

        <span>Page {page} of {pageCount}</span>

        <button
          type="button"
          disabled={loading || page >= pageCount}
          onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
        >
          Next
          <ChevronRight size={13} />
        </button>
      </footer>
    </section>
  );
}
