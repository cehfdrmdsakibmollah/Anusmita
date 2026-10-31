
"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ArrowUpRight} from "lucide-react";
export type FeaturedProduct={id:string;name:string;slug:string;brand:string;category:string;image:string;size:string;pricePaisa:number;available:number};
export type FeaturedShelf={key:string;title:string;subtitle:string;products:FeaturedProduct[]};
const taka=(paisa:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(paisa/100);
function ProductRail({shelf}:{shelf:FeaturedShelf}){
 const ref=useRef<HTMLDivElement>(null);
 const [paused,setPaused]=useState(false);
 const [visible,setVisible]=useState(false);
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{const m=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduced(m.matches);update();m.addEventListener("change",update);return()=>m.removeEventListener("change",update);},[]);
 useEffect(()=>{const el=ref.current;if(!el)return;const obs=new IntersectionObserver(([e])=>setVisible(e.isIntersecting),{threshold:.15});obs.observe(el);return()=>obs.disconnect();},[]);
 useEffect(()=>{if(paused||reduced||!visible||shelf.products.length<2)return;const timer=window.setInterval(()=>move(1),3000);return()=>window.clearInterval(timer);},[paused,reduced,visible,shelf.products.length]);
 if(!shelf.products.length)return null;
 const move=(direction:number)=>{const el=ref.current;if(!el)return;const first=el.querySelector<HTMLElement>(".anProductTile");const step=(first?.getBoundingClientRect().width||320)+16;const atEnd=el.scrollLeft+el.clientWidth>=el.scrollWidth-8;if(direction>0&&atEnd)el.scrollTo({left:0,behavior:reduced?"instant":"smooth"});else if(direction<0&&el.scrollLeft<=8)el.scrollTo({left:el.scrollWidth,behavior:reduced?"instant":"smooth"});else el.scrollBy({left:direction*step,behavior:reduced?"instant":"smooth"});};
 return <section className="anShelf" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false)}}>
  <div className="anSectionTitle"><div><p className="anOverline">THE ANUSMITA SELECTION <span>✦</span></p>
   <h2>{shelf.title}</h2><p>{shelf.subtitle}</p></div>
   <div className="anShelfActions"><button type="button" aria-label={"Previous "+shelf.title+" products"} onClick={()=>move(-1)}><ArrowLeft size={18}/></button>
   <button type="button" aria-label={"Next "+shelf.title+" products"} onClick={()=>move(1)}><ArrowRight size={18}/></button></div>
  </div>
  <div className="anProductRail" ref={ref}>
   {shelf.products.map(p=><article className="anProductTile" key={p.id}>
    <Link href={"/products/"+p.slug} className="anProductPhoto">
     {p.image?<img src={p.image} alt={p.name} loading="lazy" referrerPolicy="no-referrer"/>:<div className="anProductPhotoFallback">ANUSMITA</div>}
     <span className="anProductTileArrow"><ArrowUpRight size={18}/></span>
    </Link>
    <div className="anProductTileDetails"><span>{p.brand||p.category}</span>
     <h3><Link href={"/products/"+p.slug}>{p.name}</Link></h3>
     <p>{p.size}</p><div><strong>{taka(p.pricePaisa)}</strong><Link href={"/products/"+p.slug} aria-label={"View "+p.name}>View details <ArrowUpRight size={14}/></Link></div>
    </div>
   </article>)}
  </div>
 </section>;
}
export default function HomepageFeatured({shelves}:{shelves:FeaturedShelf[]}){
 return <>{shelves.map(s=><ProductRail key={s.key} shelf={s}/>)}</>;
}
