import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  Save,
} from "lucide-react";

import {
  adminChangeUsername,
  getAdminUsers,
  setAccountStatus,
  setUserRole,
} from "../../services/admin";

import type {
  AccountStatus,
  AdminUser,
  UserRole,
} from "../../types/admin";

import "./AdminUsers.css";


/* ==========================================================
   UNFILTERED LOGS
   ADMIN USERS
   ========================================================== */


export default function AdminUsers() {
  const [
    users,
    setUsers,
  ] =
    useState<AdminUser[]>(
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
    usernameDrafts,
    setUsernameDrafts,
  ] =
    useState<
      Record<
        string,
        string
      >
    >(
      {}
    );


  const [
    savingUsernameFor,
    setSavingUsernameFor,
  ] =
    useState<string | null>(
      null
    );


  const load =
    async () => {
      setLoading(true);
      setError(null);

      try {
        const nextUsers =
          await getAdminUsers();

        setUsers(
          nextUsers
        );

        setUsernameDrafts(
          Object.fromEntries(
            nextUsers.map(
              (
                user
              ) => [
                user.user_id,
                user.username ??
                "",
              ]
            )
          )
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load users."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const changeUsername =
    async (
      user:
        AdminUser,
    ) => {
      const draft =
        usernameDrafts[
          user.user_id
        ] ??
        "";

      setError(
        null
      );

      setSavingUsernameFor(
        user.user_id
      );

      try {
        const changed =
          await adminChangeUsername(
            user.user_id,
            draft
          );

        setUsers(
          (
            current
          ) =>
            current.map(
              (
                currentUser
              ) =>
                currentUser.user_id ===
                user.user_id
                  ? {
                      ...currentUser,

                      username:
                        changed,

                      display_name:
                        changed,
                    }
                  : currentUser
            )
        );

        setUsernameDrafts(
          (
            current
          ) => ({
            ...current,

            [user.user_id]:
              changed,
          })
        );
      } catch (
        nextError
      ) {
        setError(
          nextError instanceof
            Error
            ? nextError.message
            : "Could not change username."
        );
      } finally {
        setSavingUsernameFor(
          null
        );
      }
    };


  const updateRole =
    async (
      userId: string,
      role: UserRole
    ) => {
      try {
        await setUserRole(
          userId,
          role
        );

        setUsers(
          (
            current
          ) =>
            current.map(
              (
                user
              ) =>
                user.user_id ===
                userId
                  ? {
                      ...user,
                      role,
                    }
                  : user
            )
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not change role."
        );
      }
    };


  const updateStatus =
    async (
      userId: string,
      account_status:
        AccountStatus
    ) => {
      try {
        await setAccountStatus(
          userId,
          account_status
        );

        setUsers(
          (
            current
          ) =>
            current.map(
              (
                user
              ) =>
                user.user_id ===
                userId
                  ? {
                      ...user,
                      account_status,
                    }
                  : user
            )
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not change account status."
        );
      }
    };


  return (
    <section className="admin-panel">
      <header className="admin-panel-header">
        <div>
          <span className="admin-eyebrow">
            ACCOUNTS
          </span>

          <h2>
            Users
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
          Loading users...
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  User
                </th>

                <th>
                  Username
                </th>

                <th>
                  Email
                </th>

                <th>
                  Provider
                </th>

                <th>
                  Confirmed
                </th>

                <th>
                  Role
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map(
                (
                  user
                ) => (
                  <tr
                    key={
                      user.user_id
                    }
                  >
                    <td>
                      {user.username ? (
                        <a
                          className="admin-user-profile-link"
                          href={`/u/${encodeURIComponent(user.username)}`}
                          target="_blank"
                          rel="noreferrer"
                          title={`Open @${user.username}'s public page`}
                        >
                          {user.display_name}
                        </a>
                      ) : (
                        <strong>
                          {user.display_name}
                        </strong>
                      )}
                    </td>

                    <td className="admin-username-cell">
                      <div className="admin-username-editor">
                        <span>
                          @
                        </span>

                        <input
                          value={
                            usernameDrafts[
                              user.user_id
                            ] ??
                            ""
                          }
                          maxLength={24}
                          aria-label={
                            `Username for ${user.display_name}`
                          }
                          onChange={
                            (
                              event
                            ) => {
                              setUsernameDrafts(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  [user.user_id]:
                                    event.target.value,
                                })
                              );
                            }
                          }
                        />

                        <button
                          type="button"
                          title="Admin override: change username regardless of the 30-day user cooldown."
                          disabled={
                            savingUsernameFor ===
                              user.user_id ||
                            !(
                              usernameDrafts[
                                user.user_id
                              ] ??
                              ""
                            ).trim() ||
                            (
                              usernameDrafts[
                                user.user_id
                              ] ??
                              ""
                            ).trim() ===
                              (
                                user.username ??
                                ""
                              )
                          }
                          onClick={() => {
                            void changeUsername(
                              user
                            );
                          }}
                        >
                          <Save
                            size={11}
                          />

                          {savingUsernameFor ===
                            user.user_id
                            ? "Saving"
                            : "Change"}
                        </button>
                      </div>

                      <div className="admin-username-help-row">
                        <small>
                          Admin override · resets user cooldown
                        </small>

                        {user.username && (
                          <a
                            href={`/u/${encodeURIComponent(user.username)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View @{user.username}'s page »
                          </a>
                        )}
                      </div>
                    </td>

                    <td>
                      {user.email ??
                        "—"}
                    </td>

                    <td>
                      {user.provider ??
                        "—"}
                    </td>

                    <td>
                      {user.email_confirmed_at
                        ? "Yes"
                        : "No"}
                    </td>

                    <td>
                      <select
                        value={
                          user.role
                        }
                        onChange={
                          (
                            event
                          ) => {
                            void updateRole(
                              user.user_id,
                              event.target
                                .value as
                                UserRole
                            );
                          }
                        }
                      >
                        <option value="user">
                          user
                        </option>

                        <option value="moderator">
                          moderator
                        </option>

                        <option value="admin">
                          admin
                        </option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={
                          user.account_status
                        }
                        onChange={
                          (
                            event
                          ) => {
                            void updateStatus(
                              user.user_id,
                              event.target
                                .value as
                                AccountStatus
                            );
                          }
                        }
                      >
                        <option value="active">
                          active
                        </option>

                        <option value="suspended">
                          suspended
                        </option>

                        <option value="banned">
                          banned
                        </option>
                      </select>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
