
"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,ArrowRight,ArrowUpRight,Flower2,Diamond,HeartHandshake} from "lucide-react";
import type {HomeBlock} from "@/lib/home-content";
export default function HomepageCarousel({slides}:{slides:HomeBlock[]}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const sync=()=>setReduced(media.matches);sync();
  media.addEventListener?.("change",sync);return()=>media.removeEventListener?.("change",sync);
 },[]);
 useEffect(()=>{
  if(paused||reduced||slides.length<2)return;
  const interval=window.setInterval(()=>setIndex(x=>(x+1)%slides.length),8500);
  return()=>window.clearInterval(interval);
 },[paused,reduced,slides.length]);
 useEffect(()=>setIndex(0),[slides.length]);
 if(!slides.length)return null;
 const active=Math.min(index,slides.length-1);
 return <section className="anHero anHeroReference" aria-label="ANUSMITA featured collections"
  aria-roledescription="carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
  onFocusCapture={()=>setPaused(true)}
  onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false);}}>
  {slides.map((slide,i)=><div key={slide.id} className={"anHeroSlide"+(i===active?" active":"")}
    aria-hidden={i!==active} style={{zIndex:i===active?2:1}}>
   <div className="anHeroVisual">
    {slide.imageUrl&&<img src={slide.imageUrl} alt="" loading={i===0?"eager":"lazy"} fetchPriority={i===0?"high":"auto"} />}
    <div className="anHeroOverlay"/>
   </div>
   <div className="anHeroContent">
    <div className="anHeroContentInner">
     <p className="anEyebrow">{slide.label||"THE ANUSMITA EDIT"}</p>
     {slide.title==="Your Everyday Beauty, A More Beautiful You"?
      <h1 className="anReferenceHeadline">Your Everyday<br/>Beauty, <em>A More</em><br/><em>Beautiful You</em></h1>:
      <h1>{slide.title}</h1>}
     <p className="anHeroSubtitle">{slide.subtitle}</p>
     {i===active?<a className="anAction" href={slide.href}>{slide.cta||"Shop Now"} <ArrowUpRight size={18}/></a>:
      <span className="anAction anInactiveLink">{slide.cta||"Shop Now"} <ArrowUpRight size={18}/></span>}
     <div className="anHeroPills" aria-label="ANUSMITA collection">
      <span><Flower2 size={16}/> Curated collections</span>
      <span><Diamond size={16}/> Premium selection</span>
      <span><HeartHandshake size={16}/> Style for every you</span>
     </div>
    </div>
   </div>
  </div>)}
  {slides.length>1&&<div className="anHeroControls" aria-label="Hero carousel controls">
    <button type="button" className="anPrevious" aria-label="Previous hero banner"
      onClick={()=>setIndex(i=>(i+slides.length-1)%slides.length)}><ArrowLeft size={17}/></button>
    <div className="anHeroDots" aria-label="Choose hero banner">{slides.map((slide,i)=><button
     key={slide.id} type="button" className={i===active?"active":""} aria-label={"Show "+slide.title}
     aria-current={i===active?"true":undefined} onClick={()=>setIndex(i)}/>)}</div>
    <button type="button" className="anNext" aria-label="Next hero banner"
      onClick={()=>setIndex(i=>(i+1)%slides.length)}><ArrowRight size={17}/></button>
   </div>}
 </section>;
}
