"use client";
import {useEffect,useState} from "react";
import type {z} from "zod";
import type {funnelSlide} from "@/lib/funnel-pages";
import {safeFunnelUrl} from "@/lib/funnel-pages";
import "./funnel-slides.css";
type Slide=z.infer<typeof funnelSlide>;
export default function FunnelSlides({slides,mode,autoplay,intervalMs,showArrows,showDots,editing=false,selectedSlide,onPickSlide}:{slides:Slide[];mode:"slider"|"carousel";autoplay:boolean;intervalMs:number;showArrows:boolean;showDots:boolean;editing?:boolean;selectedSlide?:string|null;onPickSlide?:(id:string)=>void}){
 const [publicIndex,setPublicIndex]=useState(0),[paused,setPaused]=useState(false);
 useEffect(()=>setPublicIndex(v=>Math.min(v,Math.max(0,slides.length-1))),[slides.length]);
 useEffect(()=>{
  if(!autoplay||paused||editing||slides.length<2)return;
  const t=window.setInterval(()=>setPublicIndex(i=>(i+1)%slides.length),Math.max(2000,Math.min(intervalMs,15000)));
  return ()=>window.clearInterval(t);
 },[autoplay,paused,editing,slides.length,intervalMs]);
 if(!slides.length)return <div className="anFunnelSlideEmpty">Add slides using the Content inspector.</div>;
 const current=editing?Math.max(0,slides.findIndex(item=>item.id===selectedSlide)):Math.min(publicIndex,slides.length-1);
 const slide=slides[current];
 function show(index:number){
  if(onPickSlide)onPickSlide(slides[index].id);
  else setPublicIndex(index);
 }
 function move(delta:number){show((current+delta+slides.length)%slides.length)}
 const card=(item:Slide)=><div className="anFunnelSlideCard" key={item.id}>
   {safeFunnelUrl(item.imageUrl,true)?<img src={safeFunnelUrl(item.imageUrl,true)} alt={item.alt||item.title||"Campaign image"} loading="lazy"/>:<div className="anFunnelSlideEmpty">Upload a slide image</div>}
   {(item.title||item.body||item.buttonLabel)&&<div className="anFunnelSlideCaption"><h2>{item.title}</h2><p>{item.body}</p>{!editing&&item.buttonLabel&&safeFunnelUrl(item.buttonUrl)&&<a href={safeFunnelUrl(item.buttonUrl)} rel="noopener noreferrer" target={item.buttonUrl.startsWith("/")?undefined:"_blank"}>{item.buttonLabel}</a>}{editing&&item.buttonLabel&&<span className="anFunnelSlideDemoCta">{item.buttonLabel}</span>}</div>}
 </div>;
 return <div className={"anFunnelSlides "+(mode==="carousel"?"carousel":"slider")} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={e=>{if(!e.relatedTarget||!e.currentTarget.contains(e.relatedTarget as Node))setPaused(false)}}>
  {mode==="carousel"?<div className="anFunnelSlideTrack">{[0,1,2].filter(n=>n<slides.length).map(n=>card(slides[(current+n)%slides.length]))}</div>:card(slide)}
  {slides.length>1&&showArrows&&<><button className="anFunnelSlidePrev" type="button" aria-label="Previous slide" onClick={e=>{e.stopPropagation();move(-1)}}>‹</button><button className="anFunnelSlideNext" type="button" aria-label="Next slide" onClick={e=>{e.stopPropagation();move(1)}}>›</button></>}
  {slides.length>1&&showDots&&<div className="anFunnelSlideDots">{slides.map((s,i)=><button type="button" key={s.id} aria-label={"View slide "+(i+1)} aria-current={i===current} className={current===i?"active":""} onClick={e=>{e.stopPropagation();show(i)}}/>)}</div>}
 </div>;
}
