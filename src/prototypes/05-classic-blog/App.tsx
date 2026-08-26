import { useMemo, useState } from "react";
import "./App.css";

type PostType = "video" | "gif" | "text" | "image";

type Post = {
  id: number;
  type: PostType;
  title: string;
  author: string;
  time: string;
  body?: string;
  media?: string;
  reactions: number;
  comments: number;
  tags: string[];
};

const featured: Post[] = [
  {
    id: 1,
    type: "video",
    title: "Someone rebuilt a 1998 computer lab and it still smells like hot plastic",
    author: "modem_noise",
    time: "22 min ago",
    media:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    reactions: 128,
    comments: 34,
    tags: ["video", "nostalgia"],
  },
  {
    id: 2,
    type: "gif",
    title: "Production after changing one line of CSS",
    author: "root_user",
    time: "39 min ago",
    media:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=80",
    reactions: 93,
    comments: 18,
    tags: ["gif", "dev"],
  },
  {
    id: 3,
    type: "text",
    title: "I miss websites that looked like somebody actually owned them",
    author: "ivan",
    time: "1 hr ago",
    body:
      "Not a brand system. Not a conversion funnel. Just a weird little corner of the internet with a person behind it.",
    reactions: 211,
    comments: 67,
    tags: ["thoughts", "internet"],
  },
];

const initialPosts: Post[] = [
  {
    id: 101,
    type: "video",
    title: "The last independently owned video store in town",
    author: "deadpixel",
    time: "1 hr ago",
    body:
      "A twelve-minute mini documentary about a place that somehow survived streaming, rent increases, and the death of Friday-night browsing.",
    media:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    reactions: 84,
    comments: 23,
    tags: ["video", "culture"],
  },
  {
    id: 102,
    type: "text",
    title: "You do not need an algorithm for everything",
    author: "analogkid",
    time: "1 hr ago",
    body:
      "Sometimes I just want to see what somebody posted because they thought it was interesting. No engagement optimization. No growth strategy. No funnel. Just a person saying: hey, look at this.",
    reactions: 166,
    comments: 51,
    tags: ["thoughts", "internet"],
  },
  {
    id: 103,
    type: "gif",
    title: "When production works on the first deploy",
    author: "root_user",
    time: "2 hrs ago",
    media:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    reactions: 94,
    comments: 12,
    tags: ["gif", "dev"],
  },
  {
    id: 104,
    type: "image",
    title: "A mall directory that has not been updated since 2003",
    author: "fluorescentbuzz",
    time: "2 hrs ago",
    body:
      "Half the stores are gone. The map is still glowing. Somehow that makes it better.",
    media:
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80",
    reactions: 141,
    comments: 34,
    tags: ["photo", "nostalgia"],
  },
];

const recentComments = [
  ["packetloss", "This is exactly why I still miss forums.", "3m"],
  ["ghosttab", "The sidebar counters are doing something to my brain.", "8m"],
  ["cassettekid", "I forgot how much I liked compact websites.", "14m"],
  ["terminalblue", "Clicked for the video, stayed for the comments.", "21m"],
];

const popular = [
  ["AOL sounds still trigger something in my brain", 188],
  ["Someone made Windows 98 run in a browser", 147],
  ["The weirdest local TV commercial I've ever seen", 129],
  ["Things old forums did better", 118],
  ["Show us your desktop", 96],
];

const onlineUsers = [
  "ivan",
  "root_user",
  "ghosttab",
  "packetloss",
  "cassettekid",
  "terminalblue",
  "deadpixel",
];

const tags = [
  "video",
  "gif",
  "internet",
  "nostalgia",
  "dev",
  "music",
  "weird",
  "photo",
  "culture",
];

function TypeBadge({ type }: { type: PostType }) {
  return <span className={`type-badge type-${type}`}>{type.toUpperCase()}</span>;
}

function ReactionButton({ start }: { start: number }) {
  const [active, setActive] = useState(false);
  const count = start + (active ? 1 : 0);

  return (
    <button
      className={active ? "post-action reacted" : "post-action"}
      type="button"
      onClick={() => setActive((value) => !value)}
    >
      {active ? "♥" : "♡"} {count}
    </button>
  );
}

function SaveButton() {
  const [saved, setSaved] = useState(false);

  return (
    <button
      className={saved ? "post-action saved" : "post-action"}
      type="button"
      onClick={() => setSaved((value) => !value)}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}

function FeedPost({ post }: { post: Post }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <article className="blog-post">
      <div className="post-titlebar">
        <div className="post-titlewrap">
          <TypeBadge type={post.type} />
          <h2>{post.title}</h2>
        </div>
        <button className="post-menu" type="button" aria-label="Post options">
          •••
        </button>
      </div>

      <div className="post-byline">
        <span className="mini-avatar">{post.author.slice(0, 2).toUpperCase()}</span>
        <span>
          posted by <a href="#author">{post.author}</a>
          <em> · {post.time}</em>
        </span>
        <a className="permalink" href={`#post-${post.id}`}>
          permalink
        </a>
      </div>

      {post.media && (
        <div className={`post-media media-${post.type}`}>
          <img src={post.media} alt="" />
          {post.type === "video" && !playing && (
            <button
              className="video-play"
              type="button"
              aria-label="Play video"
              onClick={() => setPlaying(true)}
            >
              ▶
            </button>
          )}
          {post.type === "video" && playing && (
            <div className="playing-overlay">
              <strong>VIDEO PLAYER</strong>
              <span>Prototype playback state</span>
              <button type="button" onClick={() => setPlaying(false)}>
                Close
              </button>
            </div>
          )}
          {post.type === "gif" && <span className="gif-corner">GIF</span>}
        </div>
      )}

      {post.body && <p className="post-body">{post.body}</p>}

      <div className="tag-row">
        <span>Filed under:</span>
        {post.tags.map((tag) => (
          <a href={`#${tag}`} key={tag}>
            {tag}
          </a>
        ))}
      </div>

      <footer className="post-footer">
        <ReactionButton start={post.reactions} />
        <button
          className={commentsOpen ? "post-action active" : "post-action"}
          type="button"
          onClick={() => setCommentsOpen((value) => !value)}
        >
          💬 {post.comments} comments
        </button>
        <button className="post-action" type="button">
          ↗ Share
        </button>
        <SaveButton />
      </footer>

      {commentsOpen && (
        <div className="inline-comments">
          <div className="comments-heading">
            <strong>Latest comments</strong>
            <button type="button" onClick={() => setCommentsOpen(false)}>
              hide
            </button>
          </div>

          <div className="inline-comment">
            <span className="comment-avatar">PL</span>
            <div>
              <strong>packetloss</strong>
              <span>11 min ago</span>
              <p>This is the kind of thing I actually want to stumble across online.</p>
            </div>
          </div>

          <div className="inline-comment">
            <span className="comment-avatar">GT</span>
            <div>
              <strong>ghosttab</strong>
              <span>4 min ago</span>
              <p>Also: the compact layout is way easier to scan.</p>
            </div>
          </div>

          <div className="comment-box">
            <input placeholder="Leave a comment..." />
            <button type="button">Post Comment</button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState("Home");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [shout, setShout] = useState("");
  const [shouts, setShouts] = useState([
    "ghosttab: anybody else still use Winamp?",
    "ivan: it really whips the llama's ass.",
    "root_user: production is technically alive.",
  ]);

  const visiblePosts = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return initialPosts.filter((post) => {
      const matchesTag = activeTag === "all" || post.tags.includes(activeTag);
      const haystack = `${post.title} ${post.body ?? ""} ${post.author} ${post.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      return matchesTag && matchesQuery;
    });
  }, [activeTag, query]);

  const addShout = () => {
    const value = shout.trim();
    if (!value) return;
    setShouts((current) => [`ivan: ${value}`, ...current].slice(0, 4));
    setShout("");
  };

  return (
    <div className="classic-site" id="top">
      <header className="top-shell">
        <div className="brand-row site-width">
          <a className="site-title" href="#top">
            <span className="site-logo">UL</span>
            <span className="site-wordmark">
              <strong>UNFILTERED LOGS</strong>
              <small>people posting things worth seeing since right now</small>
            </span>
          </a>

          <div className="top-right">
            <span className="welcome-text">
              Welcome back, <a href="#profile">ivan</a>.
            </span>
            <button className="new-log" type="button">
              + New Log
            </button>
            <button className="user-chip" type="button">
              IK ▾
            </button>
          </div>
        </div>

        <nav className="nav-bar" aria-label="Primary navigation">
          <div className="site-width nav-inner">
            <div className="nav-links">
              {["Home", "Logs", "Editorial", "Forum", "Members"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={activeNav === item ? "active" : ""}
                  onClick={() => setActiveNav(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="header-search">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search logs..."
                aria-label="Search logs"
              />
              <button type="button" onClick={() => setQuery("")}>
                Search
              </button>
            </div>
          </div>
        </nav>

        <div className="status-strip">
          <div className="site-width status-inner">
            <span>
              <strong>46</strong> users online
            </span>
            <span>
              <strong>2,418</strong> logs posted
            </span>
            <span>
              Last new member: <a href="#member">dialupdreams</a>
            </span>
            <a className="random-link" href="#random">
              Random Log
            </a>
          </div>
        </div>
      </header>

      <main className="site-width page-body">
        <section className="featured-box">
          <div className="box-heading">
            <strong>POSTED TO THE FRONT PAGE</strong>
            <span>picked by the moderators · updated whenever something good shows up</span>
          </div>

          <div className="featured-strip">
            {featured.map((post) => (
              <article className="featured-post" key={post.id}>
                <div className="featured-preview">
                  {post.media ? (
                    <img src={post.media} alt="" />
                  ) : (
                    <div className="featured-text-preview">
                      <span>“</span>
                      <p>{post.body}</p>
                    </div>
                  )}
                  <TypeBadge type={post.type} />
                  {post.type === "video" && <span className="small-play">▶</span>}
                </div>

                <div className="featured-info">
                  <a className="featured-title" href="#featured">
                    {post.title}
                  </a>
                  <div className="featured-meta">
                    <span>
                      by <a href="#author">{post.author}</a>
                    </span>
                    <span>{post.time}</span>
                  </div>
                  <div className="featured-stats">
                    <span>♥ {post.reactions}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="layout-columns">
          <section className="main-column">
            <div className="feed-heading">
              <div>
                <h1>Recent Logs</h1>
                <span>Newest posts from everybody.</span>
              </div>

              <div className="view-controls">
                {[
                  ["all", "All"],
                  ["video", "Video"],
                  ["gif", "GIF"],
                  ["thoughts", "Text"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={activeTag === value ? "active" : ""}
                    onClick={() => setActiveTag(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="post-stack">
              {visiblePosts.length > 0 ? (
                visiblePosts.map((post) => <FeedPost key={post.id} post={post} />)
              ) : (
                <div className="empty-state">
                  No logs match that search. The old web would have just given you a 404.
                </div>
              )}
            </div>

            <div className="pager">
              <button type="button" disabled>
                ← Newer
              </button>
              <span>Page 1 of 243</span>
              <button type="button">Older →</button>
            </div>
          </section>

          <aside className="sidebar">
            <section className="side-box welcome-box">
              <div className="side-title">WELCOME TO UNFILTERED LOGS</div>
              <div className="side-content">
                <p>
                  A community blog for videos, GIFs, stories, images, links, and whatever else somebody thought was worth sharing.
                </p>
                <p className="small-note">
                  No algorithmic feed. No influencer tiers. No inspirational LinkedIn voice.
                </p>
                <a href="#about">What is this place? »</a>
              </div>
            </section>

            <section className="side-box shoutbox">
              <div className="side-title">
                SHOUTBOX
                <span className="side-live">LIVE</span>
              </div>
              <div className="shout-list">
                {shouts.map((item, index) => (
                  <p key={`${item}-${index}`}>{item}</p>
                ))}
              </div>
              <div className="shout-form">
                <input
                  value={shout}
                  onChange={(event) => setShout(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addShout();
                  }}
                  placeholder="say something..."
                />
                <button type="button" onClick={addShout}>
                  Go
                </button>
              </div>
            </section>

            <section className="side-box">
              <div className="side-title">WHO'S ONLINE</div>
              <div className="online-users">
                {onlineUsers.map((user) => (
                  <a href="#online" key={user}>
                    <span className="online-dot" />
                    {user}
                  </a>
                ))}
                <span className="online-more">+39 more</span>
              </div>
            </section>

            <section className="side-box">
              <div className="side-title">POPULAR THIS WEEK</div>
              <ol className="popular-list">
                {popular.map(([title, score], index) => (
                  <li key={title}>
                    <span>{index + 1}.</span>
                    <a href="#popular">{title}</a>
                    <strong>{score}</strong>
                  </li>
                ))}
              </ol>
            </section>

            <section className="side-box">
              <div className="side-title">RECENT COMMENTS</div>
              <div className="comment-list">
                {recentComments.map(([user, comment, time]) => (
                  <div className="side-comment" key={`${user}-${comment}`}>
                    <div>
                      <a href="#user">{user}</a>
                      <span>{time}</span>
                    </div>
                    <p>{comment}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="side-box">
              <div className="side-title">TAGS</div>
              <div className="tag-cloud">
                {tags.map((tag, index) => (
                  <button
                    type="button"
                    key={tag}
                    className={`tag-size-${(index % 3) + 1} ${activeTag === tag ? "active" : ""}`}
                    onClick={() => setActiveTag(activeTag === tag ? "all" : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            <section className="side-box">
              <div className="side-title">ARCHIVES</div>
              <div className="archive-list">
                <a href="#aug">August 2026 <span>214</span></a>
                <a href="#jul">July 2026 <span>183</span></a>
                <a href="#jun">June 2026 <span>196</span></a>
                <a href="#may">May 2026 <span>174</span></a>
              </div>
            </section>

            <section className="side-box stats-box">
              <div className="side-title">SITE STATS</div>
              <dl>
                <div><dt>Members</dt><dd>387</dd></div>
                <div><dt>Logs</dt><dd>2,418</dd></div>
                <div><dt>Comments</dt><dd>9,304</dd></div>
                <div><dt>Online</dt><dd>46</dd></div>
              </dl>
            </section>

            <section className="side-box">
              <div className="side-title">LINKS WE LIKE</div>
              <div className="side-content link-stack">
                <a href="#link">The Old Net</a>
                <a href="#link">Internet Archive</a>
                <a href="#link">Somebody's weird homepage</a>
                <a href="#link">Random blog from 2008</a>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="classic-footer">
        <div className="site-width footer-inner">
          <div>
            <strong>UNFILTERED LOGS</strong>
            <span>Built like the old web. Behaves like the new one.</span>
          </div>
          <nav>
            <a href="#about">About</a>
            <a href="#rules">Rules</a>
            <a href="#privacy">Privacy</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
