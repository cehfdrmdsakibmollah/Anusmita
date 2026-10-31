"use client";
import {useEffect,useState} from "react";
type Customer={phone:string;name:string;orderCount:number;deliveredCount:number;deliveredValuePaisa:number;lastOrderAt:string;tier:string};
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
export default function CustomerCRM(){
 const [customers,setCustomers]=useState<Customer[]>([]),[page,setPage]=useState(1);
 const [busy,setBusy]=useState(true),[error,setError]=useState("");
 async function load(p:number){
  setBusy(true);setError("");
  try{
   const res=await fetch("/api/admin/customers?page="+p,{cache:"no-store"});
   if(!res.ok)throw new Error(res.status===403?"Customer access denied.":"Unable to load CRM records.");
   const body=await res.json();setCustomers(Array.isArray(body.customers)?body.customers:[]);setPage(p);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load customers.");setCustomers([]);}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load(1);},[]);
 return <section className="adminCard" aria-label="Customer CRM">
  <h2>Customers & CRM</h2>
  <p className="smallprint">Existing, non-test order records only. Customer profiles are grouped by the exact phone stored on orders, not verified identity. No fake loyalty points, automated segmentation or marketing messages.</p>
  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
   <button type="button" className="button small light" disabled={busy||page===1} onClick={()=>void load(page-1)}>Previous</button>
   <span>Page {page}</span>
   <button type="button" className="button small light" disabled={busy||customers.length<30} onClick={()=>void load(page+1)}>Next</button>
   <button type="button" className="button small light" disabled={busy} onClick={()=>void load(page)}>Refresh</button>
  </div>
  {busy&&<p role="status">Loading customer order summaries…</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  {!busy&&!error&&(customers.length?<div style={{overflowX:"auto"}}><table><thead><tr><th>Customer</th><th>Phone (staff only)</th><th>Orders</th><th>Delivered</th><th>Delivered order value</th><th>Loyalty</th></tr></thead><tbody>
   {customers.map(c=><tr key={c.phone}><td>{c.name||"Name not recorded"}</td><td>{c.phone}</td><td>{c.orderCount}</td><td>{c.deliveredCount}</td><td>{money(c.deliveredValuePaisa)}</td><td>{c.tier}</td></tr>)}
  </tbody></table></div>:<p className="notice">No customer orders on this page.</p>)}
  <p className="smallprint">Delivered order value is not proof of settlement. Tier remains unassigned until an approved, verified-purchase loyalty policy is enabled.</p>
 </section>;
}
