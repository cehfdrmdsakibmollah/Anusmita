"use client";
import {useEffect,useState} from "react";
import type {CmsSlotPage} from "@/lib/cms-page-slots";
type Media={key:string;url:string;size:number;uploaded:string|null};
export default function CmsMediaLibrary({scope,onChoose}:{scope:"homepage"|CmsSlotPage;onChoose:(url:string)=>void}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[items,setItems]=useState<Media[]>([]);
 const [cursor,setCursor]=useState<string|null>(null),[notice,setNotice]=useState("");
 const [query,setQuery]=useState("");
 async function load(next=false){
  setBusy(true);setNotice("");
  try{
   const params=new URLSearchParams({scope,limit:"30"});
   if(next&&cursor)params.set("cursor",cursor);
   const response=await fetch("/api/admin/cms-media-library?"+params,{cache:"no-store"});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Media library unavailable");
   setItems(old=>next?[...old,...(data.items||[])]:data.items||[]);
   setCursor(typeof data.cursor==="string"?data.cursor:null);
  }catch(e){setNotice(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 useEffect(()=>{if(open){void load(false);}else{setItems([]);setCursor(null);setQuery("");}},[scope,open]);
 const filtered=items.filter(item=>item.key.toLowerCase().includes(query.toLowerCase()));
 return <div className="cml-root">
  <button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?"Hide R2 Media Library":"Choose from R2 Media Library"}</button>
  {open&&<div className="cml-panel">
   <p>Read-only asset browser for {scope}. Choosing an image changes the current unsaved draft only; no stored image is deleted.</p>
   <label>Find uploaded image<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search loaded image names"/></label>
   <div className="cml-grid">{filtered.map(item=><button key={item.key} type="button" title={item.key} onClick={()=>{onChoose(item.url);setNotice("Image selected in current draft. Save and Publish to update storefront.");}}><img src={item.url} alt="" loading="lazy"/><small>{item.key.split("/").at(-1)}</small></button>)}</div>
   {!busy&&!filtered.length&&<p>No matching images in loaded results. Upload a new image, or check another page.</p>}
   {busy&&<p role="status">Loading media assets…</p>}
   {notice&&<p role="status">{notice}</p>}
   <div className="cml-actions"><button disabled={busy} onClick={()=>void load(false)} type="button">Refresh</button><button disabled={busy||!cursor} onClick={()=>void load(true)} type="button">Load more</button></div>
  </div>}
 </div>;
}
