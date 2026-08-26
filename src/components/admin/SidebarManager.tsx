import {
  useEffect,
  useState,
} from "react";

import {
  GripVertical,
  RotateCcw,
  Save,
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


/* ==========================================================
   SIDEBAR 001
   FRONT PAGE SETTINGS EDITOR
   ========================================================== */


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


export type SidebarManagerView =
  | "spotlight"
  | "welcome"
  | "order"
  | "all";


type Props = {
  view:
    SidebarManagerView;
};


function getPageTitle(
  view:
    SidebarManagerView,
) {
  if (
    view ===
    "spotlight"
  ) {
    return {
      eyebrow:
        "FRONT PAGE",

      title:
        "Member Spotlight",

      description:
        "Choose the member promoted on the homepage and explain why we picked them.",
    };
  }

  if (
    view ===
    "welcome"
  ) {
    return {
      eyebrow:
        "FRONT PAGE",

      title:
        "Welcome Copy",

      description:
        "Edit the fallback Welcome box shown when no member is being promoted.",
    };
  }

  if (
    view ===
    "order"
  ) {
    return {
      eyebrow:
        "FRONT PAGE",

      title:
        "Right Rail Order",

      description:
        "Drag the homepage right-rail modules into the order you want visitors to see them.",
    };
  }

  return {
    eyebrow:
      "FRONT PAGE SETTINGS",

    title:
      "All Front Page Settings",

    description:
      "Member Spotlight, fallback Welcome copy, and the complete right-rail module order in one editor.",
  };
}


export default function SidebarManager({
  view,
}: Props) {
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


  const pageTitle =
    getPageTitle(
      view
    );


  const showSpotlight =
    view ===
      "spotlight" ||
    view ===
      "all";


  const showWelcome =
    view ===
      "welcome" ||
    view ===
      "all";


  const showOrder =
    view ===
      "order" ||
    view ===
      "all";


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


  const resetVisiblePage =
    () => {
      setMessage(
        null
      );

      if (
        view ===
        "spotlight"
      ) {
        setPromotedUserId(
          ""
        );

        setPromotedMemberNote(
          ""
        );

        return;
      }

      if (
        view ===
        "welcome"
      ) {
        setWelcomeBody(
          DEFAULT_WELCOME_BODY
        );

        setWelcomeNote(
          DEFAULT_WELCOME_NOTE
        );

        return;
      }

      if (
        view ===
        "order"
      ) {
        setOrder(
          [
            ...DEFAULT_SIDEBAR_ORDER,
          ]
        );

        return;
      }

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
          view ===
            "spotlight"
            ? saved.promotedMember
              ? `Member Spotlight saved: @${saved.promotedMember.username}.`
              : "Member Spotlight cleared. The fallback Welcome box will show."
            : view ===
                "welcome"
              ? "Welcome copy saved."
              : view ===
                  "order"
                ? "Right Rail order saved."
                : "Front page settings saved."
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
    <section
      className={`sidebar-manager sidebar-manager-${view}`}
    >
      <div className="admin-page-title">
        <span className="admin-eyebrow">
          {pageTitle.eyebrow}
        </span>

        <h1>
          {pageTitle.title}
        </h1>

        <p>
          {pageTitle.description}
        </p>
      </div>


      {showSpotlight && (
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
                    <img
                      className={
                        !selectedMember.avatarUrl
                          ? "ul-avatar-fallback-image"
                          : undefined
                      }
                      src={
                        selectedMember.avatarUrl ??
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
              When a user is selected, this replaces the fallback
              <strong> Welcome to UNFILTERED LOGS </strong>
              box with the
              <strong> MEMBER SPOTLIGHT </strong>
              linking directly to that user's page.
            </p>
          </div>
        </section>
      )}


      {showWelcome && (
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
      )}


      {showOrder && (
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
      )}


      <div className="sidebar-manager-actions">
        <button
          type="button"
          onClick={
            resetVisiblePage
          }
        >
          <RotateCcw
            size={14}
          />

          {view ===
            "all"
            ? "Reset all"
            : "Reset page"}
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
