
"use client";
import {useEffect,useState} from "react";
import {ArrowUpRight} from "lucide-react";
import HomepageCountdown from "@/components/homepage-countdown";
import type {HomeBlock} from "@/lib/home-content";
export default function HomepagePromotion({promo}:{promo:HomeBlock}){
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{
  const update=()=>setNow(Date.now());update();
  const interval=setInterval(update,1000);
  return()=>clearInterval(interval);
 },[]);
 // The server hides expired banners on fresh loads. On open tabs hide the
 // *entire promotion*, not just the timer, as soon as its deadline passes.
 if(promo.endsAt&&now!==null&&now>=Date.parse(promo.endsAt))return null;
 return <section className="anPromoWrap">
  <div className="anWide"><div className="anPromo" style={promo.imageUrl?{
    backgroundImage:"linear-gradient(90deg,rgba(249,229,229,.98),rgba(249,229,229,.94) 42%,rgba(249,229,229,.16) 100%),url('"+promo.imageUrl+"')"
   }:undefined}>
   <div className="anPromoCopy"><p className="anOverline">{promo.label||"ANUSMITA EDIT"}</p><h2>{promo.title}</h2>
    <p>{promo.subtitle}</p><a href={promo.href} className="anAction">{promo.cta||"Explore offer"} <ArrowUpRight size={16}/></a></div>
   {promo.endsAt&&<HomepageCountdown endsAt={promo.endsAt}/>}
  </div></div>
 </section>;
}
