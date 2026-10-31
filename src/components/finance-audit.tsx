"use client";
import {useEffect,useState} from "react";
type Summary={
 orderedPaisa:number;confirmedPaisa:number;deliveredSalesPaisa:number;recordedCollectionsPaisa:number;
 outstandingPaisa:number;supplierPayablePaisa:number;supplierPaidPaisa:number;cogsPaisa:number;
 recordedExpensePaisa:number;estimatedGrossProfitPaisa:number;estimatedOperatingProfitPaisa:number;
 unreconciled:boolean;placedOrders:number;deliveredOrders:number;lowStockSkus:number;
 reservedUnits:number;inventoryCostPaisa:number;
};
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
export default function FinanceAudit(){
 const [data,setData]=useState<Summary|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 async function refresh(){
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/overview",{cache:"no-store"});
   if(!response.ok)throw new Error(response.status===403?"Finance access is required.":"Financial records could not be loaded.");
   setData(await response.json());
  }catch(e){setError(e instanceof Error?e.message:"Unable to load financial records.");setData(null);}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 const rows:dataRow[]=data?[
  ["Valid order value",data.orderedPaisa,"Orders excluding cancelled / returned"],
  ["Delivered order value",data.deliveredSalesPaisa,"Delivered order totals; not proof of payment"],
  ["Verified collections recorded",data.recordedCollectionsPaisa,"Recorded verified collection payments"],
  ["Outstanding balances",data.outstandingPaisa,"Calculated across non-cancelled and non-returned orders"],
  ["Delivered goods cost",data.cogsPaisa,"Recorded line-item unit costs"],
  ["Recorded expenses",data.recordedExpensePaisa,"Expense records currently entered"],
  ["Estimated operating profit",data.estimatedOperatingProfitPaisa,"Not reconciled net profit"],
  ["Supplier commitments remaining",data.supplierPayablePaisa,"Purchase commitments; may not be invoiced"]
 ]:[];
 return <section className="adminCard" aria-label="Financial audit">
  <div style={{display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
   <div><h2>Finance Audit & Reconciliation</h2><p className="smallprint">Read-only, based on existing production records. No payment, order, stock or ledger entry is changed.</p></div>
   <button type="button" className="button small light" onClick={()=>void refresh()} disabled={loading}>Refresh records</button>
  </div>
  {loading&&<p role="status">Loading actual recorded figures…</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  {data&&<><p className="notice"><strong>UNRECONCILED:</strong> Estimated profit is not cash profit. Missing courier remittances, gateway fees, refunds, applicable tax or unrecorded expenses may change the result. Do not use this view as an audited financial statement.</p>
  <div className="kpiGrid">{rows.map(([label,value,note])=><div className="kpi" key={label}><div className="muted">{label}</div><div className="number">{money(value)}</div><p className="smallprint">{note}</p></div>)}</div>
  <h3>Operational checks</h3>
  <ul>
   <li>{data.deliveredOrders} delivered order(s), {data.placedOrders} non-cancelled / non-returned order(s)</li>
   <li>{data.lowStockSkus} SKU(s) at or below reorder level; {data.reservedUnits} unit(s) reserved</li>
   <li>Match every courier COD payout to merchant/bank receipts before recording funds.</li>
   <li>Verify purchase invoices and supplier transfers independently before closing payables.</li>
   <li>Review returns, tax, packaging, gateway and courier charges before interpreting net profit.</li>
  </ul>
  <p className="smallprint">Live courier, payment gateway and bank reconciliation require approved provider credentials and verified webhooks. They are not enabled by this report.</p>
  </>}
 </section>;
}
type dataRow=[label:string,value:number,note:string];
