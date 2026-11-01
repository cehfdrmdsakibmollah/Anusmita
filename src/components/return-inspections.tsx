"use client";
import {useEffect,useState} from "react";
type Item={orderId:string;orderNumber:string;returnedAt:string;condition:string;note:string;revision:number;inspectedAt:string|null};
const conditions=["pending","sellable","damaged","quarantine"] as const;
export default function ReturnInspections({role}:{role:string}){
 const [items,setItems]=useState<Item[]>([]),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[saving,setSaving]=useState(""),[notice,setNotice]=useState("");
 const canEdit=["owner","admin","inventory"].includes(role);
 async function load(nextPage:number){setLoading(true);setNotice("");try{
  const res=await fetch("/api/admin/return-inspections?page="+nextPage,{cache:"no-store"});const body=await res.json();
  if(!res.ok)throw new Error(body.error||"Unable to load returned orders");
  setItems(Array.isArray(body.items)?body.items:[]);setPage(nextPage);
 }catch(e){setNotice(e instanceof Error?e.message:"Unable to load inspections");}finally{setLoading(false);}}
 useEffect(()=>{void load(1);},[]);
 function edit(id:string,changes:Partial<Item>){setItems(old=>old.map(item=>item.orderId===id?{...item,...changes}:item));}
 async function save(item:Item){
  setSaving(item.orderId);setNotice("");
  try{const response=await fetch("/api/admin/return-inspections",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:item.orderId,condition:item.condition==="uninspected"?"pending":item.condition,note:item.note,revision:item.revision})});const body=await response.json();
   if(!response.ok)throw new Error(body.error||"Inspection could not be saved");
   setNotice("Inspection saved and audited. No stock has been changed.");await load(page);
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Save failed"));}
  finally{setSaving("");}
 }
 return <section className="adminCard"><h2>Returned Orders · RTO Inspection</h2>
 <p className="smallprint">Only actual returned, non-test orders appear. Record physical inspection condition and notes. Marking an item sellable does NOT restock it; stock adjustment must be separately reviewed and authorized.</p>
 <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
 <button type="button" className="button small light" disabled={loading||page===1} onClick={()=>void load(page-1)}>Previous</button><span>Page {page}</span><button type="button" className="button small light" disabled={loading||items.length<30} onClick={()=>void load(page+1)}>Next</button><button className="button small light" type="button" disabled={loading} onClick={()=>void load(page)}>Refresh</button></div>
 {loading&&<p role="status">Loading returned orders…</p>}{notice&&<p role="status">{notice}</p>}
 {!loading&&items.length===0&&<p className="notice">No returned orders found on this page.</p>}
 <div style={{display:"grid",gap:12,marginTop:16}}>{items.map(item=><article className="kpi" key={item.orderId} style={{padding:16}}>
 <h3>{item.orderNumber}</h3><p className="smallprint">Return recorded: {new Date(item.returnedAt).toLocaleString("en-BD")} · Revision {item.revision}</p>
 <div className="field"><label htmlFor={"condition-"+item.orderId}>Condition</label><select id={"condition-"+item.orderId} disabled={!canEdit||!!saving} value={item.condition==="uninspected"?"pending":item.condition} onChange={e=>edit(item.orderId,{condition:e.target.value})}>{conditions.map(c=><option key={c} value={c}>{c==="pending"?"Pending inspection":c==="sellable"?"Sellable":c==="damaged"?"Damaged":"Quarantine"}</option>)}</select></div>
 <div className="field"><label htmlFor={"note-"+item.orderId}>Inspection note</label><textarea id={"note-"+item.orderId} disabled={!canEdit||!!saving} rows={2} minLength={8} maxLength={500} value={item.note} onChange={e=>edit(item.orderId,{note:e.target.value})} placeholder="Describe physical inspection and packaging condition"/></div>
 {canEdit&&<button className="button small" type="button" disabled={!!saving||item.note.trim().length<8} onClick={()=>void save(item)}>{saving===item.orderId?"Saving…":"Save audited inspection"}</button>}</article>)}</div>
 </section>;
}
