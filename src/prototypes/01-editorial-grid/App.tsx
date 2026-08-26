import { useState } from "react";
import "./App.css";

const featured = [
  { type: "VIDEO", title: "The internet was better when every site looked a little bit weird", meta: "@ivan · 18m · 42 comments", img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" },
  { type: "GIF", title: "This is the exact amount of chaos I expect from a Tuesday", meta: "@deadpixel · 31m · 19 comments", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
  { type: "TEXT", title: "Bring back websites that actually feel like somebody lives there", meta: "@nix0n · 54m · 67 comments", img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" },
];

const posts = [
  ["VIDEO", "A tiny documentary about the last independently owned video store in town", "@modem_noise", "1h", "23", "84"],
  ["TEXT", "You don't need an algorithm for everything", "@analogkid", "1h", "51", "166"],
  ["GIF", "When production works on the first deploy", "@root_user", "2h", "12", "94"],
  ["VIDEO", "Someone restored a 1999 web portal and it is glorious", "@hyperlink", "2h", "34", "141"],
];

export default function App() {
  const [tab, setTab] = useState("Latest");
  return (
    <div className="editorial-site">
      <header className="topbar">
        <div className="brand"><span>UL</span><strong>UNFILTERED LOGS</strong></div>
        <nav><button className="active">Logs</button><button>Editorial</button><button>Forum</button></nav>
        <div className="actions"><button>Search</button><button className="primary">+ New Log</button><button className="avatar">IK</button></div>
      </header>

      <main>
        <section className="intro-row">
          <div><span className="kicker">FRONT PAGE</span><h1>Worth your time.</h1></div>
          <p>A hand-picked cross section of what people are watching, posting, and arguing about right now.</p>
        </section>

        <section className="feature-grid">
          {featured.map((item, i) => (
            <article className="feature" key={item.title}>
              <img src={item.img} alt="" />
              <div className="scrim" />
              <div className="feature-index">0{i + 1}</div>
              <span className="pill">{item.type}</span>
              <div className="feature-copy"><h2>{item.title}</h2><small>{item.meta}</small></div>
            </article>
          ))}
        </section>

        <div className="divider"><span>LATEST FROM THE LOGS</span></div>

        <section className="body-grid">
          <div className="feed">
            <div className="feed-head">
              <div><span className="kicker">LIVE FEED</span><h2>Latest Logs</h2></div>
              <div className="tabs">{["Latest","Popular","Videos","Text"].map(x => <button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>
            </div>

            {posts.map((p, i) => (
              <article className="post" key={String(p[1])}>
                <div className="post-rank">{String(i+1).padStart(2,"0")}</div>
                <div className="post-copy"><span className="post-type">{p[0]}</span><h3>{p[1]}</h3><div className="meta"><span>{p[2]}</span><span>{p[3]}</span><span>♥ {p[5]}</span><span>● {p[4]}</span></div></div>
                <button className="open">→</button>
              </article>
            ))}
          </div>

          <aside>
            <section className="panel dark"><span className="kicker">EDITORIAL</span><h3>Why boring websites all started looking the same</h3><p>The web got cleaner, faster, and arguably much less interesting.</p><button>Read article →</button></section>
            <section className="panel"><div className="panel-title">MOST DISCUSSED</div>{["What was your first website?","Best software that got worse?","Things you miss about old forums","Desktop screenshots thread"].map((x,i)=><button className="side-link" key={x}><span>{x}</span><b>{74-i*11}</b></button>)}</section>
            <section className="panel"><div className="panel-title">BROWSE</div><div className="tags">{["videos","gifs","internet","technology","nostalgia","music","stories"].map(x=><button key={x}>#{x}</button>)}</div></section>
          </aside>
        </section>
      </main>

      <footer><strong>UNFILTERED LOGS</strong><span>Built for humans, not engagement funnels.</span><div><button>About</button><button>Rules</button><button>Contact</button></div></footer>
    </div>
  );
}
