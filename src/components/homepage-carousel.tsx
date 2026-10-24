
"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,ArrowRight,ArrowUpRight} from "lucide-react";
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
  const id=window.setInterval(()=>setIndex(i=>(i+1)%slides.length),6500);
  return()=>window.clearInterval(id);
 },[paused,reduced,slides.length]);
 useEffect(()=>{setIndex(0);},[slides.length]);
 if(!slides.length)return null;
 const active=Math.min(index,slides.length-1);
 return <section className="anHero" aria-label="ANUSMITA featured collections" aria-roledescription="carousel"
  onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
  onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false);}}>
  {slides.map((slide,i)=><div className={"anHeroSlide"+(i===active?" active":"")} key={slide.id} aria-hidden={i!==active}
    style={{zIndex:i===active?2:1}}>
   <div className="anHeroContent"><div className="anHeroContentInner">
    <p className="anEyebrow"><span>✦</span> {slide.label||"THE ANUSMITA EDIT"}</p>
    <h1>{slide.title}</h1>
    <p className="anHeroSubtitle">{slide.subtitle}</p>
    {i===active?<a className="anAction" href={slide.href}>{slide.cta||"Discover ANUSMITA"} <ArrowUpRight size={18}/></a>:
     <span className="anAction anInactiveLink">{slide.cta||"Discover ANUSMITA"} <ArrowUpRight size={18}/></span>}
    <div className="anHeroPills"><span>✧ Thoughtful collections</span><span>◇ Curated for you</span></div>
   </div></div>
   <div className="anHeroVisual">
    {slide.imageUrl?<img src={slide.imageUrl} alt="" loading={i===0?"eager":"lazy"} fetchPriority={i===0?"high":"auto"}/>:<div className="anHeroNoImage">A<span>ANUSMITA</span></div>}
    <div className="anHeroOverlay"/><div className="anHeroMark">A<span>ANUSMITA</span></div>
   </div>
  </div>)}
  {slides.length>1&&<div className="anHeroControls">
   <button type="button" onClick={()=>setIndex(i=>(i+slides.length-1)%slides.length)} aria-label="Previous featured slide"><ArrowLeft size={17}/></button>
   <div className="anHeroDots" aria-label="Select featured slide">{slides.map((slide,i)=><button
     key={slide.id} type="button" className={i===active?"active":""}
     aria-label={"Slide "+(i+1)+": "+slide.title} aria-current={i===active?"true":undefined}
     onClick={()=>setIndex(i)}/>)}</div>
   <button type="button" onClick={()=>setIndex(i=>(i+1)%slides.length)} aria-label="Next featured slide"><ArrowRight size={17}/></button>
  </div>}
 </section>;
}
