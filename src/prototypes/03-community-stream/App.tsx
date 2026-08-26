import { useState } from "react";
import "./App.css";

const posts = [
  {score:188,type:"VIDEO",title:"AOL instant messenger sounds still trigger something in my brain",author:"modem_noise",community:"internet",comments:74,time:"12m",image:"https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80"},
  {score:147,type:"TEXT",title:"You don't need an algorithm for everything",author:"analogkid",community:"thoughts",comments:51,time:"31m",body:"Sometimes I just want to see what somebody posted because they thought it was interesting. No engagement optimization. No funnel. Just: hey, look at this."},
  {score:129,type:"GIF",title:"When production works on the first deploy",author:"root_user",community:"dev",comments:39,time:"46m",image:"https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=80"},
  {score:118,type:"VIDEO",title:"Someone restored a 1999 web portal and it is glorious",author:"hyperlink",community:"nostalgia",comments:34,time:"1h",image:"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80"},
];

export default function App(){
 const [sort,setSort]=useState("Hot");
 return <div className="community-site">
  <header><div className="brand"><span>UL</span><strong>UNFILTERED LOG</strong></div><nav><button className="active">Logs</button><button>Editorial</button><button>Forum</button></nav><div className="header-actions"><input placeholder="Search..."/><button className="new">+ New Log</button><button className="avatar">IK</button></div></header>
  <div className="subnav"><div><button className="active">Home</button><button>Following</button><button>Videos</button><button>GIFs</button><button>Text</button></div><span>46 people online</span></div>
  <main>
   <aside className="leftbar">
    <section><h3>DISCOVER</h3>{["Front Page","Popular","Newest","Most Discussed"].map((x,i)=><button className={i===0?"active":""} key={x}><span>{["⌂","★","◷","●"][i]}</span>{x}</button>)}</section>
    <section><h3>CATEGORIES</h3>{["Internet","Technology","Nostalgia","Music","Stories","Random"].map(x=><button key={x}><span>#</span>{x}</button>)}</section>
    <section className="tiny-stats"><div><b>2,418</b><span>logs</span></div><div><b>387</b><span>members</span></div></section>
   </aside>

   <section className="stream">
    <div className="welcome"><div><span className="eyebrow">COMMUNITY FEED</span><h1>What's happening?</h1><p>Posts, videos, GIFs, and weird internet finds from actual people.</p></div><button>Post something</button></div>
    <div className="sortbar"><div>{["Hot","New","Top"].map(x=><button key={x} className={sort===x?"active":""} onClick={()=>setSort(x)}>{x}</button>)}</div><button>☷ Compact</button></div>
    <div className="posts">{posts.map(p=><article className="post" key={p.title}>
      <div className="votes"><button>▲</button><b>{p.score}</b><button>▼</button></div>
      <div className="post-main">
       <div className="post-meta"><span className="community">#{p.community}</span><span>posted by @{p.author}</span><span>{p.time}</span><button>•••</button></div>
       <h2>{p.title}</h2>
       {p.body&&<p>{p.body}</p>}
       {p.image&&<div className="media"><img src={p.image} alt=""/><span>{p.type}</span>{p.type==="VIDEO"&&<button className="play">▶</button>}</div>}
       <div className="post-actions"><button>● {p.comments} comments</button><button>Share</button><button>Save</button><button>Report</button></div>
      </div>
     </article>)}</div>
   </section>

   <aside className="rightbar">
    <section className="card frontpage"><span className="eyebrow">FRONT PAGE</span><h3>Three posts, hand-picked by admins.</h3><div className="mini-feature"><b>01</b><span>The internet was better when every site looked a little weird</span></div><div className="mini-feature"><b>02</b><span>This is the exact amount of chaos I expect from a Tuesday</span></div><div className="mini-feature"><b>03</b><span>Bring back websites that feel lived in</span></div></section>
    <section className="card"><div className="card-title">ACTIVE DISCUSSIONS</div>{["What was your first website?","Best software that got worse?","Things you miss about old forums","Desktop screenshots thread"].map((x,i)=><button className="discussion" key={x}><span>{x}</span><b>{74-i*9}</b></button>)}</section>
    <section className="card"><div className="card-title">NEW PEOPLE</div><div className="people">{["@pixelrot","@dialup","@chaosagent","@guest_404"].map(x=><button key={x}><span>{x.slice(1,3).toUpperCase()}</span>{x}</button>)}</div></section>
   </aside>
  </main>
 </div>
}
