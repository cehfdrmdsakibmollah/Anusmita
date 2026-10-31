"use client";
import {useEffect,useState} from "react";
type Config={announcement:string;footerNote:string;enabled:boolean;revision:number};
export default function StoreChromeEditor(){
 const [config,setConfig]=useState<Config|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function load(){
  setLoading(true);setNotice("");
  try{
   const res=await fetch("/api/admin/store-chrome",{cache:"no-store"}),body=await res.json();
   if(!res.ok)throw new Error(body.error||"Unable to load settings");
   setConfig(body);
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Load failed"));}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load();},[]);
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!config)return;setBusy(true);setNotice("");
  try{
   const res=await fetch("/api/admin/store-chrome",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(config)});
   const body=await res.json();if(!res.ok)throw new Error(body.error||"Unable to save");
   setConfig({...config,revision:body.revision});setNotice("Saved successfully. Refresh the storefront to verify content.");
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Save failed"));}
  finally{setBusy(false);}
 }
 return <section className="adminCard">
  <h2>Header Announcement & Footer Content</h2>
  <p className="smallprint">Brand logo, navigation and existing links stay unchanged. This editor controls only text shown in the announcement bar and footer brand line. Changes are inactive until enabled.</p>
  {loading&&<p role="status">Loading settings…</p>}
  {notice&&<p role="status">{notice}</p>}
  {config&&<form onSubmit={e=>void save(e)} className="adminForm">
   <div className="field"><label htmlFor="announcementText">Announcement text</label>
    <input id="announcementText" maxLength={180} value={config.announcement} onChange={e=>setConfig({...config,announcement:e.target.value})}/></div>
   <div className="field"><label htmlFor="footerText">Footer brand subtitle</label>
    <input id="footerText" maxLength={240} value={config.footerNote} onChange={e=>setConfig({...config,footerNote:e.target.value})}/></div>
   <label><input type="checkbox" checked={config.enabled} onChange={e=>setConfig({...config,enabled:e.target.checked})}/> Enable custom text</label>
   <p className="smallprint">Preview: {config.enabled?(config.announcement||"Default announcement"):"Default ANUSMITA announcement"}</p>
   <button className="button" type="submit" disabled={busy}>Save content</button>
   <button className="button small light" type="button" disabled={busy} onClick={()=>void load()}>Reload</button>
  </form>}
 </section>;
}
