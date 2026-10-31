"use client";
import {useEffect,useState} from "react";
type Snapshot={inventory:{skuCount:number;onHand:number;reserved:number;stockCostPaisa:number;linkedSuppliers:number};
 customerEligibility:{customersWithPaidDeliveredOrders:number;paidDeliveredOrders:number};
 warehouseStatus:string;loyaltyStatus:string;integrationsStatus:string};
const modules=[
 {name:"Warehouse & Stock Transfers",status:"Planning / not active",detail:"Global stock is recorded, but independent warehouse locations and transactional transfers are not yet implemented.",href:"/admin?tab=Inventory"},
 {name:"Customer Loyalty & VIP",status:"Eligibility preview only",detail:"Paid, delivered order summaries can inform future eligibility. No tiers or discounts are granted until rules and customer consent are approved.",href:"/admin?tab=Orders"},
 {name:"Header & Footer Builder",status:"Homepage CMS available",detail:"Existing Homepage Studio manages banners and sections. Header and footer layout editing is not activated; original branding remains unchanged.",href:"/admin?tab=Homepage%20Studio"},
 {name:"Marketing Automation",status:"Provider setup required",detail:"Meta/GA4 tracking needs consent rules, official configuration, events validation, deduplication and testing before publishing.",href:"/admin?tab=Homepage%20Studio"},
 {name:"Omnichannel Social Inbox",status:"Provider setup required",detail:"WhatsApp, Facebook and Instagram require approved access, signed webhooks and provider-side account permissions.",href:"/admin?tab=Assistant%20Replies"}
] as const;
export default function OperationsRoadmap(){
 const [data,setData]=useState<Snapshot|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 async function refresh(){
  setLoading(true);setError("");
  try{const res=await fetch("/api/admin/operations-readiness",{cache:"no-store"});if(!res.ok)throw new Error(res.status===403?"Not authorized for operations readiness.":"Unable to load records.");
   setData(await res.json());
  }catch(e){setError(e instanceof Error?e.message:"Unable to load records.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 return <section className="adminCard"><h2>Enterprise Operations Workspace</h2>
  <p className="smallprint">Actual configuration and operational baseline for the five remaining modules. This workspace does not enable integrations, alter stock or issue customer rewards.</p>
  <button className="button small light" type="button" onClick={()=>void refresh()} disabled={loading}>Refresh records</button>
  {loading&&<p role="status">Reading actual recorded operations…</p>}
  {error&&<p role="alert" className="error">{error}</p>}
  {data&&<><div className="kpiGrid">
   {([["Recorded SKUs",data.inventory.skuCount],["Physical units recorded",data.inventory.onHand],["Reserved units",data.inventory.reserved],["Supplier-linked SKUs",data.inventory.linkedSuppliers],["Customers with paid delivered orders",data.customerEligibility.customersWithPaidDeliveredOrders],["Paid delivered orders",data.customerEligibility.paidDeliveredOrders]] as [string,number][]).map(([label,value])=><div className="kpi" key={label}><p className="muted">{label}</p><div className="number">{value}</div></div>)}
   </div><p className="notice">{data.warehouseStatus} {data.loyaltyStatus}</p></>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
   {modules.map(m=><article className="kpi" key={m.name}><h3>{m.name}</h3><strong>{m.status}</strong><p className="smallprint">{m.detail}</p><a href={m.href}>Open existing workspace</a></article>)}
  </div>
  <p className="smallprint">External services cannot be activated by merely inserting API keys. Each requires signed webhook handling, permissions, consent, retries, and end-to-end verification.</p>
 </section>;
}
