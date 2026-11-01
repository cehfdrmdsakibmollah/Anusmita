"use client";
import {useEffect,useState} from "react";
const accounts=["cash","bank","accounts_receivable","inventory","accounts_payable","sales_revenue","cogs","shipping_expense","marketing_expense","other_expense","owner_equity","other_income"] as const;
type Line={account:typeof accounts[number];debitPaisa:number;creditPaisa:number};
type Journal={id:string;reference:string;transactionDate:string;note:string;totalPaisa:number;lines:Line[]};
const bdt=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
export default function JournalManager({role}:{role:string}){
 const [items,setItems]=useState<Journal[]>([]),[reference,setReference]=useState(""),[note,setNote]=useState(""),[lines,setLines]=useState<Line[]>([{account:"cash",debitPaisa:0,creditPaisa:0},{account:"sales_revenue",debitPaisa:0,creditPaisa:0}]),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const canPost=["owner","admin","finance"].includes(role);
 async function load(){try{const r=await fetch("/api/admin/journal",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Journal unavailable");setItems(d.entries||[]);}catch(e){setNotice(String(e));}}
 useEffect(()=>{void load();},[]);
 function update(index:number,data:Partial<Line>){setLines(old=>old.map((l,i)=>i===index?{...l,...data}:l));}
 const debit=lines.reduce((n,l)=>n+l.debitPaisa,0),credit=lines.reduce((n,l)=>n+l.creditPaisa,0);
 async function post(e:React.FormEvent){e.preventDefault();if(!canPost||debit!==credit||debit<=0)return;if(!window.confirm("Post journal entry? Verify source documents and amounts."))return;setBusy(true);setNotice("");try{
  const r=await fetch("/api/admin/journal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({entryKey:crypto.randomUUID(),transactionDate:new Date().toISOString(),reference,note,lines})});const d=await r.json();if(!r.ok)throw Error(d.error||"Posting failed");setNotice("Balanced manual journal posted and audited.");setReference("");setNote("");setLines([{account:"cash",debitPaisa:0,creditPaisa:0},{account:"sales_revenue",debitPaisa:0,creditPaisa:0}]);await load();
 }catch(e){setNotice(String(e)+". Verify history before resubmitting; never double-post a transaction.");}finally{setBusy(false);}}
 return <section className="adminCard"><h2>Double-Entry Journal</h2><p className="smallprint">Manual auditable postings. Does not automatically reconcile courier COD, bank statements, taxes, refunds or existing order books. Amounts in whole BDT are converted to integer paisa before submission.</p>{notice&&<p role="status">{notice}</p>}
 {canPost&&<form className="adminForm" onSubmit={e=>void post(e)}><div className="field"><label>Reference<input required minLength={3} maxLength={100} value={reference} onChange={e=>setReference(e.target.value)}/></label></div><div className="field"><label>Supporting note<textarea required minLength={8} maxLength={500} value={note} onChange={e=>setNote(e.target.value)}/></label></div>
 {lines.map((line,i)=><div key={i} style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",padding:8,border:"1px solid #ecdadd"}}>
 <select aria-label={"Account "+(i+1)} value={line.account} onChange={e=>update(i,{account:e.target.value as Line["account"]})}>{accounts.map(a=><option key={a} value={a}>{a.replaceAll("_"," ")}</option>)}</select>
 <label>Debit ৳ <input type="number" min={0} step="0.01" value={line.debitPaisa/100} onChange={e=>update(i,{debitPaisa:Math.round(Number(e.target.value)*100),creditPaisa:0})}/></label>
 <label>Credit ৳ <input type="number" min={0} step="0.01" value={line.creditPaisa/100} onChange={e=>update(i,{creditPaisa:Math.round(Number(e.target.value)*100),debitPaisa:0})}/></label>
 {lines.length>2&&<button type="button" className="button small light" onClick={()=>setLines(x=>x.filter((_,j)=>j!==i))}>Remove</button>}</div>)}
 <button type="button" className="button small light" disabled={lines.length>=20} onClick={()=>setLines(x=>[...x,{account:"cash",debitPaisa:0,creditPaisa:0}])}>Add line</button>
 <p>Debits: {bdt(debit)} · Credits: {bdt(credit)} · {debit===credit&&debit>0?"Balanced":"Not balanced"}</p>
 <button className="button" type="submit" disabled={busy||debit!==credit||debit<=0}>Post balanced journal</button></form>}
 <h3>Recent journal entries</h3><div style={{overflowX:"auto"}}><table><thead><tr><th>Date</th><th>Reference</th><th>Amount</th><th>Lines</th></tr></thead><tbody>{items.map(j=><tr key={j.id}><td>{new Date(j.transactionDate).toLocaleDateString("en-BD")}</td><td>{j.reference}<p className="smallprint">{j.note}</p></td><td>{bdt(j.totalPaisa)}</td><td>{j.lines.map((l,i)=><div key={i}>{l.account}: {l.debitPaisa?"Dr "+bdt(l.debitPaisa):"Cr "+bdt(l.creditPaisa)}</div>)}</td></tr>)}</tbody></table></div></section>;
}
