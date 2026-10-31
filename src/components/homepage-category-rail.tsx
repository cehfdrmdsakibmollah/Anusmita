"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight} from "lucide-react";
import type {HomeBlock} from "@/lib/home-content";

export default function HomepageCategoryRail({categories}:{categories:HomeBlock[]}){
 const rail=useRef<HTMLDivElement>(null);
 const [paused,setPaused]=useState(false);
 const [reduced,setReduced]=useState(false);
 const [visible,setVisible]=useState(false);
 const move=(dir:number)=>{
  const el=rail.current;if(!el)return;
  const first=el.querySelector<HTMLElement>(".anCategoryCard");
  const step=(first?.getBoundingClientRect().width||240)+16;
  const atEnd=el.scrollLeft+el.clientWidth>=el.scrollWidth-8;
  const atStart=el.scrollLeft<=8;
  if(dir>0&&atEnd)el.scrollTo({left:0,behavior:reduced?"instant":"smooth"});
  else if(dir<0&&atStart)el.scrollTo({left:el.scrollWidth,behavior:reduced?"instant":"smooth"});
  else el.scrollBy({left:dir*step,behavior:reduced?"instant":"smooth"});
 };
 useEffect(()=>{
  const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>setReduced(mq.matches);
  update();mq.addEventListener("change",update);
  return()=>mq.removeEventListener("change",update);
 },[]);
 useEffect(()=>{
  const el=rail.current;if(!el)return;
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:0.15});
  observer.observe(el);return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(paused||reduced||!visible||categories.length<2)return;
  const timer=window.setInterval(()=>move(1),3000);
  return()=>window.clearInterval(timer);
 },[paused,reduced,visible,categories.length]);
 return <div className="anCategoryRailShell"
  onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
  onFocusCapture={()=>setPaused(true)}
  onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false)}}>
  <div ref={rail} className="anCategoryRail" role="region" aria-label="Shop categories carousel" aria-roledescription="carousel">
   {categories.map(c=><Link href={c.href} className="anCategoryCard" key={c.id}>
    <div className="anCategoryImage">{c.imageUrl?<img src={c.imageUrl} alt={c.title} loading="lazy"/>:<div className="anCategoryBlank">ANUSMITA</div>}</div>
    <div className="anCategoryCaption"><strong>{c.title}</strong><span>{c.cta||"Explore"} <ArrowRight size={14}/></span></div>
   </Link>)}
  </div>
  {categories.length>1&&<div className="anCategoryRailControls">
   <button type="button" aria-label="Previous categories" onClick={()=>move(-1)}><ArrowLeft size={20}/></button>
   <button type="button" aria-label="Next categories" onClick={()=>move(1)}><ArrowRight size={20}/></button>
  </div>}
 </div>;
}
