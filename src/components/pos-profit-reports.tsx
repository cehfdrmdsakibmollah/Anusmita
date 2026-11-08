"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,RefreshCw,Wallet,Receipt,TrendingUp,AlertTriangle,Users,Printer,ShieldCheck} from "lucide-react";
type Row={cashierId:string;name:string;salesPaisa:number;orders:number;items:number;commissionPaisa:number;unratedSales:number};
type Data={from:string;to:string;scope:string;branches:{id:string;name:string;code:string}[];salesPaisa:number;refundsPaisa:number;netRevenuePaisa:number;costOfGoodsPaisa:number|null;restockedCostPaisa:number|null;damageCostPaisa:number|null;grossContributionPaisa:number|null;marginPercent:number|null;costComplete:boolean;missingCostInvoices:number;invoiceCount:number;refundCount:number;commission:{accruedPaisa:number;unknownInvoices:number;payoutsSupported:boolean};cashier:Row[];shifts:{total:number;closed:number;totalAbsoluteVariancePaisa:number}};
const money=(v:number|null|undefined)=>v==null?"Unavailable":"৳ "+(v/100).toLocaleString("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>{const p=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Dhaka",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const get=(k:string)=>p.find(x=>x.type===k)?.value||"";return get("year")+"-"+get("month")+"-"+get("day")};
export default function PosReports(){
 const [from,setFrom]=useState(today),[to,setTo]=useState(today),[branch,setBranch]=useState("");
 const [data,setData]=useState<Data|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function load(){
  setBusy(true);setError("");
  try{
   const params=new URLSearchParams({from,to});if(branch)params.set("branchId",branch);
   const r=await fetch("/api/admin/offline-pos/reports?"+params.toString(),{cache:"no-store"});const j=await r.json();
   if(!r.ok)throw Error(j.error||"Unable to load POS financial reports");
   setData(j);
  }catch(e){setError(e instanceof Error?e.message:"Report unavailable");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load();},[]);
 return <main className="anpos-reports"><header><div><span>ANUSMITA · POS FINANCIAL CONTROL</span><h1>POS Performance & Contribution</h1><p>Actual branch cash sales, refunds, product-cost snapshots and cashier performance.</p></div><div className="anpos-report-headlinks"><Link href="/admin/offline-pos/controls"><ShieldCheck size={16}/> Commission & Exceptions</Link><Link href="/admin/offline-pos"><ArrowLeft size={17}/> Back to POS</Link></div></header>
  <div className="anpos-report-filters"><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><label>Store<select value={branch} onChange={e=>setBranch(e.target.value)}><option value="">All branches</option>{data?.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><button disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/> {busy?"Loading…":"Generate Report"}</button><button className="light" disabled={!data} onClick={()=>window.print()}><Printer size={15}/> Print Report</button></div>
  {error&&<p className="anpos-report-error" role="alert"><AlertTriangle size={16}/>{error}</p>}
  {data&&<><div className="anpos-report-cards">
   <section><Wallet/><small>Gross Cash Sales</small><strong>{money(data.salesPaisa)}</strong><span>{data.invoiceCount} confirmed invoices</span></section>
   <section><Receipt/><small>Cash Refunds</small><strong>{money(data.refundsPaisa)}</strong><span>{data.refundCount} refund events</span></section>
   <section><TrendingUp/><small>Net Cash Revenue</small><strong>{money(data.netRevenuePaisa)}</strong><span>Sales minus cash refunds</span></section>
   <section><ShieldCheck/><small>Gross Contribution Estimate</small><strong>{money(data.grossContributionPaisa)}</strong><span>{data.marginPercent==null?"Cost data incomplete":data.marginPercent+"% contribution margin"}</span></section>
  </div>
  {!data.costComplete&&<div className="anpos-report-warning" role="status"><AlertTriangle size={20}/> Historic invoices without immutable cost snapshots cannot be valued reliably. {data.missingCostInvoices} sales have missing costs; gross contribution is intentionally unavailable.</div>}
  <div className="anpos-report-warning"><ShieldCheck size={18}/> Policy-based commission accrual: {money(data.commission.accruedPaisa)}. Unrated historical invoices: {data.commission.unknownInvoices}. No payouts have been issued.</div>
  <div className="anpos-report-layout"><section className="anpos-report-panel"><h2>Inventory Cost & Drawer Control</h2><div className="anpos-report-line"><span>Sale-time product COGS</span><strong>{money(data.costOfGoodsPaisa)}</strong></div><div className="anpos-report-line"><span>Approved restock cost reversal</span><strong>{money(data.restockedCostPaisa)}</strong></div><div className="anpos-report-line"><span>Damaged stock cost</span><strong>{money(data.damageCostPaisa)}</strong></div><div className="anpos-report-line"><span>Cashier shifts / closed</span><strong>{data.shifts.total} / {data.shifts.closed}</strong></div><div className="anpos-report-line"><span>Sum of absolute cash variances</span><strong>{money(data.shifts.totalAbsoluteVariancePaisa)}</strong></div><p>These figures exclude operating expenses, taxes, historical unknown costs, loyalty liability and web orders. They are not a full net-profit statement.</p></section>
   <section className="anpos-report-panel"><h2><Users size={18}/> Cashier Performance</h2><div className="anpos-report-table"><table><thead><tr><th>Cashier</th><th>Orders</th><th>Items</th><th>Cash Sales</th><th>Commission (estimated)</th></tr></thead><tbody>{data.cashier.map(r=><tr key={r.cashierId}><td>{r.name}</td><td>{r.orders}</td><td>{r.items}</td><td>{money(r.salesPaisa)}</td><td>{money(r.commissionPaisa)}{r.unratedSales>0?" · "+r.unratedSales+" unrated sales":""}</td></tr>)}</tbody></table>{!data.cashier.length&&<p>No recorded POS sales in this selected period.</p>}</div><p>Commission is calculated only from approved policy snapshots on recorded sales, adjusted for invoice refunds. It is an accrual estimate, not approved payroll or a cash payout. Historical sales without rates remain unrated.</p></section></div>
  <p className="anpos-report-foot">Report period {data.from} to {data.to}. Scope: {data.scope}. Financial metrics are calculated from persisted transactions, not sample products or demo counters.</p></>}
 </main>;
}
