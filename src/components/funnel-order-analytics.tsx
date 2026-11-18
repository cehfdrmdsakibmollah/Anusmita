"use client";
import {useEffect,useState} from "react";

type Metrics={orders:number;delivered:number;cancelledOrReturned:number};

export function FunnelOrderAnalytics({slug}:{slug:string}){
 const [days,setDays]=useState("30");
 const [metrics,setMetrics]=useState<Metrics|null>(null);
 const [error,setError]=useState("");
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  setMetrics(null);
  setError("");
  async function load(){
   try{
    const response=await fetch("/api/admin/funnel-pages/analytics?"+new URLSearchParams({slug,days}),
     {cache:"no-store",signal:controller.signal});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Unable to load order analytics");
    if(!controller.signal.aborted)setMetrics(data);
   }catch(error){
    if(!controller.signal.aborted)setError(error instanceof Error?error.message:"Unable to load order analytics");
   }
  }
  void load();
  return ()=>controller.abort();
 },[slug,days,refresh]);
 return <div className="anFBFields">
  <h3>Funnel order analytics</h3>
  <label>Order date range<select value={days} onChange={event=>setDays(event.target.value)}>
   <option value="7">Last 7 days</option><option value="30">Last 30 days</option>
  </select></label>
  <p>Counts include website orders placed after the shopper allowed attribution on this campaign. Delivery and cancellation reflect the latest order status.</p>
  {error?<p role="alert">{error}</p>:metrics?<dl className="anFBItem">
   <div><dt>Attributed orders</dt><dd>{metrics.orders}</dd></div>
   <div><dt>Delivered</dt><dd>{metrics.delivered}</dd></div>
   <div><dt>Cancelled or returned</dt><dd>{metrics.cancelledOrReturned}</dd></div>
  </dl>:<p role="status">Loading orders…</p>}
  <button type="button" onClick={()=>setRefresh(value=>value+1)}>Refresh orders</button>
 </div>;
}
