
"use client";

import {useEffect} from "react";

/**
 * Optional progressive-enhancement entrance animations.
 * All cards remain visible without JavaScript, IntersectionObserver or with
 * reduced-motion enabled. Never runs on admin routes.
 */
export default function HomepageMotion(){
 useEffect(()=>{
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(media.matches||typeof IntersectionObserver==="undefined")return;
  const items=Array.from(document.querySelectorAll<HTMLElement>("[data-an-reveal]"));
  // Start hidden only for elements still below the viewport. Avoid a
  // disappearing first screen or layout movement before hydration.
  const initialViewport=window.innerHeight;
  const delayed=items.filter(el=>el.getBoundingClientRect().top>initialViewport*0.88);
  if(!delayed.length)return;

  const completionTimers:ReturnType<typeof window.setTimeout>[]=[];
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const el=entry.target as HTMLElement;
    el.classList.remove("an-reveal-pending");
    el.classList.add("an-reveal-entering");
    observer.unobserve(el);
    // Stagger applies only during the first entrance, never to later hover.
    completionTimers.push(window.setTimeout(()=>el.classList.remove("an-reveal-entering"),1150));
   }
  },{threshold:0.08,rootMargin:"0px 0px 65px 0px"});
  for(const el of delayed){
   el.classList.add("an-reveal-pending");
   observer.observe(el);
  }
  const onMotionChange=()=>{
   if(!media.matches)return;
   observer.disconnect();
   delayed.forEach(el=>{
    el.classList.remove("an-reveal-pending","an-reveal-entering");
   });
  };
  media.addEventListener("change",onMotionChange);
  return()=>{
   observer.disconnect();
   completionTimers.forEach(window.clearTimeout);
   media.removeEventListener("change",onMotionChange);
   delayed.forEach(el=>el.classList.remove("an-reveal-pending","an-reveal-entering"));
  };
 },[]);
 return null;
}
