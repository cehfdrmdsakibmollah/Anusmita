"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,RefreshCw,ShieldCheck,AlertTriangle,Receipt,Users,SlidersHorizontal} from "lucide-react";
type Branch={id:string;name:string;code:string};
type Staff={id:string;name:string;role:string};
type Policy={id:string;branchId:string;cashierId:string;rateBps:number;active:boolean;reason:string;updatedAt:string};
type Finding={code:string;severity:"warning"|"critical";reference:string;detail:string};
type Scan={day:string;truncated:boolean;scanned:{sales:number;refunds:number;shifts:number;damages:number;journals:number};findings:Finding[];summary:{critical:number;warnings:number}};
const isoToday=()=>{const p=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Dhaka",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const val=(k:string)=>p.find(x=>x.type===k)?.value||"";return val("year")+"-"+val("month")+"-"+val("day")};
export default function PosFinanceControls({canManage}:{canManage:boolean}){
 const [branches,setBranches]=useState<Branch[]>([]),[staff,setStaff]=useState<Staff[]>([]),[policies,setPolicies]=useState<Policy[]>([]);
 const [branchId,setBranchId]=useState(""),[cashierId,setCashierId]=useState(""),[rate,setRate]=useState("0"),[active,setActive]=useState(true),[reason,setReason]=useState("");
 const [day,setDay]=useState(isoToday),[scan,setScan]=useState<Scan|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function load(){
  setBusy(true);setError("");
  try{
   const [a,b]=await Promise.all([fetch("/api/admin/offline-pos/commissions",{cache:"no-store"}),fetch("/api/admin/offline-pos/exceptions?day="+encodeURIComponent(day),{cache:"no-store"})]);
   const x=await a.json(),y=await b.json();if(!a.ok||!b.ok)throw Error(x.error||y.error||"Finance controls unavailable");
   setBranches(x.branches||[]);setStaff(x.staff||[]);setPolicies(x.policies||[]);setScan(y);
   if(!branchId&&x.branches.length)setBranchId(x.branches[0].id);
   if(!cashierId&&x.staff.length)setCashierId(x.staff[0].id);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load finance controls");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load();},[]);
 const existing=policies.find(p=>p.branchId===branchId&&p.cashierId===cashierId);
 useEffect(()=>{if(existing){setRate(String(existing.rateBps/100));setActive(existing.active);setReason(existing.reason)}else{setRate("0");setActive(true);setReason("");}},[branchId,cashierId,policies]);
 async function save(){
  if(!canManage||busy||!branchId||!cashierId)return;
  const rateBps=Math.round(Number(rate)*100);
  if(!Number.isFinite(rateBps)||rateBps<0||rateBps>2000||reason.trim().length<8){setError("Choose 0–20% with a reason of at least 8 characters");return;}
  setBusy(true);setError("");setMessage("");
  try{
   const r=await fetch("/api/admin/offline-pos/commissions",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({branchId,cashierId,rateBps,active,reason:reason.trim()})});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Cannot save commission policy");
   setMessage("Commission policy saved and audited. Only future confirmed sales use this rate.");
   const refreshed=await fetch("/api/admin/offline-pos/commissions",{cache:"no-store"});const p=await refreshed.json();if(refreshed.ok)setPolicies(p.policies||[]);
  }catch(e){setError(e instanceof Error?e.message:"Unable to save commission policy");}finally{setBusy(false);}
 }
 return <main className="anpos-finance"><header><div><span>ANUSMITA · POS FINANCIAL GOVERNANCE</span><h1>Commissions & Reconciliation</h1><p>Set forward-looking staff incentives and review read-only finance exceptions from real transactions.</p></div><Link href="/admin/offline-pos/reports"><ArrowLeft size={16}/> Back to Reports</Link></header>
  {error&&<p role="alert" className="anpos-finance-error"><AlertTriangle size={17}/>{error}</p>}
  {message&&<p role="status" className="anpos-finance-success"><ShieldCheck size={17}/>{message}</p>}
  <div className="anpos-finance-grid"><section className="anpos-finance-card"><h2><SlidersHorizontal size={18}/> Cashier Commission Policies</h2><p>Policy snapshots are applied only when a new sale is confirmed. Refunds reverse the corresponding share. No payroll payouts are issued here.</p>
   <label>Branch<select value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">Choose a branch</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
   <label>Cashier<select value={cashierId} onChange={e=>setCashierId(e.target.value)}><option value="">Choose staff</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name} · {s.role}</option>)}</select></label>
   <label>Commission rate (%)<input type="number" min="0" max="20" step=".01" value={rate} disabled={!canManage} onChange={e=>setRate(e.target.value)}/></label>
   <label>Change reason<textarea maxLength={300} minLength={8} value={reason} disabled={!canManage} onChange={e=>setReason(e.target.value)} placeholder="Describe approval and effective policy"/></label>
   <label className="anpos-finance-toggle"><input type="checkbox" checked={active} disabled={!canManage} onChange={e=>setActive(e.target.checked)}/> Active for future sales</label>
   <button disabled={!canManage||busy} onClick={()=>void save()}><ShieldCheck size={16}/> Save Commission Policy</button>
   <h3>Current policies ({policies.length})</h3><div className="anpos-finance-policylist">{policies.map(p=><div key={p.id}><b>{staff.find(s=>s.id===p.cashierId)?.name||"Cashier"}</b><small>{branches.find(b=>b.id===p.branchId)?.name||"Branch"} · {p.active?"Active":"Inactive"}</small><strong>{(p.rateBps/100).toFixed(2)}%</strong></div>)}</div>
  </section><section className="anpos-finance-card"><h2><Receipt size={18}/> Daily Reconciliation Exceptions</h2><p>Read-only audit. No automatic stock, cash, ledger or invoice repair. A 400-record cap on each scanned category is disclosed when reached.</p>
   <div className="anpos-finance-row"><label>Bangladesh business date<input type="date" value={day} onChange={e=>setDay(e.target.value)}/></label><button onClick={()=>void load()} disabled={busy}><RefreshCw size={16}/> {busy?"Scanning…":"Scan Records"}</button></div>
   {scan&&<><div className="anpos-finance-metrics"><div><small>Critical</small><strong>{scan.summary.critical}</strong></div><div><small>Warnings</small><strong>{scan.summary.warnings}</strong></div><div><small>Sales scanned</small><strong>{scan.scanned.sales}</strong></div></div>
   {scan.truncated&&<p className="anpos-finance-error"><AlertTriangle size={16}/> Limit reached; results may be incomplete. Narrow the operation window externally before relying on a clean result.</p>}
   <div className="anpos-finance-findings">{scan.findings.map((f,i)=><article key={f.code+"-"+f.reference+"-"+i}><span className={f.severity}>{f.severity}</span><b>{f.code}</b><small>{f.reference}</small><p>{f.detail}</p></article>)}{!scan.findings.length&&<p>No exceptions detected among the scanned records. This is not an independent accounting audit.</p>}</div></>}
  </section></div>
 </main>;
}