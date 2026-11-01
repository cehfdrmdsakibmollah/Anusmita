"use client";
import {useEffect,useState} from "react";
import ProviderConnect from "@/components/provider-connect";
type Integration={id:string;name:string;group:string;configured:boolean;verified:boolean;missing:string[];instructions:string};
export default function IntegrationHub(){
 const [items,setItems]=useState<Integration[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 async function refresh(){
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/integrations",{cache:"no-store"});
   if(!response.ok)throw new Error(response.status===403?"Owner or admin access required.":"Unable to check integration settings.");
   const data=await response.json();
   setItems(Array.isArray(data.integrations)?data.integrations:[]);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load integration readiness");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 const groups=[...new Set(items.map(item=>item.group))];
 async function copy(keys:string[]){
  try{await navigator.clipboard.writeText(keys.join("\n"));setMessage("Configuration key names copied; no secrets copied.");}
  catch{setMessage("Clipboard unavailable. Use the key names listed below.");}
 }
 return <section className="adminCard" aria-label="External integrations">
  <h2>Integration Hub</h2>
  <ProviderConnect/>
  <p className="smallprint">Connect external services safely after receiving official provider credentials. This hub checks configuration names only: it does not claim live connectivity, create consignments, send messages, charge payments, or enable checkout.</p>
  <p className="notice">All integrations remain disabled until their official API adapter, permissions, authentication, webhook signature validation, duplicate-event protection and test transactions have been verified.</p>
  <p><a href="https://app.netlify.com/projects/anusmita/configuration/env" target="_blank" rel="noreferrer">Manage secrets in Netlify environment settings</a> (never paste private API keys into a storefront form).</p>
  <button type="button" className="button small light" onClick={()=>void refresh()} disabled={loading}>Refresh readiness</button>
  {loading&&<p role="status">Checking server configuration…</p>}
  {error&&<p role="alert" className="error">{error}</p>}
  {message&&<p role="status">{message}</p>}
  {groups.map(group=><div key={group}>
   <h3 style={{marginTop:24}}>{group}</h3>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
   {items.filter(item=>item.group===group).map(item=><article key={item.id} className="kpi">
    <strong>{item.name}</strong>
    <p className="smallprint">Configuration: {item.configured?"Keys present (unverified)":"Missing required keys"}</p>
    <p className="smallprint">Connection: Not verified · Activation: Disabled</p>
    <p className="smallprint">{item.instructions}</p>
    <p className="smallprint">Required setting names: {item.missing.length?item.missing.join(", "):"All listed keys present"}</p>
    <button type="button" className="button small light" onClick={()=>void copy(item.missing)}>Copy missing key names</button>
   </article>)}
   </div>
  </div>)}
  <p className="smallprint">Names are onboarding conventions, not a guarantee an adapter currently consumes them. This page offers secure encrypted credential verification for supported providers, but does not activate business workflows or allow arbitrary script injection.</p>
 </section>;
}
