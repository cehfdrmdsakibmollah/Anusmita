
"use client";
import {useEffect,useRef,useState} from "react";
type Purchase={_id:string;status:string;invoiceTotalPaisa:number;paidPaisa:number};
type LedgerRow={id:string;method:string;reference:string;amountPaisa:number;note:string;verifiedAt:string;verifiedBy:string};
const bdMoney=(paisa:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(paisa/100);
async function parseResponse(response:Response){
 const body=await response.json().catch(()=>({error:"Payment response was not valid JSON"}));
 if(!response.ok)throw new Error(typeof body.error==="string"?body.error:"Payment request failed");
 return body;
}
export default function SupplierPaymentPanel({purchase,role,onRecorded}:{
 purchase:Purchase;role:string;onRecorded:()=>Promise<void>|void
}){
 const canPay=["owner","admin","finance"].includes(role);
 const [rows,setRows]=useState<LedgerRow[]>([]),[method,setMethod]=useState("bank_transfer"),
  [reference,setReference]=useState(""),[amount,setAmount]=useState(""),
  [note,setNote]=useState(""),[confirmed,setConfirmed]=useState(false),
  [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const paymentKey=useRef<string|null>(null);
 const balance=Math.max(0,purchase.invoiceTotalPaisa-purchase.paidPaisa);
 async function load(){
  const response=await fetch("/api/admin/purchases/"+purchase._id+"/payments",{cache:"no-store"});
  const body=await parseResponse(response);setRows(body.payments||[]);
 }
 useEffect(()=>{setRows([]);void load().catch(()=>setMessage("Payment history unavailable"));},[purchase._id]);
 function changed(){
  // The same UUID must be reused if the exact same request was sent and
  // the browser lost the response. Editing the form starts a fresh request.
  paymentKey.current=null;setConfirmed(false);
 }
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!canPay||!confirmed||busy)return;
  const paisa=Math.round(Number(amount)*100);
  if(!Number.isSafeInteger(paisa)||paisa<=0||paisa>balance){
   setMessage("Error: Amount must be positive and no more than the outstanding planned balance.");return;
  }
  if(!window.confirm("Did you independently verify that this supplier payment was actually sent, using the bank/wallet statement or cash voucher? Record "+bdMoney(paisa)+"?"))return;
  setBusy(true);setMessage("");
  try{
   if(!paymentKey.current)paymentKey.current=crypto.randomUUID();
   const result=await parseResponse(await fetch("/api/admin/purchases/"+purchase._id+"/payments",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({paymentKey:paymentKey.current,method,reference:reference.trim(),amountPaisa:paisa,
     note:note.trim(),verificationConfirmed:true})
   }));
   paymentKey.current=null;setReference("");setAmount("");setNote("");setConfirmed(false);
   setMessage(result.alreadyRecorded?"This same verified transaction was already recorded. No additional payment added.":
    "Recorded verified supplier payout of "+bdMoney(paisa)+".");
   await onRecorded();
   await load();
  }catch(error){
   setMessage("Error: "+(error instanceof Error?error.message:"Payment not recorded")+
    ". If connection failed, retry the identical details; do not generate a different transfer reference.");
  }finally{setBusy(false);}
 }
 return <div className="adminCard">
  <h3>Supplier payments and reconciliation</h3>
  <p className="smallprint">Only enter a payment that finance staff independently verified in the actual bank/wallet account or signed cash receipt. A screenshot or promise of payment is not proof. This records money paid manually; the website never transfers funds.</p>
  <div className="kpiGrid">
   <div className="kpi"><div className="muted">Planned purchase amount</div><div className="number">{bdMoney(purchase.invoiceTotalPaisa)}</div></div>
   <div className="kpi"><div className="muted">Supplier funds recorded</div><div className="number">{bdMoney(purchase.paidPaisa)}</div></div>
   <div className="kpi"><div className="muted">Remaining planned balance</div><div className="number">{bdMoney(balance)}</div></div>
  </div>
  {canPay && ["submitted","partially_received","received"].includes(purchase.status) && balance>0 && 
  <form className="adminForm" onSubmit={e=>void submit(e)}>
   <div className="formGrid">
    <div className="field"><label htmlFor="supplier-pay-method">Payment method</label>
     <select id="supplier-pay-method" value={method} onChange={e=>{changed();setMethod(e.target.value);}}>
      <option value="bank_transfer">Bank transfer</option>
      <option value="bkash_manual">bKash manually verified</option>
      <option value="nagad_manual">Nagad manually verified</option>
      <option value="cash">Cash with voucher</option>
      <option value="other">Other verified method</option>
     </select></div>
    <div className="field"><label htmlFor="supplier-pay-ref">Unique transaction reference / voucher *</label>
     <input id="supplier-pay-ref" required minLength={5} maxLength={100} value={reference}
      onChange={e=>{changed();setReference(e.target.value);}} placeholder="Bank transaction ID or cash voucher ID"/></div>
    <div className="field"><label htmlFor="supplier-pay-amount">Amount actually paid (BDT) *</label>
     <input id="supplier-pay-amount" type="number" min={0.01} max={balance/100} step={0.01}
      value={amount} required onChange={e=>{changed();setAmount(e.target.value);}}/></div>
    <div className="field"><label htmlFor="supplier-pay-note">Verification note *</label>
     <textarea id="supplier-pay-note" required minLength={8} maxLength={500}
      value={note} onChange={e=>{changed();setNote(e.target.value);}}
      placeholder="Which statement/voucher you checked, the payment date and purpose"/>
    </div>
   </div>
   <label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} required/>
    I independently confirmed that the supplier actually received this payment.</label>
   <p><button type="submit" disabled={busy||!confirmed}>Record verified supplier payout</button></p>
  </form>}
  {message&&<p role="status" className={message.startsWith("Error")?"error":"notice"}>{message}</p>}
  <h4>Verified supplier payment history</h4>
  <div style={{overflowX:"auto"}}>
   <table><thead><tr><th>Verified at</th><th>Method</th><th>Reference</th><th>Paid</th><th>Verified by</th><th>Note</th></tr></thead>
   <tbody>{rows.map(row=><tr key={row.id}>
     <td>{new Date(row.verifiedAt).toLocaleString("en-BD")}</td><td>{row.method}</td>
     <td>{row.reference}</td><td>{bdMoney(row.amountPaisa)}</td>
     <td>{row.verifiedBy}</td><td>{row.note}</td>
    </tr>)}</tbody></table>
  </div>
  {!rows.length&&<p className="muted">No verified supplier payments recorded for this purchase order.</p>}
 </div>;
}
