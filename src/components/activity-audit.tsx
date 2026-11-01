"use client";
import {useEffect,useState} from "react";
type Event={id:string;actorId:string|null;action:string;entity:string;entityId:string;createdAt:string};
const entities=["","Order","Product","Payment","Supplier","PurchaseOrder","User"];
export default function ActivityAudit(){
 const [rows,setRows]=useState<Event[]>([]),[entity,setEntity]=useState(""),[page,setPage]=useState(1);
 const [busy,setBusy]=useState(true),[error,setError]=useState("");
 async function load(nextPage:number,nextEntity:string){
  setBusy(true);setError("");
  try{
   const query=new URLSearchParams({page:String(nextPage)});
   if(nextEntity)query.set("entity",nextEntity);
   const response=await fetch("/api/admin/audit-logs?"+query,{cache:"no-store"});
   if(!response.ok)throw new Error(response.status===403?"You do not have audit permission.":"Could not read the audit timeline.");
   const body=await response.json();
   setRows(Array.isArray(body.logs)?body.logs:[]);setPage(nextPage);
  }catch(e){setRows([]);setError(e instanceof Error?e.message:"Unable to read audit entries.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load(1,"");},[]);
 return <section className="adminCard" aria-label="Activity audit log">
  <h2>Activity Audit Logs</h2>
  <p className="smallprint">Read-only timeline of existing recorded staff actions. Missing events cannot be reconstructed retroactively. This is a database audit trail, not tamper-proof external storage.</p>
  <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
   <label htmlFor="auditEntity">Filter by entity</label>
   <select id="auditEntity" value={entity} onChange={e=>{setEntity(e.target.value);void load(1,e.target.value);}}>
    {entities.map(e=><option key={e} value={e}>{e||"All entities"}</option>)}
   </select>
   <button type="button" className="button small light" disabled={busy||page===1} onClick={()=>void load(page-1,entity)}>Previous</button>
   <span>Page {page}</span>
   <button type="button" className="button small light" disabled={busy||rows.length<30} onClick={()=>void load(page+1,entity)}>Next</button>
   <button type="button" className="button small light" disabled={busy} onClick={()=>void load(page,entity)}>Refresh</button>
  </div>
  {busy&&<p role="status">Loading audit records…</p>}
  {error&&<p role="alert" className="error">{error}</p>}
  {!busy&&!error&&<>{rows.length===0?<p className="notice">No recorded audit events on this page.</p>:<div style={{overflowX:"auto"}}><table>
   <thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Record ID</th><th>Actor ID</th></tr></thead>
   <tbody>{rows.map(entry=><tr key={entry.id}>
    <td>{Number.isFinite(Date.parse(entry.createdAt))?new Date(entry.createdAt).toLocaleString("en-BD"):"Unknown"}</td>
    <td>{entry.action}</td><td>{entry.entity}</td>
    <td><code>{entry.entityId}</code></td><td><code>{entry.actorId||"System / unknown"}</code></td>
   </tr>)}</tbody>
  </table></div>}</>}
  <p className="smallprint">Private details, token values and customer data are intentionally excluded. Only existing logged actions appear here.</p>
 </section>;
}
