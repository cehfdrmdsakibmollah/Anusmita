"use client";
import {useEffect,useState} from "react";
export default function FunnelCountdown({expiresAt}:{expiresAt:string}){
 const [remaining,setRemaining]=useState<number|null>(null);
 useEffect(()=>{
  const expiration=Date.parse(expiresAt);
  if(!Number.isFinite(expiration)){setRemaining(null);return;}
  const tick=()=>setRemaining(Math.max(0,Math.floor((expiration-Date.now())/1000)));
  tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);
 },[expiresAt]);
 if(remaining===null)return <span>Offer timing will be announced soon</span>;
 if(remaining===0)return <span>Offer has ended</span>;
 const unit=(v:number)=>String(v).padStart(2,"0");
 return <span aria-label="Time remaining">{unit(Math.floor(remaining/86400))}d : {unit(Math.floor(remaining%86400/3600))}h : {unit(Math.floor(remaining%3600/60))}m : {unit(remaining%60)}s</span>;
}
