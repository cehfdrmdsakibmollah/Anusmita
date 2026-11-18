"use client";
import {useState} from "react";

type Variant={slug:string;assignments:number;converting:number};

export function FunnelExperimentPanel({control,alternatives}:{control:string;alternatives:{slug:string;title:string}[]}){
 const [variant,setVariant]=useState("");
 const [link,setLink]=useState("");
 const [rows,setRows]=useState<Variant[]|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const endpoint="/api/admin/funnel-pages/experiments";
 async function request(method:"GET"|"POST"){
  setBusy(true);
  setError("");
  setRows(null);
  try{
   const token=link.trim().split("/").at(-1)??"";
   const params=new URLSearchParams(method==="POST"?{a:control,b:variant}:{token});
   const response=await fetch(endpoint+"?"+params,{method,cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Unable to load experiment");
   if(method==="POST")setLink(window.location.origin+"/funnel-test/"+data.token);
   else setRows(data.variants);
  }catch(error){setError(error instanceof Error?error.message:"Unable to load experiment");}
  finally{setBusy(false);}
 }
 return <div className="anFBFields">
  <h3>A/B testing</h3>
  <p>Control campaign /funnel/{control}</p>
  <label>Variant campaign<select value={variant} disabled={busy} onChange={event=>setVariant(event.target.value)}>
   <option value="">Select a published campaign</option>
   {alternatives.map(item=><option key={item.slug} value={item.slug}>{item.title}</option>)}
  </select></label>
  <button type="button" disabled={busy||!variant} onClick={()=>void request("POST")}>Create 30-day test link</button>
  <label>Experiment link<input value={link} maxLength={1300} disabled={busy} onChange={event=>{setLink(event.target.value);setRows(null);}}/></label>
  <p>Save the link to reopen its results. Each new link starts a separate test.</p>
  <button type="button" disabled={busy||!link.trim()} onClick={()=>void request("GET")}>Load experiment results</button>
  {busy&&<p role="status">Loading experiment…</p>}
  {error&&<p role="alert">{error}</p>}
  {rows&&<>
   <p>Conversion counts opted-in assignments with at least one website order. A shopper’s attribution expires after 24 hours.</p>
   {rows.map((row,index)=><div key={row.slug} className="anFBItem">
    <strong>{index===0?"A":"B"} · {row.slug}</strong>
    <span>{row.assignments} opted-in assignments</span>
    <span>{row.converting} with orders · {row.assignments?(100*row.converting/row.assignments).toFixed(1)+"%":"—"}</span>
   </div>)}
  </>}
 </div>;
}
