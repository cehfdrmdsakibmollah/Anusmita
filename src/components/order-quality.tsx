"use client";
import {useEffect,useMemo,useState} from "react";
type OrderRecord={_id:string;orderNumber:string;orderStatus:string;paymentStatus:string;customer?:{name?:string;phone?:string};createdAt:string};
type Check={order:OrderRecord;issues:string[]};
const normalizePhone=(value:string)=>value.replace(/[\s().-]/g,"").replace(/^\+88/,"");
function inspectOrders(orders:OrderRecord[]):Check[]{
 const counts=new Map<string,number>();
 for(const order of orders){const p=normalizePhone(order.customer?.phone||"");if(p)counts.set(p,(counts.get(p)||0)+1);}
 return orders.map(order=>{
  const issues:string[]=[];
  const phone=normalizePhone(order.customer?.phone||"");
  if(!/^01[3-9]\d{8}$/.test(phone))issues.push("Phone requires manual format verification");
  if(phone&&(counts.get(phone)||0)>1)issues.push("Phone appears in multiple orders on this page — review, not proof of fraud");
  if(!order.customer?.name?.trim())issues.push("Customer name missing");
  return {order,issues};
 }).filter(row=>row.issues.length>0);
}
export default function OrderQuality(){
 const [orders,setOrders]=useState<OrderRecord[]>([]);
 const [page,setPage]=useState(1);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 async function load(nextPage:number){
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/orders?page="+nextPage,{cache:"no-store"});
   if(!response.ok)throw new Error(response.status===403?"Orders permission required.":"Could not load order records.");
   const result=await response.json();
   setOrders(Array.isArray(result.orders)?result.orders:[]);setPage(nextPage);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load orders.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load(1);},[]);
 const warnings=useMemo(()=>inspectOrders(orders),[orders]);
 return <section className="adminCard" aria-label="Order quality review">
  <h2>Order Quality & Manual Risk Review</h2>
  <p className="smallprint">Read-only operational checks for the most recent 30 orders on the selected page. Checks use recorded order information only. They do not establish fraud, block a customer, change an order or send messages.</p>
  <p className="notice">A repeated phone number can reflect a genuine returning customer or multiple purchases. Never treat this as evidence of fraudulent activity without independent review.</p>
  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
   <button type="button" className="button small light" disabled={busy||page<=1} onClick={()=>void load(page-1)}>Previous page</button>
   <span>Page {page}</span>
   <button type="button" className="button small light" disabled={busy||orders.length<30} onClick={()=>void load(page+1)}>Next page</button>
   <button type="button" className="button small light" disabled={busy} onClick={()=>void load(page)}>Refresh</button>
  </div>
  {busy&&<p role="status">Checking recorded orders…</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  {!busy&&!error&&<><p><strong>{warnings.length}</strong> order(s) need manual information review out of <strong>{orders.length}</strong> records on this page.</p>
   {warnings.length?<div style={{overflowX:"auto"}}><table><thead><tr><th>Order</th><th>Status</th><th>Manual review reasons</th></tr></thead><tbody>
    {warnings.map(({order,issues})=><tr key={order._id}><td>{order.orderNumber||order._id}</td><td>{order.orderStatus}</td><td>{issues.join("; ")}</td></tr>)}
   </tbody></table></div>:<p className="smallprint">No format or repeated-number review flags on this page.</p>}
   <p className="smallprint">This is not global duplicate detection: comparisons are limited to the 30 records returned per page. No device fingerprinting, customer blacklist or AI fraud prediction is enabled.</p>
  </>}
 </section>;
}
