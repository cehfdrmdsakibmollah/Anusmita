
"use client";
import {useEffect,useState} from "react";
export default function HomepageCountdown({endsAt}:{endsAt:string}){
 const [remaining,setRemaining]=useState<number|null>(null);
 useEffect(()=>{
  const target=Date.parse(endsAt);
  const update=()=>setRemaining(Math.max(0,target-Date.now()));
  update();const id=setInterval(update,1000);return()=>clearInterval(id);
 },[endsAt]);
 if(remaining===null||remaining<=0)return null;
 const seconds=Math.floor(remaining/1000);
 const values=[
  ["DAYS",Math.floor(seconds/86400)],
  ["HOURS",Math.floor(seconds%86400/3600)],
  ["MINUTES",Math.floor(seconds%3600/60)],
  ["SECONDS",seconds%60]
 ] as const;
 return <div className="anCountdown" role="timer" aria-label="Offer ends in">
  {values.map(([name,value])=><div key={name}><strong>{String(value).padStart(2,"0")}</strong><span>{name}</span></div>)}
 </div>;
}
