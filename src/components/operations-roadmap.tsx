"use client";
import {useEffect,useState} from "react";
type Loyalty={eligibleCustomers:number;preview:{silver:number;gold:number;platinum:number};disclaimer:string};
type Location={id:string;code:string;name:string;address:string;active:boolean};
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
export default function OperationsRoadmap({role}:{role:string}){
 const [data,setData]=useState<Snapshot|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [loyalty,setLoyalty]=useState<Loyalty|null>(null);
 const [locations,setLocations]=useState<Location[]>([]),[code,setCode]=useState(""),[name,setName]=useState(""),[address,setAddress]=useState(""),[notice,setNotice]=useState(""),[saving,setSaving]=useState(false);
 async function refresh(){
  setLoading(true);setError("");
  try{const res=await fetch("/api/admin/operations-readiness",{cache:"no-store"});if(!res.ok)throw new Error(res.status===403?"Not authorized for operations readiness.":"Unable to load records.");
   setData(await res.json());
   if(["owner","admin","finance","analyst"].includes(role)){const lr=await fetch("/api/admin/loyalty-preview",{cache:"no-store"});if(lr.ok)setLoyalty(await lr.json());}
   const l=await fetch("/api/admin/warehouse-locations",{cache:"no-store"});if(l.ok){const body=await l.json();setLocations(body.locations||[]);}
  }catch(e){setError(e instanceof Error?e.message:"Unable to load records.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 async function createLocation(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setNotice("");try{const res=await fetch("/api/admin/warehouse-locations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,name,address})});const result=await res.json();if(!res.ok)throw new Error(result.error||"Location rejected");setNotice("Location registered; no inventory stock transferred.");setCode("");setName("");setAddress("");await refresh();}catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Unable to register location"));}finally{setSaving(false);}}
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
  {loyalty&&<div className="adminCard"><h3>Loyalty Eligibility Preview</h3><div className="kpiGrid">{(["silver","gold","platinum"] as const).map(t=><div className="kpi" key={t}><p className="muted">{t.toUpperCase()} — eligible preview</p><div className="number">{loyalty.preview[t]}</div></div>)}</div><p className="smallprint">{loyalty.disclaimer}</p></div>}
  <div className="adminCard"><h3>Warehouse Location Registry</h3><p className="smallprint">Create internal location records only. Stock allocation and stock transfers remain disabled; this does not establish physical inventory at any location.</p>{notice&&<p role="status">{notice}</p>}{["owner","admin"].includes(role)&&<form onSubmit={e=>void createLocation(e)} className="adminForm"><div className="field"><label>Location code</label><input required minLength={2} maxLength={24} pattern="[A-Za-z0-9_-]{2,24}" value={code} onChange={e=>setCode(e.target.value)} placeholder="DHAKA-HUB"/></div><div className="field"><label>Location name</label><input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></div><div className="field"><label>Address (optional)</label><input maxLength={250} value={address} onChange={e=>setAddress(e.target.value)}/></div><button type="submit" className="button" disabled={saving}>Register location</button></form>}<h3>Registered locations</h3>{locations.length?<ul>{locations.map(l=><li key={l.id}>{l.code} — {l.name} ({l.active?"Active":"Inactive"})</li>)}</ul>:<p className="smallprint">No locations registered.</p>}</div>
  <p className="smallprint">External services cannot be activated by merely inserting API keys. Each requires signed webhook handling, permissions, consent, retries, and end-to-end verification.</p>
 </section>;
}
