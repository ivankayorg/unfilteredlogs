import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
} from "lucide-react";

import {
  getAdminUsers,
  setAccountStatus,
  setUserRole,
} from "../../services/admin";

import type {
  AccountStatus,
  AdminUser,
  UserRole,
} from "../../types/admin";


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


  const load =
    async () => {
      setLoading(true);
      setError(null);

      try {
        setUsers(
          await getAdminUsers()
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
                      <strong>
                        {user.username
                          ? `@${user.username}`
                          : user.display_name}
                      </strong>
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
