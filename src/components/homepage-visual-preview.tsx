"use client";
import {useMemo,useState} from "react";
import {Monitor,Tablet,Smartphone,Eye,EyeOff,MousePointer2} from "lucide-react";
import type {HomeBlock,HomeSection} from "@/lib/home-content";
import "./homepage-visual-preview.css";

type Props={
 blocks:HomeBlock[];
 sections:HomeSection[];
 selectedId:string|null;
 onSelect:(block:HomeBlock)=>void;
};
const widths={desktop:1100,tablet:720,mobile:390} as const;
const imageValue=(url:string)=>url||"/brand/hero-reference.webp";
export default function HomepageVisualPreview({blocks,sections,selectedId,onSelect}:Props){
 const [device,setDevice]=useState<keyof typeof widths>("desktop");
 const [showDrafts,setShowDrafts]=useState(true);
 const ordered=useMemo(()=>[...blocks].filter(b=>showDrafts||b.enabled)
   .sort((a,b)=>a.kind.localeCompare(b.kind)||a.position-b.position),[blocks,showDrafts]);
 const heroes=ordered.filter(b=>b.kind==="hero"),categories=ordered.filter(b=>b.kind==="category");
 const promotions=ordered.filter(b=>b.kind==="promotion"),editorials=ordered.filter(b=>b.kind==="editorial");
 const announcements=ordered.filter(b=>b.kind==="announcement");
 const choose=(b:HomeBlock)=>onSelect(b);
 const tile=(b:HomeBlock,variant:string)=>(
  <button key={b.id} type="button" onClick={()=>choose(b)}
   aria-pressed={selectedId===b.id} className={["anVisualTile",variant,selectedId===b.id?"anVisualSelected":"",!b.enabled?"anVisualUnpublished":""].join(" ")}>
   {b.imageUrl&&<img src={b.imageUrl} alt="" loading="lazy"/>}
   <span className="anVisualTileCopy"><small>{b.label||b.kind}</small><strong>{b.title}</strong><span>{b.subtitle}</span><em>{b.cta||"Explore"} →</em></span>
   <span className="anVisualEditChip"><MousePointer2 size={12}/> Edit</span>
   {!b.enabled&&<span className="anVisualDraftChip">Draft · not public</span>}
  </button>);
 return <section className="anVisualStudio" aria-label="Homepage design preview">
  <div className="anVisualToolbar"><div className="anVisualToolbarTitle"><strong>Visual storefront preview</strong><span>Click a section to edit · Changes are preview-only until saved</span></div>
   <div className="anVisualToolbarActions" role="group" aria-label="Preview device">
    {(["desktop","tablet","mobile"] as const).map(k=><button key={k} type="button" className={device===k?"isActive":""} onClick={()=>setDevice(k)} aria-pressed={device===k} aria-label={k+" preview"}>
     {k==="desktop"?<Monitor size={17}/>:k==="tablet"?<Tablet size={17}/>:<Smartphone size={17}/>}</button>)}
    <button type="button" onClick={()=>setShowDrafts(v=>!v)} aria-pressed={showDrafts} title="Show or hide unpublished cards">{showDrafts?<Eye size={17}/>:<EyeOff size={17}/>} Drafts</button>
   </div>
  </div>
  <div className="anVisualCanvasOuter">
   <div className={"anVisualCanvas "+device} style={{maxWidth:widths[device]}}>
    <header className="anVisualStoreHeader"><div><strong>ANUSMITA</strong><small>FASHION · JEWELLERY · BEAUTY</small></div><nav aria-label="Preview navigation">Home　 Shop　 Bundles　 Deals　 Journal</nav><span>♡　⌕　♧</span></header>
    {announcements.length>0&&<div className="anVisualAnnouncement">{announcements.map(b=><button key={b.id} onClick={()=>choose(b)} className={selectedId===b.id?"anVisualSelected":""}>{b.title}{!b.enabled?" · Draft":""}</button>)}</div>}
    {heroes.length>0?<div className="anVisualHero">{heroes.map(b=>tile(b,"hero"))}</div>:<div className="anVisualEmpty">Add a hero banner to begin designing your page.</div>}
    <div className="anVisualTrust">✧ Curated Collections <span>✦ Thoughtful Beauty</span> ♡ Shop with Confidence</div>
    {categories.length>0&&<section className="anVisualCollection"><div className="anVisualSectionHeading"><h3>Shop by Category</h3><small>Explore your favourite essentials</small></div><div className="anVisualCategoryGrid">{categories.map(b=>tile(b,"category"))}</div></section>}
    {promotions.length>0&&<section className="anVisualCollection"><div className="anVisualSectionHeading"><h3>Special Offers</h3><small>Curated highlights and promotions</small></div><div className="anVisualPromoGrid">{promotions.map(b=>tile(b,"promotion"))}</div></section>}
    {sections.filter(s=>s.enabled).length>0&&<section className="anVisualCollection"><div className="anVisualSectionHeading"><h3>Product collections</h3><small>Live product cards are rendered by the storefront</small></div><div className="anVisualShelves">{[...sections].filter(s=>s.enabled).sort((a,b)=>a.position-b.position).map(s=><div key={s.key}><strong>{s.title}</strong><small>{s.subtitle||"Connected product shelf"} · {s.productIds.length} selected product IDs</small></div>)}</div></section>}
    {editorials.length>0&&<section className="anVisualCollection"><div className="anVisualSectionHeading"><h3>Discover ANUSMITA</h3></div><div className="anVisualPromoGrid">{editorials.map(b=>tile(b,"editorial"))}</div></section>}
    <footer className="anVisualFooter">ANUSMITA <small>Fashion · Jewellery · Beauty</small></footer>
   </div>
  </div>
  <div className="anVisualFootnote"><span>Preview width: {widths[device]}px</span><span>Images and layout are illustrative. Inventory and prices are never simulated.</span></div>
 </section>;
}
