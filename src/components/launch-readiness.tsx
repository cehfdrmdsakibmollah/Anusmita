"use client";
import {useEffect,useState} from "react";
import {Settings,Store,Truck,ShieldCheck,History,Play,Save} from "lucide-react";
import LaunchDiagnostics from "./launch-diagnostics";
import IntegrationHub from "./integration-hub";
import type {StoreSettingsData} from "@/lib/store-settings";
import "./settings-control-center.css";

export default function SettingsControlCenter(){
 const [tab,setTab]=useState("General"),[data,setData]=useState<StoreSettingsData|null>(null),[saved,setSaved]=useState("");
 const [history,setHistory]=useState<{revision:number;createdAt:string}[]>([]),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[review,setReview]=useState(false);
 const dirty=!!data&&JSON.stringify(data)!==saved;
 async function load(){
  try{const response=await fetch("/api/admin/store-settings",{cache:"no-store"});const result=await response.json();if(!response.ok)throw Error(result.error||"Settings unavailable");setData(result.settings);setSaved(JSON.stringify(result.settings));setHistory(result.history);}
  catch(error){setNotice(error instanceof Error?error.message:"Settings unavailable");}
 }
 useEffect(()=>{void load();},[]);
 async function save(){
  if(!data)return;setBusy(true);setNotice("");
  try{
   const response=await fetch("/api/admin/store-settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const result=await response.json();if(!response.ok)throw Error(result.error||"Save failed");
   setData(result);setSaved(JSON.stringify(result));setReview(false);setNotice("Store policy saved. New checkout requests use the updated policy.");await load();
  }catch(error){setNotice(error instanceof Error?error.message:"Save failed");}finally{setBusy(false);}
 }
 function money(key:"minimumOrderPaisa"|"maximumCodPaisa"|"dhakaShippingPaisa"|"outsideShippingPaisa",label:string){
  return data&&<label>{label}<input type="number" min="0" step=".01" value={data[key]/100} onChange={e=>setData({...data,[key]:Math.round(Number(e.target.value)*100)})}/></label>;
 }
 return <section className="sc">
  <header><div><h1>Settings</h1><p>Configure your store, integrations and operational policies.</p></div><button disabled={!dirty||busy} onClick={()=>setReview(!review)}>View changes</button><button className="primary" disabled={!dirty||busy} onClick={()=>setReview(true)}><Save size={16}/> Save changes</button></header>
  <div className="scNotice"><Settings size={17}/>{dirty?"Unsaved configuration":"Saved configuration"}<span>Review changes before applying.</span></div>
  <nav>{["General","Payments","Shipping","Messaging","Security","System & Health"].map(name=><button key={name} aria-pressed={tab===name} onClick={()=>setTab(name)}>{name}</button>)}</nav>
  {notice&&<p role="status" className="scNotice">{notice}</p>}
  <div className="scColumns"><main>
   {(tab==="General"||tab==="Shipping")&&data&&<>
    {tab==="General"&&<article><h2><Store size={19}/> Store &amp; localization</h2><div className="scFields">
     <label>Store name<input maxLength={80} value={data.storeName} onChange={e=>setData({...data,storeName:e.target.value})}/></label>
     <label>Support email<input type="email" value={data.supportEmail} onChange={e=>setData({...data,supportEmail:e.target.value})}/></label>
     <label>Support phone<input maxLength={25} value={data.supportPhone} onChange={e=>setData({...data,supportPhone:e.target.value})}/></label>
     <label>Currency<input readOnly value="BDT — Bangladeshi Taka"/></label><label>Timezone<input readOnly value="Asia/Dhaka"/></label>
    </div><p>Store profile is saved here. Header and footer content is managed in <a href="/admin?tab=Header%20%26%20Footer">Header &amp; Footer</a>.</p></article>}
    <article><h2><Truck size={19}/> Checkout &amp; delivery policies</h2><div className="scFields">{money("minimumOrderPaisa","Minimum product subtotal (৳)")}{money("maximumCodPaisa","Maximum COD total (৳, 0 = unlimited)")}</div>
     <h3>Shipping zones</h3><div className="scFields">{money("dhakaShippingPaisa","Dhaka district fee (৳)")}{money("outsideShippingPaisa","Outside Dhaka fee (৳)")}</div>
     <p>Server checkout applies these fees and limits to new orders. Existing orders retain their original totals.</p></article>
    <article><h2><History size={19}/> Configuration history</h2>{history.length?history.map(item=><p key={item.revision}>Revision {item.revision} · {new Date(item.createdAt).toLocaleString("en-BD",{timeZone:"Asia/Dhaka"})}</p>):<p>Saved revisions will appear here.</p>}</article>
   </>}
   {["Payments","Messaging"].includes(tab)&&<IntegrationHub/>}
   {tab==="System & Health"&&<LaunchDiagnostics/>}
   {tab==="Security"&&<article><h2><ShieldCheck size={19}/> Security &amp; governance</h2><p>Store policy updates require an owner account. Existing permissions and audit records control administrative access.</p><a href="/admin?tab=Staff%20Management">Manage staff &amp; permissions</a><a href="/admin?tab=Activity%20Logs">Open activity logs</a></article>}
   {review&&data&&<article><h2>Review changes</h2>{Object.keys(data).filter(key=>JSON.parse(saved||"{}")[key]!==data[key as keyof StoreSettingsData]).map(key=><p key={key}>{key} · {String(JSON.parse(saved||"{}")[key])} → {String(data[key as keyof StoreSettingsData])}</p>)}<button disabled={busy||!dirty} className="primary" onClick={()=>void save()}>Apply store policy</button></article>}
  </main><aside><article><h2><Play size={19}/> Launch readiness</h2><p>Check current server configuration and database connectivity.</p><button onClick={()=>setTab("System & Health")}>Run diagnostics</button></article>
   <article><h2>Integrations</h2>{["bKash & Nagad","Pathao & Steadfast","Meta & WhatsApp"].map(name=><p key={name}>{name}<a href="/admin?tab=Integration%20Hub">Manage connections</a></p>)}</article>
   <article><h2><ShieldCheck size={19}/> Security &amp; governance</h2><p>Owner-only policy updates</p><p>Transactional audit records</p><p>Revision conflict protection</p><button onClick={()=>setTab("Security")}>Review access</button></article>
  </aside></div><footer><span>{dirty?"Unsaved changes":"All changes saved"}</span><button disabled={!dirty||busy} onClick={()=>{setData(JSON.parse(saved));setReview(false);}}>Discard</button><button className="primary" disabled={!dirty||busy} onClick={()=>setReview(true)}>Review &amp; apply</button></footer>
 </section>;
}
