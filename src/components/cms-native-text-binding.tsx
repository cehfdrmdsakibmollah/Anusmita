"use client";
import {useEffect} from "react";
import type {CmsSlotPage} from "@/lib/cms-page-slots";
import {nativeTextTargets,type CmsNativeTextEntry} from "@/lib/cms-native-bindings";
/** Safely overrides approved native *presentation copy* only, never product/cart/form state. */
export default function CmsNativeTextBinding({page,bindings}:{page:CmsSlotPage;bindings:CmsNativeTextEntry[]}){
 useEffect(()=>{
  const permitted=nativeTextTargets[page];
  const applicable=bindings.filter(x=>x.enabled&&permitted[x.key]);
  if(!applicable.length)return;
  let frame=0;
  let observer:MutationObserver|null=null;
  const apply=()=>{
   for(const entry of applicable){
    const selector=permitted[entry.key];if(!selector)continue;
    const node=document.querySelector(selector);
    if(!node)continue;
    if(node.textContent!==entry.text)node.textContent=entry.text;
   }
  };
  const schedule=()=>{if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{frame=0;apply();});};
  apply();
  observer=new MutationObserver(schedule);
  observer.observe(document.body,{subtree:true,characterData:true,childList:true});
  return()=>{observer?.disconnect();if(frame)cancelAnimationFrame(frame);};
 },[page,bindings]);
 return null;
}
