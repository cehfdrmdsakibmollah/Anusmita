"use client";
import {useEffect,useState} from "react";
type Seo={title:string;description:string;enabled:boolean;revision:number};
export default function SeoManager(){
 const [readiness,setReadiness]=useState<{indexable:boolean;checks:{name:string;passed:boolean;detail:string}[];catalogue:Record<string,number>}|null>(null);
 const [readinessError,setReadinessError]=useState("");
 async function audit(){setReadinessError("");try{const response=await fetch("/api/admin/site-seo/readiness",{cache:"no-store"});const result=await response.json();if(!response.ok)throw Error(result.error||"Audit unavailable");setReadiness(result);}catch(error){setReadinessError(error instanceof Error?error.message:"Audit unavailable");}}
 const [data,setData]=useState<Seo|null>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function load(){try{const r=await fetch("/api/admin/site-seo",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load SEO");setData(d);}catch(e){setNotice(String(e));}}
 useEffect(()=>{void load();void audit();},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(!data)return;setBusy(true);try{const r=await fetch("/api/admin/site-seo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw Error(result.error||"Save failed");setData({...data,revision:result.revision});setNotice("SEO configuration saved and audited.");}catch(e){setNotice(String(e));}finally{setBusy(false);}}
 return <section className="adminCard"><h2>SEO &amp; AI Search Readiness</h2>
 <button className="button light" type="button" onClick={()=>void audit()}>Refresh technical audit</button>
 {readinessError&&<p role="alert">{readinessError}</p>}
 {readiness&&<div className="adminCard"><h3>Search visibility checks</h3>{readiness.checks.map(check=><p key={check.name}><strong>{check.passed?"Ready":"Action required"} · {check.name}</strong><br/>{check.detail}</p>)}
 <h3>Published catalogue content</h3><p>{readiness.catalogue.published} active products · {readiness.catalogue.missingDescription} missing descriptions · {readiness.catalogue.missingImages} missing images · {readiness.catalogue.missingBrand} missing brand names</p>
 <p>{readiness.catalogue.seoRecordsNoIndex} product SEO records explicitly opt out of indexing.</p>
 <p>Improve visible product descriptions, specifications and answers using verified product details. Search appearance and AI citations depend on each provider.</p>
 <a href="/admin/products/seo">Open product SEO editor</a>
 </div>}
<p className="smallprint">Safe text-only metadata; no custom code injection. Changes must be enabled to affect the storefront.</p>{notice&&<p role="status">{notice}</p>}{data&&<form className="adminForm" onSubmit={e=>void save(e)}><div className="field"><label>SEO title (max 70)<input maxLength={70} minLength={10} required value={data.title} onChange={e=>setData({...data,title:e.target.value})}/></label></div><div className="field"><label>Description (max 160)<textarea maxLength={160} minLength={30} required value={data.description} onChange={e=>setData({...data,description:e.target.value})}/></label></div><label><input type="checkbox" checked={data.enabled} onChange={e=>setData({...data,enabled:e.target.checked})}/> Publish custom metadata</label><p className="smallprint">Preview: {data.title} — {data.description}</p><button type="submit" className="button" disabled={busy}>Save SEO</button></form>}</section>;
}
