import { useState } from "react";
import "./App.css";

const cards = [
 {size:"hero",type:"VIDEO",title:"The internet was better when every site looked a little bit weird",author:"@ivan",img:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",score:188},
 {size:"tall",type:"GIF",title:"Tuesday, accurately represented",author:"@deadpixel",img:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",score:147},
 {size:"quote",type:"TEXT",title:"Bring back websites that actually feel like somebody lives there.",author:"@nix0n",score:203},
 {size:"wide",type:"VIDEO",title:"Someone restored a 1999 web portal and it is glorious",author:"@hyperlink",img:"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",score:118},
 {size:"small",type:"TEXT",title:"You don't need an algorithm for everything",author:"@analogkid",score:166},
 {size:"small",type:"GIF",title:"When production works on the first deploy",author:"@root_user",img:"https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=80",score:94},
 {size:"tall2",type:"PHOTO",title:"This abandoned mall still has its directory lit up",author:"@pixelrot",img:"https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80",score:129},
];

export default function App(){
 const [mode,setMode]=useState("Board");
 return <div className="mag-site">
  <header><div className="brand"><span>UL</span><strong>UNFILTERED LOGS</strong></div><nav><button className="active">Logs</button><button>Editorial</button><button>Forum</button></nav><div className="actions"><button>⌕</button><button className="new">+ New Log</button><button className="avatar">IK</button></div></header>
  <main>
   <section className="masthead"><div><span className="kicker">A LIVE BOARD OF INTERNET DETRITUS</span><h1>Unfiltered.</h1></div><p>Videos, GIFs, thoughts, oddities, and things people thought were worth sharing.</p><div className="view-toggle">{["Board","Latest","Popular"].map(x=><button className={mode===x?"active":""} onClick={()=>setMode(x)} key={x}>{x}</button>)}</div></section>

   <section className="board">
    {cards.map((c,i)=><article className={`tile ${c.size}`} key={c.title}>
      {c.img&&<img src={c.img} alt=""/>}<div className="shade"/>
      <div className="tile-top"><span>{c.type}</span><b>{String(i+1).padStart(2,"0")}</b></div>
      {c.type==="VIDEO"&&<button className="play">▶</button>}
      <div className="tile-copy"><h2>{c.title}</h2><div><span>{c.author}</span><span>♥ {c.score}</span><button>Open →</button></div></div>
    </article>)}
   </section>

   <section className="below">
    <div className="ticker"><strong>NOW TRENDING</strong><span>#oldweb</span><span>#weirdinternet</span><span>#nostalgia</span><span>#videos</span><span>#gifs</span></div>
    <div className="lower-grid">
      <section><div className="section-title"><span>01</span><h3>Latest Logs</h3><button>View all →</button></div>{["A tiny documentary about the last independently owned video store in town","Why did every forum signature have flames?","Someone made Windows 98 run in a browser","The weirdest local TV commercial I've ever seen"].map((x,i)=><button className="headline" key={x}><b>{String(i+1).padStart(2,"0")}</b><span>{x}</span><small>{12+i*9} comments</small></button>)}</section>
      <aside><div className="section-title"><span>02</span><h3>Editorial</h3></div><article className="editorial"><span>FEATURE</span><h3>Why boring websites all started looking the same</h3><p>The web got cleaner, faster, and arguably much less interesting.</p><button>Read article →</button></article></aside>
      <aside><div className="section-title"><span>03</span><h3>Active</h3></div>{["What was your first website?","Best software that got worse?","Things you miss about old forums"].map((x,i)=><button className="thread" key={x}><span>{x}</span><b>{74-i*13}</b></button>)}</aside>
    </div>
   </section>
  </main>
  <footer><strong>UNFILTERED LOGS</strong><span>No infinite corporate beige.</span><div><button>About</button><button>Rules</button><button>Contact</button></div></footer>
 </div>
}
