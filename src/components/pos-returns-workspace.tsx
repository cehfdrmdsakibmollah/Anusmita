"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,RefreshCw,RotateCcw,ShieldCheck,AlertTriangle,Wallet,PackageSearch,FileText} from "lucide-react";
type Branch={id:string;name:string;code:string};
type Line={productId:string;sku:string;name:string;quantity:number;returnedQuantity:number;unitPricePaisa:number};
type Invoice={id:string;invoiceNumber:string;createdAt:string;branchName:string;customerName:string;subtotalPaisa:number;totalPaisa:number;refundedPaisa:number;lines:Line[]};
type ReturnRow={id:string;invoiceNumber:string;createdAt:string;managerName:string;refundedPaisa:number;reason:string;disposition:string;lines:{sku:string;quantity:number}[]};
const money=(n:number)=>"৳ "+(n/100).toLocaleString("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function PosReturnsWorkspace({canRefund}:{canRefund:boolean}){
 const [branches,setBranches]=useState<Branch[]>([]),[branchId,setBranchId]=useState("");
 const [invoices,setInvoices]=useState<Invoice[]>([]),[returns,setReturns]=useState<ReturnRow[]>([]);
 const [invoiceId,setInvoiceId]=useState(""),[quantities,setQuantities]=useState<Record<string,string>>({});
 const [reason,setReason]=useState(""),[disposition,setDisposition]=useState<"quarantine"|"damaged">("quarantine");
 const [cashConfirmed,setCashConfirmed]=useState(false),[opKey,setOpKey]=useState(()=>crypto.randomUUID());
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const selected=invoices.find(x=>x.id===invoiceId);
 const chosen=useMemo(()=>selected?.lines.map(l=>({...l,requested:Number(quantities[l.productId]||0)})).filter(l=>l.requested>0)||[],[selected,quantities]);
 const valid=chosen.length>0&&chosen.every(l=>Number.isInteger(l.requested)&&l.requested>=1&&l.requested<=l.quantity-l.returnedQuantity);
 const resetInput=()=>{setOpKey(crypto.randomUUID());setCashConfirmed(false);setNotice("");};
 const load=useCallback(async(id:string)=>{
  if(!id){setInvoices([]);setReturns([]);return;}
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/offline-pos/returns?branchId="+encodeURIComponent(id),{cache:"no-store"});
   const json=await response.json();if(!response.ok)throw Error(json.error||"Refund records unavailable");
   setInvoices(json.invoices||[]);setReturns(json.returns||[]);
  }catch(e){setError(e instanceof Error?e.message:"Failed loading refund records");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void (async()=>{
  try{
   const r=await fetch("/api/admin/offline-pos",{cache:"no-store"});const json=await r.json();
   if(!r.ok)throw Error(json.error||"Branch listing unavailable");
   const list=json.branches||[];setBranches(list);if(list.length)setBranchId(list[0].id);
  }catch(e){setError(e instanceof Error?e.message:"Branch listing failed");}
 })();},[]);
 useEffect(()=>{void load(branchId);},[branchId,load]);
 async function submit(){
  if(!canRefund||!selected||!valid||reason.trim().length<8||!cashConfirmed||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/offline-pos/returns",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({operationKey:opKey,saleId:selected.id,lines:chosen.map(l=>({productId:l.productId,quantity:l.requested})),reason:reason.trim(),disposition,cashHandedToCustomer:true})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||"Refund was not confirmed");
   setNotice((result.alreadyApplied?"Existing cash refund confirmed: ":"Cash refund recorded: ")+money(result.refundPaisa)+" for "+result.invoiceNumber+". Items remain non-sellable until explicit inspection.");
   setOpKey(crypto.randomUUID());setQuantities({});setReason("");setCashConfirmed(false);
   await load(branchId);
  }catch(e){setError((e instanceof Error?e.message:"Refund failed")+". Verify existing refunds before retrying; keep the same request values if the network is uncertain.");}
  finally{setBusy(false);}
 }
 return <main className="anpos-return">
  <header><div><span>ANUSMITA · CONTROLLED POS RETURNS</span><h1>Returns & Cash Refunds</h1><p>Manager-authorized refunds from original invoices. Returned units remain quarantined until inspection.</p></div><Link href="/admin/offline-pos"><ArrowLeft size={16}/> Back to POS</Link></header>
  <div className="anpos-return-toolbar"><label>Branch<select value={branchId} onChange={e=>{setBranchId(e.target.value);setInvoiceId("");setQuantities({});resetInput()}}><option value="">Select a branch</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><button type="button" onClick={()=>void load(branchId)} disabled={loading}><RefreshCw size={15}/> Refresh records</button><Link href="/admin/offline-pos">Open Manager Cash Shift</Link><Link href="/admin/offline-pos/inspections">Inspect returned stock</Link></div>
  {error&&<p role="alert" className="anpos-return-error"><AlertTriangle size={17}/>{error}</p>}
  {notice&&<p role="status" className="anpos-return-success"><ShieldCheck size={17}/>{notice}</p>}
  <div className="anpos-return-stats"><div><FileText size={20}/><span>Recent cash invoices<strong>{invoices.length}</strong></span></div><div><RotateCcw size={20}/><span>Recorded returns<strong>{returns.length}</strong></span></div><div><Wallet size={20}/><span>Refunds in loaded history<strong>{money(returns.reduce((n,r)=>n+r.refundedPaisa,0))}</strong></span></div></div>
  <div className="anpos-return-grid"><section className="anpos-return-card"><h2><RotateCcw size={17}/> Process an invoice return</h2>
   <label>Original confirmed cash invoice<select value={invoiceId} onChange={e=>{setInvoiceId(e.target.value);setQuantities({});resetInput()}}><option value="">Choose an invoice</option>{invoices.map(i=><option key={i.id} value={i.id}>{i.invoiceNumber} · {money(i.totalPaisa)} · {i.customerName||"Walk-in"}</option>)}</select></label>
   {selected&&<><p>Original paid: <strong>{money(selected.totalPaisa)}</strong> · Already refunded: <strong>{money(selected.refundedPaisa)}</strong></p>
    <div className="anpos-return-lines">{selected.lines.map(l=><div key={l.productId}><span><strong>{l.name}</strong><small>{l.sku} · Sold {l.quantity}, returned {l.returnedQuantity}, available to return {l.quantity-l.returnedQuantity}</small></span><input type="number" min="0" max={l.quantity-l.returnedQuantity} step="1" disabled={l.quantity<=l.returnedQuantity} aria-label={"Return quantity for "+l.name} value={quantities[l.productId]||"0"} onChange={e=>{setQuantities(old=>({...old,[l.productId]:e.target.value}));resetInput()}}/></div>)}</div>
    <p className="anpos-return-help">Refund amount is calculated on the server from the original paid price and discount. Inventory is not restocked by this operation.</p>
   </>}
   <label>Condition after receiving items<select value={disposition} onChange={e=>{setDisposition(e.target.value as "quarantine"|"damaged");resetInput()}}><option value="quarantine">Quarantine — inspection required</option><option value="damaged">Damaged — not sellable</option></select></label>
   <label>Reason for return<textarea minLength={8} maxLength={500} value={reason} onChange={e=>{setReason(e.target.value);resetInput()}} placeholder="Explain customer return and physical condition"/></label>
   <label className="anpos-return-consent"><input type="checkbox" checked={cashConfirmed} onChange={e=>{setCashConfirmed(e.target.checked);resetInput();setCashConfirmed(e.target.checked)}}/><span>I confirm the correct cash refund has been handed to the customer. I understand this creates a permanent audited cash event.</span></label>
   <button type="button" className="anpos-return-submit" disabled={!canRefund||!selected||!valid||!cashConfirmed||reason.trim().length<8||busy} onClick={()=>void submit()}><ShieldCheck size={17}/>{busy?"Processing…":"Record Cash Refund"}</button>
   <p className="anpos-return-help">A manager must have an open cashier shift at the original sale branch with sufficient expected drawer cash. The refund, invoice allocation and drawer adjustment are transactional.</p>
  </section>
  <section className="anpos-return-card"><h2><PackageSearch size={17}/> Return register</h2><div className="anpos-return-list">{returns.map(r=><article key={r.id}><div><strong>{r.invoiceNumber}</strong><small>{new Date(r.createdAt).toLocaleString("en-BD")} · {r.managerName}</small></div><b>{money(r.refundedPaisa)}</b><p>{r.lines.map(l=>l.sku+" × "+l.quantity).join(", ")}</p><small>{r.disposition} · {r.reason}</small></article>)}{!returns.length&&<p>No recorded cash refunds for the selected branch.</p>}</div></section>
  </div>
 </main>;
}
