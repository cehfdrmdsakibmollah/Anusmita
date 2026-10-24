
"use client";
import {useRef} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ArrowUpRight} from "lucide-react";
export type FeaturedProduct={id:string;name:string;slug:string;brand:string;category:string;image:string;size:string;pricePaisa:number;available:number};
export type FeaturedShelf={key:string;title:string;subtitle:string;products:FeaturedProduct[]};
const taka=(paisa:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(paisa/100);
function ProductRail({shelf}:{shelf:FeaturedShelf}){
 const ref=useRef<HTMLDivElement>(null);
 if(!shelf.products.length)return null;
 const move=(direction:number)=>ref.current?.scrollBy({left:direction*340,behavior:"smooth"});
 return <section className="anShelf">
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
