"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,RefreshCw,ClipboardCheck,PackageCheck,Trash2,ShieldCheck,AlertTriangle} from "lucide-react";
type ReturnRow={id:string;invoiceNumber:string;branchId:string;branchName:string;disposition:"quarantine"|"damaged";inspectionState:"pending"|"restocked"|"disposed";inspectionNote:string;inspectedAt:string|null;createdAt:string;lines:{sku:string;name:string;quantity:number}[]};
export default function PosReturnInspections({canEdit}:{canEdit:boolean}){
 const [records,setRecords]=useState<ReturnRow[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[selected,setSelected]=useState(""),[note,setNote]=useState("");
 const [outcome,setOutcome]=useState<"restocked"|"disposed">("restocked");
 const [confirmed,setConfirmed]=useState(false),[filter,setFilter]=useState<"pending"|"all">("pending");
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/offline-pos/returns/inspect",{cache:"no-store"});
   const json=await response.json();if(!response.ok)throw Error(json.error||"Return inspection unavailable");
   setRecords(json.returns||[]);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load inspection queue");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const view=useMemo(()=>records.filter(x=>filter==="all"||x.inspectionState==="pending"),[records,filter]);
 const item=records.find(x=>x.id===selected);
 async function submit(){
  if(!canEdit||!item||item.inspectionState!=="pending"||!confirmed||note.trim().length<8||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/offline-pos/returns/inspect",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({returnId:item.id,outcome,note:note.trim()})});
   const json=await response.json();if(!response.ok)throw Error(json.error||"Inspection failed");
   setNotice((json.alreadyApplied?"Already inspected: ":"Inspection recorded: ")+json.items+" units "+json.outcome+". "+
    (outcome==="restocked"?"Approved items restored to physical and branch inventory.":"Disposed items were not added to sellable stock."));
   setSelected("");setNote("");setConfirmed(false);await load();
  }catch(e){setError(e instanceof Error?e.message:"Inspection failed");}
  finally{setBusy(false);}
 }
 function choose(x:ReturnRow){setSelected(x.id);setNote("");setOutcome(x.disposition==="damaged"?"disposed":"restocked");setConfirmed(false);setNotice("");}
 return <main className="anpos-inspections"><header><div><p>ANUSMITA · AUDITED PHYSICAL INVENTORY</p><h1>Return Stock Inspections</h1><span>Cash refunds do not automatically restore stock. Every unit requires inspection or safe disposal.</span></div><Link href="/admin/offline-pos"><ArrowLeft size={16}/> Back to POS</Link></header>
 <nav><button type="button" className={filter==="pending"?"active":""} onClick={()=>setFilter("pending")}>Pending inspection ({records.filter(x=>x.inspectionState==="pending").length})</button><button type="button" className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>All returns</button><button onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/> Refresh</button></nav>
 {error&&<p role="alert" className="anpos-inspect-error"><AlertTriangle size={16}/>{error}</p>}{notice&&<p role="status" className="anpos-inspect-success"><ShieldCheck size={16}/>{notice}</p>}
 <div className="anpos-inspect-grid"><section className="anpos-inspect-card"><h2><ClipboardCheck size={17}/> Returned inventory</h2>
  <div className="anpos-inspect-list">{view.map(x=><button type="button" className={selected===x.id?"chosen":""} key={x.id} onClick={()=>choose(x)}><strong>{x.invoiceNumber}</strong><small>{x.branchName} · {new Date(x.createdAt).toLocaleString("en-BD")}</small><span>{x.lines.map(l=>l.sku+" × "+l.quantity).join(", ")}</span><em>{x.inspectionState} · {x.disposition}</em></button>)}{!view.length&&<p>No returns in this inspection view.</p>}</div></section>
  <section className="anpos-inspect-card"><h2><PackageCheck size={17}/> Inspect selected return</h2>
   {item?<><p>Invoice <strong>{item.invoiceNumber}</strong> · {item.branchName}</p><div className="anpos-inspect-items">{item.lines.map(l=><div key={l.sku}><span>{l.name}<small>{l.sku}</small></span><b>{l.quantity} pcs</b></div>)}</div>
    {item.inspectionState==="pending"?<><label>Inspection decision<select value={outcome} onChange={e=>{setOutcome(e.target.value as "restocked"|"disposed");setConfirmed(false)}}><option value="restocked" disabled={item.disposition==="damaged"}>Approved sellable — restock branch inventory</option><option value="disposed">Unsafe/damaged — dispose with no stock increase</option></select></label>
     <label>Inspection notes<textarea value={note} maxLength={500} minLength={8} onChange={e=>setNote(e.target.value)} placeholder="Record batch, packaging condition and disposition reasoning"/></label>
     <label className="anpos-inspect-consent"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I physically inspected these units and authorize the selected inventory treatment.</span></label>
     <button className="anpos-inspect-submit" disabled={!canEdit||busy||!confirmed||note.trim().length<8||(item.disposition==="damaged"&&outcome==="restocked")} onClick={()=>void submit()}>{outcome==="restocked"?<PackageCheck size={16}/>:<Trash2 size={16}/>} {busy?"Recording…":outcome==="restocked"?"Approve & Restock":"Record Disposal"}</button>
    </>:<p>This return has already been <strong>{item.inspectionState}</strong>. {item.inspectionNote}</p>}
    <p className="anpos-inspect-hint">Restocking adjusts global physical stock and the original branch allocation in one audited transaction. Disposal changes no sellable stock.</p>
   </>:<p>Select a return on the left to inspect or review its final disposition.</p>}
  </section></div>
 </main>;
}
