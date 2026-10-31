"use client";
import {useState} from "react";
import Link from "next/link";
import {ArrowRight,ChevronLeft,ChevronRight,Grid2X2,List,SlidersHorizontal} from "lucide-react";
import {ProductCardWishlist} from "@/components/catalogue-shopping";

type Item={id:string;name:string;slug:string;brand:string;category:string;origin:string;image:string;size:string;pricePaisa:number;available:number};
type Filters={category:string;origins:string[];concerns:string[];minPrice:string;maxPrice:string;sort:string;q:string};
const originOptions=["Japan","Korea","China"];
const categories=["Skincare","Makeup","Perfume","Fashion","Bedsheets","Watches","Bags","Jewellery","Accessories"];
const concerns=["Acne","Brightening","Sensitive","Dry Skin","Oily Skin"];
const money=(p:number)=>"৳"+(p/100).toLocaleString("en-BD",{maximumFractionDigits:2});
export default function ShopReference({products,filters,page,pages,count}:{products:Item[];filters:Filters;page:number;pages:number;count:number}){
 const [draft,setDraft]=useState(filters);
 const [view,setView]=useState<"grid"|"list">("grid");
 const toggle=(key:"origins"|"concerns",value:string)=>setDraft(old=>({...old,[key]:old[key].includes(value)?old[key].filter(v=>v!==value):[...old[key],value]}));
 function link(next:Filters,n=1){const p=new URLSearchParams();if(next.q)p.set("q",next.q);if(next.category&&next.category!=="All")p.set("category",next.category);next.origins.forEach(v=>p.append("origin",v));next.concerns.forEach(v=>p.append("concern",v));if(next.minPrice)p.set("min",next.minPrice);if(next.maxPrice)p.set("max",next.maxPrice);if(next.sort!=="newest")p.set("sort",next.sort);if(n>1)p.set("page",String(n));return "/shop"+(p.size?"?"+p.toString():"");}
 const totalStart=count?(page-1)*9+1:0,totalEnd=Math.min(count,page*9);
 return <div className="anShopFull">
  <nav className="anShopCrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13}/><Link href="/shop">Shop</Link><ChevronRight size={13}/><span>All Products</span></nav>
  <section className="anShopHero"><div><span>THE ANUSMITA COLLECTION</span><h1>Discover Your<br/>Next <em>Favourite</em></h1><p>Beauty, fragrance & lifestyle, thoughtfully curated for you.</p></div></section>
  <div className="anShopHeading"><h2>Shop All Products</h2><div className="anShopToolbar"><button className={view==="grid"?"active":""} type="button" onClick={()=>setView("grid")} aria-label="Grid view" aria-pressed={view==="grid"}><Grid2X2 size={19}/></button><button className={view==="list"?"active":""} type="button" onClick={()=>setView("list")} aria-label="List view" aria-pressed={view==="list"}><List size={19}/></button><label>Sort by: <select value={draft.sort} onChange={e=>{const v=e.target.value;setDraft(x=>({...x,sort:v}));window.location.assign(link({...draft,sort:v}));}} aria-label="Sort products"><option value="newest">Newest</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name: A to Z</option></select></label></div></div>
  <div className="anShopBody">
   <aside className="anShopSidebar" aria-label="Product filters">
    <form action="/shop" method="get"><div className="anShopFiltersTitle"><h3>Filters</h3><Link href="/shop">Clear all</Link></div>
     {draft.q&&<input type="hidden" name="q" value={draft.q}/>}
     <fieldset><legend>Country Origin</legend>{originOptions.map(x=><label key={x}><input name="origin" type="checkbox" value={x} checked={draft.origins.includes(x)} onChange={()=>toggle("origins",x)}/>{x}</label>)}</fieldset>
     <fieldset><legend>Category</legend>{categories.map(x=><label key={x}><input name="category" type="radio" value={x} checked={draft.category===x} onChange={()=>setDraft(v=>({...v,category:x}))}/>{x}</label>)}<label><input type="radio" name="category" value="All" checked={draft.category==="All"} onChange={()=>setDraft(v=>({...v,category:"All"}))}/>All Categories</label></fieldset>
     <fieldset><legend>Price Range</legend><div className="anShopPriceInputs"><label>Min (৳)<input type="number" name="min" min="0" step="1" value={draft.minPrice} onChange={e=>setDraft(v=>({...v,minPrice:e.target.value}))} placeholder="0"/></label><label>Max (৳)<input type="number" name="max" min="0" step="1" value={draft.maxPrice} onChange={e=>setDraft(v=>({...v,maxPrice:e.target.value}))} placeholder="20000"/></label></div></fieldset>
     <fieldset><legend>Skin Type / Concern</legend>{concerns.map(x=><label key={x}><input name="concern" type="checkbox" value={x} checked={draft.concerns.includes(x)} onChange={()=>toggle("concerns",x)}/>{x}</label>)}</fieldset>
     <input type="hidden" name="sort" value={draft.sort}/><button className="anShopApply" type="submit">Apply Filters <ArrowRight size={17}/></button>
    </form>
   </aside>
   <section className="anShopResults" aria-label="Shop products"><div className="anShopCount">Showing {totalStart}–{totalEnd} of {count} products</div>
    {products.length?<div className={"anShopCards "+(view==="list"?"anShopCardsList":"")}>{products.map(p=><article className="anShopNewCard" key={p.id}>
     <div className="anShopNewMedia"><Link href={"/products/"+p.slug} aria-label={"View "+p.name}>{p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<span className="anShopNoImage">ANUSMITA</span>}</Link><ProductCardWishlist id={p.id}/>{p.available<=0&&<small className="anShopUnavailable">Currently unavailable</small>}</div>
     <div className="anShopNewInfo"><span>{p.brand||"ANUSMITA"}</span><h3><Link href={"/products/"+p.slug}>{p.name}</Link></h3><strong>{money(p.pricePaisa)}</strong><Link className="anShopNewCta" href={"/products/"+p.slug}>View Product <ArrowRight size={16}/></Link></div>
    </article>)}</div>:<div className="anShopNoMatches"><SlidersHorizontal size={27}/><h3>No products match these filters.</h3><p>Try a different category or price range.</p><Link href="/shop">Clear filters</Link></div>}
    {pages>1&&<nav className="anShopPages" aria-label="Product pages">{page>1?<Link href={link(filters,page-1)} aria-label="Previous page"><ChevronLeft size={19}/></Link>:<span className="disabled"><ChevronLeft size={19}/></span>}{Array.from({length:pages},(_,i)=>i+1).filter(n=>pages<=7||n===1||n===pages||Math.abs(n-page)<=1).map((n,i,arr)=><span key={n}>{i>0&&n-arr[i-1]>1&&<span className="dots">…</span>}<Link aria-current={page===n?"page":undefined} href={link(filters,n)}>{n}</Link></span>)}{page<pages?<Link href={link(filters,page+1)} aria-label="Next page"><ChevronRight size={19}/></Link>:<span className="disabled"><ChevronRight size={19}/></span>}</nav>}
   </section>
  </div>
 </div>;
}
