"use client";
import {useEffect,useState} from "react";
type Wallet={customerPhone:string;balancePoints:number;earnedPoints:number;redeemedPoints:number;reversedPoints:number};
type Event={id:string;kind:string;customerPhone:string;reference:string;points:number;note:string;createdAt:string};
type Order={_id:string;orderNumber:string;orderStatus:string;paymentStatus:string;totalPaisa:number};
export default function LoyaltyLedger({role}:{role:string}){
 const [wallets,setWallets]=useState<Wallet[]>([]),[events,setEvents]=useState<Event[]>([]),[orders,setOrders]=useState<Order[]>([]),[kind,setKind]=useState<"earn"|"redeem"|"reverse">("earn"),[orderId,setOrderId]=useState(""),[phone,setPhone]=useState(""),[points,setPoints]=useState(1),[reference,setReference]=useState(""),[note,setNote]=useState(""),[identityChecked,setIdentityChecked]=useState(false),[benefitDelivered,setBenefitDelivered]=useState(false),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const canWrite=["owner","admin"].includes(role);
 async function load(){try{const r=await fetch("/api/admin/loyalty-ledger",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load ledger");setWallets(d.wallets||[]);setEvents(d.events||[]);const o=await fetch("/api/admin/orders",{cache:"no-store"});if(o.ok){const records=await o.json();setOrders(records.orders||[]);}}catch(e){setNotice(String(e));}}
 useEffect(()=>{void load();},[]);
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{
 const body=kind==="earn"?{kind,orderId,eventKey:crypto.randomUUID(),note,identityChecked}:kind==="reverse"?{kind,orderId,eventKey:crypto.randomUUID(),note}:{kind,phone,points,reference,eventKey:crypto.randomUUID(),note,identityChecked,benefitAlreadyDelivered:benefitDelivered};
 if(!window.confirm("Record "+kind+" after verifying customer identity, payment evidence and supporting documents?")){setBusy(false);return;}
 const r=await fetch("/api/admin/loyalty-ledger",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||"Ledger entry refused");
 setNotice("Loyalty entry committed with audit history; this does not change checkout totals.");setNote("");setIdentityChecked(false);setBenefitDelivered(false);await load();
 }catch(e){setNotice(String(e)+". Check history before trying again to avoid duplicate rewards.");}finally{setBusy(false);}}
 return <section className="adminCard"><h2>Customer Loyalty Wallet & Redemption</h2><p className="smallprint">Manual staff-attested program: 1 point per ৳100 of delivered purchases with independently verified full payment. Paid order earnings, benefit redemptions and refunded-order reversals are audited. No customer login, automatic reward checkout or auto-refund reconciliation is claimed.</p>
 {notice&&<p role="status">{notice}</p>}
 {canWrite&&<form className="adminForm" onSubmit={e=>void save(e)}><h3>Record loyalty action</h3><div className="field"><label>Action<select value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="earn">Award verified paid-order points</option><option value="redeem">Record manually fulfilled point redemption</option><option value="reverse">Reverse refunded/returned order points</option></select></label></div>
 {kind!=="redeem"?<div className="field"><label>Order ID<input required pattern="[a-fA-F0-9]{24}" value={orderId} onChange={e=>setOrderId(e.target.value)}/></label><p className="smallprint">Choose a recent returned/paid order below or enter the MongoDB order ID.</p><select value={orders.some(o=>o._id===orderId)?orderId:""} onChange={e=>setOrderId(e.target.value)}><option value="">Choose recent order</option>{orders.map(o=><option key={o._id} value={o._id}>{o.orderNumber} · {o.orderStatus} · {o.paymentStatus}</option>)}</select></div>:<>
 <div className="field"><label>Customer mobile number<input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)}/></label></div>
 <div className="field"><label>Points to redeem<input type="number" min={1} max={100000} required value={points} onChange={e=>setPoints(Number(e.target.value))}/></label></div>
 <div className="field"><label>Unique fulfillment reference<input minLength={6} maxLength={100} required value={reference} onChange={e=>setReference(e.target.value)}/></label></div>
 <label><input type="checkbox" required checked={benefitDelivered} onChange={e=>setBenefitDelivered(e.target.checked)}/> Benefit has already been delivered to this customer</label></>}
 <div className="field"><label>Evidence / reason<textarea required minLength={12} maxLength={500} value={note} onChange={e=>setNote(e.target.value)}/></label></div>
 {kind!=="reverse"&&<label><input type="checkbox" required checked={identityChecked} onChange={e=>setIdentityChecked(e.target.checked)}/> I verified customer identity via our approved offline process</label>}
 <button type="submit" className="button" disabled={busy}>Record audited {kind}</button></form>}
 <h3>Wallet balances</h3><div style={{overflowX:"auto"}}><table><thead><tr><th>Customer</th><th>Available</th><th>Earned</th><th>Redeemed</th><th>Reversed</th></tr></thead><tbody>{wallets.map(w=><tr key={w.customerPhone}><td>{w.customerPhone}</td><td>{w.balancePoints}</td><td>{w.earnedPoints}</td><td>{w.redeemedPoints}</td><td>{w.reversedPoints}</td></tr>)}</tbody></table></div>
 <h3>Recent loyalty audit entries</h3><div style={{overflowX:"auto"}}><table><thead><tr><th>Date</th><th>Action</th><th>Reference</th><th>Customer</th><th>Points</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{new Date(e.createdAt).toLocaleString("en-BD")}</td><td>{e.kind}</td><td>{e.reference}</td><td>{e.customerPhone}</td><td>{e.points}</td></tr>)}</tbody></table></div>
 </section>;
}
