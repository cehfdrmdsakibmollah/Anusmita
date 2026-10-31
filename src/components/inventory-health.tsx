"use client";
import {useEffect,useState} from "react";
type Item={id:string;sku:string;name:string;onHand:number;reserved:number;available:number;reorderLevel:number;suggestedUnits:number;expiryAt:string|null;batch:string;hasSupplier:boolean};
export default function InventoryHealth(){
 const [rows,setRows]=useState<Item[]>([]),[filter,setFilter]=useState("low"),[page,setPage]=useState(1);
 const [busy,setBusy]=useState(true),[error,setError]=useState("");
 async function load(nextPage:number,nextFilter:string){
  setBusy(true);setError("");
  try{
   const params=new URLSearchParams({page:String(nextPage),filter:nextFilter});
   const response=await fetch("/api/admin/inventory-health?"+params,{cache:"no-store"});
   if(!response.ok)throw new Error(response.status===403?"Inventory permission required.":"Unable to load inventory health.");
   const data=await response.json();setRows(Array.isArray(data.items)?data.items:[]);setPage(nextPage);
  }catch(e){setError(e instanceof Error?e.message:"Unable to read inventory.");setRows([]);}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load(1,"low");},[]);
 return <section className="adminCard">
  <h2>Inventory Health & Reorder Suggestions</h2>
  <p className="smallprint">Real recorded SKUs only. No physical stock is inferred and no purchase orders are sent automatically. Low-stock suggestions target the product's existing reorder threshold.</p>
  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
   <label htmlFor="inventoryHealthFilter">Review</label>
   <select id="inventoryHealthFilter" value={filter} onChange={e=>{setFilter(e.target.value);void load(1,e.target.value);}}>
    <option value="low">At/below reorder level</option><option value="expiry">Expired / expires within 60 days</option><option value="all">All active SKUs</option>
   </select>
   <button type="button" className="button small light" disabled={busy||page===1} onClick={()=>void load(page-1,filter)}>Previous</button>
   <span>Page {page}</span>
   <button type="button" className="button small light" disabled={busy||rows.length<30} onClick={()=>void load(page+1,filter)}>Next</button>
   <button type="button" className="button small light" disabled={busy} onClick={()=>void load(page,filter)}>Refresh</button>
  </div>
  {busy&&<p role="status">Loading recorded inventory…</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  {!busy&&!error&&(rows.length?<div style={{overflowX:"auto"}}><table><thead><tr><th>SKU / Product</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Reorder threshold</th><th>Suggested units</th><th>Batch / Expiry</th><th>Supplier linked</th></tr></thead><tbody>
   {rows.map(p=><tr key={p.id}><td>{p.sku}<div className="smallprint">{p.name}</div></td><td>{p.onHand}</td><td>{p.reserved}</td><td>{p.available}</td><td>{p.reorderLevel}</td><td>{p.suggestedUnits}</td><td>{p.batch||"Not recorded"} / {p.expiryAt?new Date(p.expiryAt).toLocaleDateString("en-BD"):"Not recorded"}</td><td>{p.hasSupplier?"Yes":"No"}</td></tr>)}
  </tbody></table></div>:<p className="notice">No matching SKUs on this page.</p>)}
  <p className="smallprint">For source-after-order products, suggestions are planning indicators, not a claim of stock or supplier availability. Any supplier purchase requires separate confirmation.</p>
 </section>;
}
