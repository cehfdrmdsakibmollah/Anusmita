"use client";
import {useEffect,useState} from "react";
type Seo={title:string;description:string;enabled:boolean;revision:number};
export default function SeoManager(){
 const [data,setData]=useState<Seo|null>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function load(){try{const r=await fetch("/api/admin/site-seo",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load SEO");setData(d);}catch(e){setNotice(String(e));}}
 useEffect(()=>{void load();},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!data)return;setBusy(true);try{const r=await fetch("/api/admin/site-seo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw Error(result.error||"Save failed");setData({...data,revision:result.revision});setNotice("SEO configuration saved and audited.");}catch(e){setNotice(String(e));}finally{setBusy(false);}}
 return <section className="adminCard"><h2>Global SEO Manager</h2><p className="smallprint">Safe text-only metadata; no custom code injection. Changes must be enabled to affect the storefront.</p>{notice&&<p role="status">{notice}</p>}{data&&<form className="adminForm" onSubmit={e=>void save(e)}><div className="field"><label>SEO title (max 70)<input maxLength={70} minLength={10} required value={data.title} onChange={e=>setData({...data,title:e.target.value})}/></label></div><div className="field"><label>Description (max 160)<textarea maxLength={160} minLength={30} required value={data.description} onChange={e=>setData({...data,description:e.target.value})}/></label></div><label><input type="checkbox" checked={data.enabled} onChange={e=>setData({...data,enabled:e.target.checked})}/> Publish custom metadata</label><p className="smallprint">Preview: {data.title} — {data.description}</p><button type="submit" className="button" disabled={busy}>Save SEO</button></form>}</section>;
}
