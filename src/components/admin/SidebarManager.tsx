import {
  useEffect,
  useState,
} from "react";

import {
  GripVertical,
  RotateCcw,
  Save,
  UserRound,
} from "lucide-react";

import {
  DEFAULT_SIDEBAR_ORDER,
  DEFAULT_WELCOME_BODY,
  DEFAULT_WELCOME_NOTE,
  getPromotableSidebarMembers,
  getSidebarSettings,
  saveSidebarSettings,
  type PromotedSidebarMember,
  type SidebarModuleKey,
} from "../../services/sidebarLayout";

import "./SidebarManager.css";


const LABELS:
Record<
  SidebarModuleKey,
  string
> = {
  welcome:
    "Member Spotlight / Welcome",

  shoutbox:
    "Shoutbox",

  online:
    "Who's Online",

  recent_comments:
    "Recent Comments",

  editorial:
    "From Editorial",

  popular:
    "Popular Posts",

  youtube_gems:
    "YouTube Gems",

  categories:
    "Categories",

  tags:
    "Tags",

  archives:
    "Archives",

  stats:
    "Site Stats",
};


export default function SidebarManager() {
  const [
    order,
    setOrder,
  ] =
    useState<
      SidebarModuleKey[]
    >(
      [
        ...DEFAULT_SIDEBAR_ORDER,
      ]
    );


  const [
    welcomeBody,
    setWelcomeBody,
  ] =
    useState(
      DEFAULT_WELCOME_BODY
    );


  const [
    welcomeNote,
    setWelcomeNote,
  ] =
    useState(
      DEFAULT_WELCOME_NOTE
    );


  const [
    promotedUserId,
    setPromotedUserId,
  ] =
    useState(
      ""
    );


  const [
    promotedMemberNote,
    setPromotedMemberNote,
  ] =
    useState(
      ""
    );


  const [
    members,
    setMembers,
  ] =
    useState<
      PromotedSidebarMember[]
    >(
      []
    );


  const [
    dragging,
    setDragging,
  ] =
    useState<
      SidebarModuleKey | null
    >(
      null
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  const [
    message,
    setMessage,
  ] =
    useState<
      string | null
    >(
      null
    );


  useEffect(
    () => {
      void Promise.all([
        getSidebarSettings(),
        getPromotableSidebarMembers(),
      ])
        .then(
          ([
            settings,
            nextMembers,
          ]) => {
            setOrder(
              settings.moduleOrder
            );

            setWelcomeBody(
              settings.welcomeBody
            );

            setWelcomeNote(
              settings.welcomeNote
            );

            setPromotedUserId(
              settings.promotedUserId ??
              ""
            );

            setPromotedMemberNote(
              settings.promotedMemberNote
            );

            setMembers(
              nextMembers
            );
          }
        )
        .catch(
          (
            error
          ) => {
            setMessage(
              error instanceof
                Error
                ? error.message
                : "Could not load homepage settings."
            );
          }
        );
    },
    []
  );


  const selectedMember =
    members.find(
      (
        member
      ) =>
        member.id ===
        promotedUserId
    ) ??
    null;


  const moveBefore =
    (
      target:
        SidebarModuleKey
    ) => {
      if (
        !dragging ||
        dragging ===
          target
      ) {
        return;
      }

      setOrder(
        (
          current
        ) => {
          const without =
            current.filter(
              (
                key
              ) =>
                key !==
                dragging
            );

          const targetIndex =
            without.indexOf(
              target
            );

          const next = [
            ...without,
          ];

          next.splice(
            targetIndex,
            0,
            dragging
          );

          return next;
        }
      );
    };


  const save =
    async () => {
      setSaving(
        true
      );

      setMessage(
        null
      );

      try {
        const saved =
          await saveSidebarSettings({
            moduleOrder:
              order,

            welcomeBody,

            welcomeNote,

            promotedUserId:
              promotedUserId ||
              null,

            promotedMemberNote,
          });

        setOrder(
          saved.moduleOrder
        );

        setWelcomeBody(
          saved.welcomeBody
        );

        setWelcomeNote(
          saved.welcomeNote
        );

        setPromotedUserId(
          saved.promotedUserId ??
          ""
        );

        setPromotedMemberNote(
          saved.promotedMemberNote
        );

        setMessage(
          saved.promotedMember
            ? `Front page now promotes @${saved.promotedMember.username}.`
            : "Member spotlight cleared. Welcome copy will show instead."
        );
      } catch (
        error
      ) {
        setMessage(
          error instanceof
            Error
            ? error.message
            : "Could not save homepage settings."
        );
      } finally {
        setSaving(
          false
        );
      }
    };


  return (
    <section className="sidebar-manager">
      <div className="admin-page-title">
        <span className="admin-eyebrow">
          FRONT PAGE SETTINGS
        </span>

        <h1>
          Right Sidebar
        </h1>

        <p>
          Pick a member to promote on the front page and drag the sidebar modules into the order you want them to appear.
        </p>
      </div>


      <section className="admin-panel sidebar-promoted-user-panel">
        <header className="admin-panel-header">
          <div>
            <span className="admin-eyebrow">
              MEMBER SPOTLIGHT
            </span>

            <h2>
              Promote a user page
            </h2>
          </div>
        </header>

        <div className="sidebar-promoted-user-fields">
          <label>
            <span>
              Front-page member
            </span>

            <select
              value={
                promotedUserId
              }
              onChange={
                (
                  event
                ) => {
                  setPromotedUserId(
                    event.target.value
                  );
                }
              }
            >
              <option value="">
                No promoted member — show Welcome box
              </option>

              {members.map(
                (
                  member
                ) => (
                  <option
                    key={
                      member.id
                    }
                    value={
                      member.id
                    }
                  >
                    @{member.username} — {member.displayName}
                  </option>
                )
              )}
            </select>
          </label>

          {selectedMember && (
            <>
              <div className="sidebar-promoted-user-preview">
                <div className="sidebar-promoted-user-avatar">
                  {selectedMember.avatarUrl ? (
                    <img
                      src={
                        selectedMember.avatarUrl
                      }
                      alt=""
                    />
                  ) : (
                    <UserRound
                      size={23}
                    />
                  )}
                </div>

                <div>
                  <strong>
                    @{selectedMember.username}
                  </strong>

                  <span>
                    {selectedMember.displayName}
                  </span>

                  <a
                    href={`/u/${selectedMember.username}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview member page »
                  </a>
                </div>
              </div>

              <label className="sidebar-promoted-user-note">
                <span>
                  Why we picked them
                </span>

                <textarea
                  value={
                    promotedMemberNote
                  }
                  maxLength={500}
                  placeholder="Why are we putting this person on the front page?"
                  onChange={
                    (
                      event
                    ) => {
                      setPromotedMemberNote(
                        event.target.value
                      );
                    }
                  }
                />

                <small>
                  {promotedMemberNote.length}/500 · leave blank to hide the reason box
                </small>
              </label>
            </>
          )}

          <p className="sidebar-promoted-user-help">
            When a user is selected, this replaces the old
            <strong> Welcome to UNFILTERED LOGS </strong>
            box with a
            <strong> MEMBER SPOTLIGHT </strong>
            linking directly to that user's page.
          </p>
        </div>
      </section>


      <section className="admin-panel sidebar-copy-panel">
        <header className="admin-panel-header">
          <div>
            <span className="admin-eyebrow">
              FALLBACK WELCOME BOX
            </span>

            <h2>
              Copy shown when nobody is promoted
            </h2>
          </div>
        </header>

        <div className="sidebar-copy-fields">
          <label>
            <span>
              Main text
            </span>

            <textarea
              value={
                welcomeBody
              }
              maxLength={500}
              onChange={
                (
                  event
                ) =>
                  setWelcomeBody(
                    event.target.value
                  )
              }
            />

            <small>
              {welcomeBody.length}/500
            </small>
          </label>

          <label>
            <span>
              Smaller note
            </span>

            <textarea
              value={
                welcomeNote
              }
              maxLength={280}
              onChange={
                (
                  event
                ) =>
                  setWelcomeNote(
                    event.target.value
                  )
              }
            />

            <small>
              {welcomeNote.length}/280
            </small>
          </label>
        </div>
      </section>


      <section className="admin-panel sidebar-order-panel">
        <header className="admin-panel-header">
          <div>
            <span className="admin-eyebrow">
              MODULE ORDER
            </span>

            <h2>
              Drag to sort
            </h2>
          </div>
        </header>

        <div className="sidebar-sort-list">
          {order.map(
            (
              key,
              index
            ) => (
              <div
                className={
                  dragging ===
                    key
                    ? "sidebar-sort-row dragging"
                    : "sidebar-sort-row"
                }
                draggable
                key={
                  key
                }
                onDragStart={
                  () =>
                    setDragging(
                      key
                    )
                }
                onDragOver={
                  (
                    event
                  ) => {
                    event.preventDefault();

                    moveBefore(
                      key
                    );
                  }
                }
                onDragEnd={
                  () =>
                    setDragging(
                      null
                    )
                }
              >
                <GripVertical
                  size={17}
                />

                <span className="sidebar-sort-position">
                  {index + 1}
                </span>

                <strong>
                  {LABELS[key]}
                </strong>
              </div>
            )
          )}
        </div>
      </section>


      <div className="sidebar-manager-actions">
        <button
          type="button"
          onClick={
            () => {
              setOrder(
                [
                  ...DEFAULT_SIDEBAR_ORDER,
                ]
              );

              setWelcomeBody(
                DEFAULT_WELCOME_BODY
              );

              setWelcomeNote(
                DEFAULT_WELCOME_NOTE
              );

              setPromotedUserId(
                ""
              );

              setPromotedMemberNote(
                ""
              );

              setMessage(
                null
              );
            }
          }
        >
          <RotateCcw
            size={14}
          />

          Reset
        </button>

        <button
          className="primary"
          type="button"
          disabled={
            saving
          }
          onClick={
            () =>
              void save()
          }
        >
          <Save
            size={14}
          />

          {saving
            ? "Saving..."
            : "Save changes"}
        </button>
      </div>

      {message && (
        <div className="sidebar-manager-message">
          {message}
        </div>
      )}
    </section>
  );
}
