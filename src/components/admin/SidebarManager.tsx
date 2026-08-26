import { useEffect, useState } from "react";
import { GripVertical, RotateCcw, Save } from "lucide-react";
import {
  DEFAULT_SIDEBAR_ORDER,
  DEFAULT_WELCOME_BODY,
  DEFAULT_WELCOME_NOTE,
  getSidebarSettings,
  saveSidebarSettings,
  type SidebarModuleKey,
} from "../../services/sidebarLayout";
import "./SidebarManager.css";

const LABELS: Record<SidebarModuleKey, string> = {
  welcome: "Welcome to UNFILTERED LOGS",
  shoutbox: "Shoutbox",
  online: "Who's Online",
  recent_comments: "Recent Comments",
  editorial: "From Editorial",
  popular: "Popular Posts",
  youtube_gems: "YouTube Gems",
  categories: "Categories",
  tags: "Tags",
  archives: "Archives",
  stats: "Site Stats",
};

export default function SidebarManager() {
  const [order, setOrder] =
    useState<SidebarModuleKey[]>([...DEFAULT_SIDEBAR_ORDER]);
  const [welcomeBody, setWelcomeBody] = useState(DEFAULT_WELCOME_BODY);
  const [welcomeNote, setWelcomeNote] = useState(DEFAULT_WELCOME_NOTE);
  const [dragging, setDragging] = useState<SidebarModuleKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getSidebarSettings()
      .then((settings) => {
        setOrder(settings.moduleOrder);
        setWelcomeBody(settings.welcomeBody);
        setWelcomeNote(settings.welcomeNote);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load homepage settings."
        );
      });
  }, []);

  const moveBefore = (target: SidebarModuleKey) => {
    if (!dragging || dragging === target) return;

    setOrder((current) => {
      const without = current.filter((key) => key !== dragging);
      const targetIndex = without.indexOf(target);
      const next = [...without];
      next.splice(targetIndex, 0, dragging);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const saved = await saveSidebarSettings({
        moduleOrder: order,
        welcomeBody,
        welcomeNote,
      });

      setOrder(saved.moduleOrder);
      setWelcomeBody(saved.welcomeBody);
      setWelcomeNote(saved.welcomeNote);
      setMessage("Homepage sidebar settings saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save homepage settings."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="sidebar-manager">
      <div className="admin-page-title">
        <span className="admin-eyebrow">FRONT PAGE SETTINGS</span>
        <h1>Right Sidebar</h1>
        <p>
          Edit the Welcome box and drag the sidebar modules into the order you want them to appear.
        </p>
      </div>

      <section className="admin-panel sidebar-copy-panel">
        <header className="admin-panel-header">
          <div>
            <span className="admin-eyebrow">WELCOME BOX</span>
            <h2>Homepage copy</h2>
          </div>
        </header>

        <div className="sidebar-copy-fields">
          <label>
            <span>Main text</span>
            <textarea
              value={welcomeBody}
              maxLength={500}
              onChange={(event) => setWelcomeBody(event.target.value)}
            />
            <small>{welcomeBody.length}/500</small>
          </label>

          <label>
            <span>Smaller note</span>
            <textarea
              value={welcomeNote}
              maxLength={280}
              onChange={(event) => setWelcomeNote(event.target.value)}
            />
            <small>{welcomeNote.length}/280</small>
          </label>
        </div>
      </section>

      <section className="admin-panel sidebar-order-panel">
        <header className="admin-panel-header">
          <div>
            <span className="admin-eyebrow">MODULE ORDER</span>
            <h2>Drag to sort</h2>
          </div>
        </header>

        <div className="sidebar-sort-list">
          {order.map((key, index) => (
            <div
              className={dragging === key ? "sidebar-sort-row dragging" : "sidebar-sort-row"}
              draggable
              key={key}
              onDragStart={() => setDragging(key)}
              onDragOver={(event) => {
                event.preventDefault();
                moveBefore(key);
              }}
              onDragEnd={() => setDragging(null)}
            >
              <GripVertical size={17} />
              <span className="sidebar-sort-position">{index + 1}</span>
              <strong>{LABELS[key]}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="sidebar-manager-actions">
        <button
          type="button"
          onClick={() => {
            setOrder([...DEFAULT_SIDEBAR_ORDER]);
            setWelcomeBody(DEFAULT_WELCOME_BODY);
            setWelcomeNote(DEFAULT_WELCOME_NOTE);
            setMessage(null);
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>

        <button
          className="primary"
          type="button"
          disabled={saving}
          onClick={() => void save()}
        >
          <Save size={14} /> {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {message && <div className="sidebar-manager-message">{message}</div>}
    </section>
  );
}
