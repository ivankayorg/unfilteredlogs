import { useState } from "react";
import "./App.css";

type FeaturedPost = {
  id: number;
  type: "VIDEO" | "GIF" | "TEXT";
  title: string;
  author: string;
  time: string;
  comments: number;
  reactions: number;
  image?: string;
  label?: string;
};

type FeedPost = {
  id: number;
  type: "VIDEO" | "GIF" | "TEXT";
  title: string;
  body?: string;
  author: string;
  time: string;
  comments: number;
  reactions: number;
  image?: string;
  tag: string;
};

const featuredPosts: FeaturedPost[] = [
  {
    id: 1,
    type: "VIDEO",
    title: "The internet was better when every site looked a little bit weird",
    author: "ivan",
    time: "18 min ago",
    comments: 42,
    reactions: 128,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    label: "FEATURED VIDEO",
  },
  {
    id: 2,
    type: "GIF",
    title: "This is the exact amount of chaos I expect from a Tuesday",
    author: "deadpixel",
    time: "31 min ago",
    comments: 19,
    reactions: 76,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    label: "FRONT PAGE",
  },
  {
    id: 3,
    type: "TEXT",
    title: "Bring back websites that actually feel like somebody lives there",
    author: "nix0n",
    time: "54 min ago",
    comments: 67,
    reactions: 203,
    label: "EDITOR'S PICK",
  },
];

const feedPosts: FeedPost[] = [
  {
    id: 101,
    type: "VIDEO",
    title: "A tiny documentary about the last independently owned video store in town",
    author: "modem_noise",
    time: "1 hr ago",
    comments: 23,
    reactions: 84,
    tag: "video",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 102,
    type: "TEXT",
    title: "You don't need an algorithm for everything",
    body: "Sometimes I just want to see what somebody posted because they thought it was interesting. No engagement optimization. No growth strategy. No funnel. Just a person saying: hey, look at this.",
    author: "analogkid",
    time: "1 hr ago",
    comments: 51,
    reactions: 166,
    tag: "thoughts",
  },
  {
    id: 103,
    type: "GIF",
    title: "When production works on the first deploy",
    author: "root_user",
    time: "2 hrs ago",
    comments: 12,
    reactions: 94,
    tag: "gif",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: 104,
    type: "VIDEO",
    title: "Someone restored a 1999 web portal and it is glorious",
    author: "hyperlink",
    time: "2 hrs ago",
    comments: 34,
    reactions: 141,
    tag: "internet",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=700&q=80",
  },
];

const popular = [
  ["AOL instant messenger sounds still trigger something in my brain", 188],
  ["This abandoned mall still has its directory lit up", 147],
  ["The weirdest local TV commercial I've ever seen", 129],
  ["Someone made Windows 98 run in a browser", 118],
  ["Why did every forum signature have flames?", 96],
];

const categories = [
  ["Videos", 128],
  ["GIFs", 84],
  ["Internet", 63],
  ["Technology", 57],
  ["Nostalgia", 44],
  ["Music", 39],
  ["Stories", 28],
];

const threads = [
  ["What was your first website?", 74],
  ["Best software that got worse?", 61],
  ["Things you miss about old forums", 52],
  ["Desktop screenshots thread", 39],
];

export default function App() {
  const [activeNav, setActiveNav] = useState("Logs");
  const [filter, setFilter] = useState("Everything");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" type="button">
            <span className="brand-mark">UL</span>
            <span className="brand-copy">
              <strong>UNFILTERED LOG</strong>
              <small>the interesting part of the internet</small>
            </span>
          </button>

          <nav className="main-nav" aria-label="Primary navigation">
            {["Logs", "Editorial", "Forum"].map((item) => (
              <button
                key={item}
                className={activeNav === item ? "nav-link active" : "nav-link"}
                onClick={() => setActiveNav(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((value) => !value)}
            >
              ⌕
            </button>
            <button className="new-log-button" type="button">
              + New Log
            </button>
            <button className="avatar-button" type="button">
              IK
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-strip">
            <input autoFocus placeholder="Search logs, users, tags..." />
            <button type="button" onClick={() => setSearchOpen(false)}>
              Close
            </button>
          </div>
        )}
      </header>

      <div className="utility-bar">
        <div className="utility-inner">
          <span>
            <strong>UNFILTERED LOG</strong> / FRONT PAGE
          </span>
          <div className="utility-links">
            <button type="button">About</button>
            <button type="button">Rules</button>
            <button type="button">Random Log</button>
          </div>
        </div>
      </div>

      <main className="page">
        <section className="featured-section">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">CURATED</span>
              <h1>Front Page</h1>
            </div>
            <p>Three things worth seeing before you disappear into the feed.</p>
          </div>

          <div className="featured-grid">
            {featuredPosts.map((post) => (
              <article className={`featured-card featured-${post.type.toLowerCase()}`} key={post.id}>
                <div className="featured-media">
                  {post.image ? (
                    <img src={post.image} alt="" />
                  ) : (
                    <div className="text-feature-backdrop">
                      <span>"</span>
                      <p>THE WEB SHOULD FEEL HUMAN AGAIN.</p>
                    </div>
                  )}

                  <div className="featured-overlay" />

                  <div className="featured-topline">
                    <span className="content-type">{post.type}</span>
                    <span className="feature-label">{post.label}</span>
                  </div>

                  {post.type === "VIDEO" && (
                    <button className="play-button" type="button" aria-label="Play video">
                      ▶
                    </button>
                  )}

                  <div className="featured-copy">
                    <h2>{post.title}</h2>
                    <div className="post-meta inverse">
                      <span>@{post.author}</span>
                      <span>{post.time}</span>
                    </div>
                  </div>
                </div>

                <div className="featured-footer">
                  <span>♥ {post.reactions}</span>
                  <span>● {post.comments} comments</span>
                  <button type="button">Open →</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="content-rule">
          <span>THE FEED</span>
        </div>

        <div className="content-grid">
          <section className="feed-column">
            <div className="feed-toolbar">
              <div>
                <span className="eyebrow">LIVE</span>
                <h2>Latest Logs</h2>
              </div>

              <div className="filter-tabs">
                {["Everything", "Videos", "GIFs", "Text"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={filter === item ? "filter-tab active" : "filter-tab"}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="feed-list">
              {feedPosts.map((post) => (
                <article className="feed-card" key={post.id}>
                  <div className="vote-rail">
                    <button type="button">▲</button>
                    <strong>{post.reactions}</strong>
                    <button type="button">▼</button>
                  </div>

                  {post.image && (
                    <div className="feed-thumbnail">
                      <img src={post.image} alt="" />
                      <span>{post.type}</span>
                    </div>
                  )}

                  <div className="feed-body">
                    <div className="feed-topline">
                      <span className="tag">#{post.tag}</span>
                      <button type="button" className="more-button">•••</button>
                    </div>

                    <h3>{post.title}</h3>

                    {post.body && <p>{post.body}</p>}

                    <div className="post-meta">
                      <span>posted by <strong>@{post.author}</strong></span>
                      <span>{post.time}</span>
                    </div>

                    <div className="post-actions">
                      <button type="button">● {post.comments} comments</button>
                      <button type="button">Share</button>
                      <button type="button">Save</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button className="load-more" type="button">
              Load more logs
            </button>
          </section>

          <aside className="sidebar">
            <section className="side-module">
              <div className="module-title">
                <span>01</span>
                <h3>Popular Right Now</h3>
              </div>
              <ol className="popular-list">
                {popular.map(([title, score], index) => (
                  <li key={title}>
                    <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                    <button type="button">{title}</button>
                    <strong>{score}</strong>
                  </li>
                ))}
              </ol>
            </section>

            <section className="side-module">
              <div className="module-title">
                <span>02</span>
                <h3>Browse Categories</h3>
              </div>
              <div className="category-grid">
                {categories.map(([title, count]) => (
                  <button type="button" className="category-row" key={title}>
                    <span>{title}</span>
                    <strong>{count}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="side-module editorial-module">
              <span className="mini-kicker">FROM EDITORIAL</span>
              <h3>Why boring websites all started looking the same</h3>
              <p>
                The web got cleaner, faster, and arguably much less interesting.
              </p>
              <button type="button">Read article →</button>
            </section>

            <section className="side-module">
              <div className="module-title">
                <span>03</span>
                <h3>Active Discussions</h3>
              </div>
              <div className="thread-list">
                {threads.map(([title, comments]) => (
                  <button type="button" className="thread-row" key={title}>
                    <span>{title}</span>
                    <strong>{comments}</strong>
                  </button>
                ))}
              </div>
              <button className="module-footer-link" type="button">
                Go to forum →
              </button>
            </section>

            <section className="side-module stats-module">
              <div>
                <strong>2,418</strong>
                <span>logs</span>
              </div>
              <div>
                <strong>387</strong>
                <span>members</span>
              </div>
              <div>
                <strong>46</strong>
                <span>online</span>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <div>
          <strong>UNFILTERED LOG</strong>
          <span>Built for humans, not engagement funnels.</span>
        </div>
        <div className="footer-links">
          <button type="button">About</button>
          <button type="button">Rules</button>
          <button type="button">Privacy</button>
          <button type="button">Contact</button>
        </div>
      </footer>
    </div>
  );
}
