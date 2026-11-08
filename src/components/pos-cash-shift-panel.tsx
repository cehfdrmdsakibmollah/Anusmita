"use client";
import {useCallback,useEffect,useState} from "react";
import {Wallet,LockKeyhole,RefreshCw,AlertCircle} from "lucide-react";
type Shift={id:string;branchName:string;cashierName:string;status:"open"|"closed";openedAt:string;closedAt:string|null;openingFloatPaisa:number;cashSalesPaisa:number;expectedCashPaisa:number;saleCount:number;closingCountPaisa:number|null;variancePaisa:number|null;closingNote:string};
type ResponseShape={current:Shift|null;history:Shift[]};
const money=(n:number)=>"৳ "+(n/100).toLocaleString("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2});
const paisa=(text:string)=>Math.round(Number(text||0)*100);
export default function PosCashShiftPanel({branchId,canCheckout,onActiveChange}:{branchId:string;canCheckout:boolean;onActiveChange:(active:boolean)=>void}){
 const [info,setInfo]=useState<ResponseShape>({current:null,history:[]}),[busy,setBusy]=useState(false);
 const [opening,setOpening]=useState("0"),[count,setCount]=useState(""),[note,setNote]=useState(""),[message,setMessage]=useState(""),[error,setError]=useState("");
 const load=useCallback(async()=>{
  if(!branchId){setInfo({current:null,history:[]});onActiveChange(false);return;}
  try{
   const response=await fetch("/api/admin/offline-pos/shifts?branchId="+encodeURIComponent(branchId),{cache:"no-store"});
   const json=await response.json();
   if(!response.ok)throw Error(json.error||"Shift unavailable");
   setInfo(json);onActiveChange(Boolean(json.current));
  }catch(e){setError(e instanceof Error?e.message:"Shift unavailable");onActiveChange(false);}
 },[branchId,onActiveChange]);
 useEffect(()=>{void load();},[load]);
 async function send(method:"POST"|"PATCH",payload:object){
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/offline-pos/shifts",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const json=await response.json();if(!response.ok)throw Error(json.error||"Shift action failed");
   setMessage(method==="POST"?"Cashier shift opened. Sales can now be recorded.":"Shift closed and cash variance recorded.");
   setOpening("0");setCount("");setNote("");await load();
  }catch(e){setError(e instanceof Error?e.message:"Shift action failed");}
  finally{setBusy(false);}
 }
 const shift=info.current;
 const valid=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
 return <section className="anpos-shift" aria-label="Cashier shift reconciliation">
  <header><h2><Wallet size={17}/> Cashier Shift</h2><div><span className={shift?"anpos-shift-open":"anpos-shift-closed"}>{shift?"Drawer open":"No active shift"}</span><button type="button" aria-label="Refresh shift" onClick={()=>void load()} disabled={!branchId||busy}><RefreshCw size={15}/></button></div></header>
  {!branchId?<p>Select a branch to manage the cash drawer.</p>:shift?
   <div className="anpos-shift-body"><div className="anpos-shift-metrics"><div><small>Opening Float</small><strong>{money(shift.openingFloatPaisa)}</strong></div><div><small>Cash Sales · {shift.saleCount}</small><strong>{money(shift.cashSalesPaisa)}</strong></div><div><small>Expected Drawer</small><strong>{money(shift.expectedCashPaisa)}</strong></div></div>
    <div className="anpos-shift-close"><label>Counted drawer cash (৳)<input type="number" min="0" step=".01" value={count} onChange={e=>setCount(e.target.value)} placeholder="Enter physically counted cash"/></label>
    {count!==""&&valid(paisa(count))&&<div className="anpos-shift-variance">Variance: <strong>{money(paisa(count)-shift.expectedCashPaisa)}</strong></div>}
    <label>Closing note (optional)<input maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Handover / reason for variance"/></label>
    <button type="button" disabled={!canCheckout||busy||count===""||!valid(paisa(count))} onClick={()=>void send("PATCH",{shiftId:shift.id,closingCountPaisa:paisa(count),closingNote:note.trim()})}><LockKeyhole size={15}/> Close Shift & Reconcile</button></div>
   </div>:
   <div className="anpos-shift-open-form"><p>Open a cashier shift before confirming sales. Existing invoices remain unchanged.</p><label>Opening cash float (৳)<input type="number" min="0" step=".01" value={opening} onChange={e=>setOpening(e.target.value)}/></label><button type="button" disabled={!canCheckout||busy||!valid(paisa(opening))} onClick={()=>void send("POST",{branchId,openingFloatPaisa:paisa(opening)})}><Wallet size={15}/> Open Cash Drawer</button></div>
  }
  {error&&<p role="alert" className="anpos-shift-error"><AlertCircle size={14}/>{error}</p>}
  {message&&<p role="status" className="anpos-shift-message">{message}</p>}
  {info.history.length>0&&<details className="anpos-shift-history"><summary>Recent cashier shifts ({info.history.length})</summary>{info.history.slice(0,8).map(h=><div key={h.id}><span>{new Date(h.openedAt).toLocaleString("en-BD")} · {h.status}</span><strong>{money(h.expectedCashPaisa)}</strong>{h.status==="closed"&&<small>Variance {money(h.variancePaisa||0)}</small>}</div>)}</details>}
 </section>;
}
