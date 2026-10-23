
"use client";
import {useEffect,useState,useRef} from "react";
type Supplier={_id:string;name:string;country:string};
type SearchProduct={_id:string;sku:string;name:string;costPaisa:number;onHand:number;reserved:number};
type DraftItem={product:SearchProduct;quantity:number;unitCostPaisa:number};
type PurchaseLine={productId:{_id:string;sku:string;name:string}|string;sku:string;name:string;quantity:number;received:number;unitCostPaisa:number};
type Purchase={_id:string;status:string;supplierId:Supplier|string;items:PurchaseLine[];
 invoiceTotalPaisa:number;paidPaisa:number;note:string;createdAt:string;updatedAt:string};
const money=(p:number)=>"৳"+(p/100).toLocaleString("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2});
async function readJson(res:Response){
 const data=await res.json().catch(()=>({error:"Unable to read server response"}));
 if(!res.ok)throw new Error(typeof data.error==="string"?data.error:"Request rejected");
 return data;
}
function lineId(row:PurchaseLine){return typeof row.productId==="string"?row.productId:row.productId?._id;}
export default function PurchaseManager({role}:{role:string}){
 const canCreate=["owner","admin","purchasing"].includes(role);
 const canReceive=["owner","admin","purchasing","inventory"].includes(role);
 const [suppliers,setSuppliers]=useState<Supplier[]>([]),[supplier,setSupplier]=useState("");
 const [lookup,setLookup]=useState(""),[found,setFound]=useState<SearchProduct[]>([]);
 const [lines,setLines]=useState<DraftItem[]>([]),[note,setNote]=useState("");
 const [purchases,setPurchases]=useState<Purchase[]>([]),[page,setPage]=useState(1),[pages,setPages]=useState(1);
 const [selected,setSelected]=useState<Purchase|null>(null),[receiptQty,setReceiptQty]=useState<Record<string,number>>({});
 const [receiptNote,setReceiptNote]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const receiptKey=useRef<string|null>(null);
 const refresh=async(nextPage=page)=>{
  const r=await fetch("/api/admin/purchases?page="+nextPage,{cache:"no-store"});
  const data=await readJson(r);
  setPurchases(data.purchases||[]);setPages(data.pages||1);setPage(nextPage);
  if(selected){
   const now=(data.purchases||[]).find((x:Purchase)=>x._id===selected._id);
   if(now)setSelected(now);
  }
 };
 useEffect(()=>{void refresh(1).catch(e=>setNotice("Unable to load purchases: "+String(e)));},[]);
 useEffect(()=>{
  if(!canCreate)return;
  fetch("/api/admin/suppliers",{cache:"no-store"}).then(readJson).then(data=>{
   setSuppliers(data.suppliers||[]);if(data.suppliers?.length)setSupplier(data.suppliers[0]._id);
  }).catch(()=>{});
 },[canCreate]);
 useEffect(()=>{
  if(!lookup.trim()){setFound([]);return;}
  const controller=new AbortController();
  const timer=setTimeout(()=>{fetch("/api/admin/products?q="+encodeURIComponent(lookup),{signal:controller.signal,cache:"no-store"})
   .then(readJson).then(data=>{if(!controller.signal.aborted)setFound(data.products||[]);}).catch(()=>{});},250);
  return()=>{controller.abort();clearTimeout(timer);};
 },[lookup]);
 function chooseProduct(p:SearchProduct){
  setLines(old=>old.some(x=>x.product._id===p._id)?old:old.length>=30?old:[...old,{product:p,quantity:1,unitCostPaisa:p.costPaisa}]);
  setLookup("");setFound([]);
 }
 function changeLine(id:string,key:"quantity"|"unitCostPaisa",value:number){
  setLines(old=>old.map(x=>x.product._id===id?{...x,[key]:value}:x));
 }
 async function create(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setNotice("");
  try{
   const data=await readJson(await fetch("/api/admin/purchases",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({supplierId:supplier,note,items:lines.map(x=>({productId:x.product._id,quantity:x.quantity,unitCostPaisa:x.unitCostPaisa}))})}));
   setNotice("Purchase draft created. Reference: "+data.id);
   setLines([]);setNote("");await refresh(1);
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Unable to create purchase"));}
  finally{setBusy(false);}
 }
 async function transition(p:Purchase,action:"submit"|"cancel"){
  if(!window.confirm((action==="submit"?"Submit":"Cancel")+" purchase "+p._id+"?"))return;
  setBusy(true);setNotice("");
  try{
   await readJson(await fetch("/api/admin/purchases/"+p._id,{method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,expectedUpdatedAt:p.updatedAt})}));
   setNotice("Purchase "+action+" successful");await refresh();
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Unable to change purchase"));}
  finally{setBusy(false);}
 }
 async function receive(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!selected)return;
  const items=selected.items.map(x=>({productId:lineId(x),quantity:receiptQty[lineId(x)]||0})).filter(x=>x.quantity>0);
  if(!items.length){setNotice("Choose at least one received quantity.");return;}
  if(!window.confirm("Confirm physical receipt of "+items.reduce((a,b)=>a+b.quantity,0)+" units for this PO? This will increase real stock."))return;
  setBusy(true);setNotice("");
  try{
   if(!receiptKey.current)receiptKey.current=crypto.randomUUID();
   const data=await readJson(await fetch("/api/admin/purchases/"+selected._id+"/receipts",
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receiptKey:receiptKey.current,lines:items,note:receiptNote})}));
   setNotice((data.alreadyApplied?"Previously saved receipt confirmed. ":"Goods received. ")+
    data.receivedUnits+" units; purchase state: "+data.status);
   receiptKey.current=null;setReceiptQty({});setReceiptNote("");await refresh();
  }catch(err){setNotice("Error: "+(err instanceof Error?err.message:"Receipt failed")+
   ". For a network failure, retry the identical receipt before changing amounts.");}
  finally{setBusy(false);}
 }
 function pick(p:Purchase){
  setSelected(p);setReceiptQty({});setReceiptNote("");receiptKey.current=null;setNotice("");
 }
 const chosen=purchases.find(p=>p._id===selected?._id)||selected;
 return <section className="adminCard">
  <h2>Purchase orders & stock receiving</h2>
  <p className="smallprint">Keep purchasing records separate from customer orders. Draft → Submitted → Partially received → Received. Stock is added only when physical goods receipt is confirmed; no supplier payment is recorded automatically.</p>
  {notice&&<p role="status" className={notice.startsWith("Error")?"error":"notice"}>{notice}</p>}
  {canCreate&&<form className="adminForm" onSubmit={e=>void create(e)}>
   <h3>Create supplier purchase draft</h3>
   <div className="field"><label htmlFor="purchase-supplier">Supplier</label>
    <select id="purchase-supplier" required value={supplier} onChange={e=>setSupplier(e.target.value)}><option value="">Select an active supplier</option>{suppliers.map(s=><option value={s._id} key={s._id}>{s.name}{s.country?" · "+s.country:""}</option>)}</select></div>
   <div className="field"><label htmlFor="purchase-lookup">Search product SKU/name</label>
    <input id="purchase-lookup" value={lookup} onChange={e=>setLookup(e.target.value)} placeholder="Search existing product"/></div>
   {lookup&&<div className="filters">{found.slice(0,12).map(p=><button type="button" className="button small light" key={p._id} onClick={()=>chooseProduct(p)}>{p.sku} · {p.name}</button>)}</div>}
   <div style={{overflowX:"auto"}}><table><thead><tr><th>Product</th><th>Order qty</th><th>Unit cost (৳)</th><th>Line total</th><th></th></tr></thead><tbody>
    {lines.map(l=><tr key={l.product._id}><td>{l.product.sku}<br/>{l.product.name}</td>
     <td><input aria-label={"Purchase quantity for "+l.product.sku} type="number" min={1} max={100000} value={l.quantity} required
      onChange={e=>changeLine(l.product._id,"quantity",Number(e.target.value))} style={{width:95}}/></td>
     <td><input aria-label={"Purchase unit cost for "+l.product.sku} type="number" min={0} max={10000000} step="0.01" required
      value={(l.unitCostPaisa/100).toFixed(2)} onChange={e=>changeLine(l.product._id,"unitCostPaisa",Math.round(Number(e.target.value)*100))} style={{width:110}}/></td>
     <td>{money(l.quantity*l.unitCostPaisa)}</td>
     <td><button className="button small light" type="button" onClick={()=>setLines(old=>old.filter(x=>x.product._id!==l.product._id))}>Remove</button></td>
    </tr>)}</tbody></table></div>
   <p><strong>Planned cost:</strong> {money(lines.reduce((n,l)=>n+l.quantity*l.unitCostPaisa,0))} — not a verified supplier invoice.</p>
   <div className="field"><label htmlFor="purchase-note">Purchase note</label><textarea id="purchase-note" maxLength={600} value={note} onChange={e=>setNote(e.target.value)} rows={2}/></div>
   <button className="button" disabled={busy||!supplier||lines.length===0} type="submit">Save purchase draft</button>
  </form>}
  <h3 style={{marginTop:25}}>Purchase queue</h3>
  <div style={{overflowX:"auto"}}><table><thead><tr><th>Created</th><th>Supplier</th><th>Planned cost</th><th>Received</th><th>Status</th><th>Actions</th></tr></thead><tbody>
   {purchases.map(po=><tr key={po._id}>
    <td>{new Date(po.createdAt).toLocaleDateString("en-BD")}<br/><small>{po._id.slice(-8)}</small></td>
    <td>{typeof po.supplierId==="string"?po.supplierId:po.supplierId?.name}</td><td>{money(po.invoiceTotalPaisa)}</td>
    <td>{po.items.reduce((n,x)=>n+x.received,0)} / {po.items.reduce((n,x)=>n+x.quantity,0)}</td>
    <td>{po.status}</td><td><button className="button small light" type="button" onClick={()=>pick(po)}>View / receive</button>
    {canCreate&&po.status==="draft"&&<button type="button" className="button small light" disabled={busy} onClick={()=>void transition(po,"submit")}>Submit</button>}
    {canCreate&&["draft","submitted"].includes(po.status)&&po.items.every(x=>x.received===0)&&
     <button type="button" className="button small light" disabled={busy} onClick={()=>void transition(po,"cancel")}>Cancel</button>}</td>
   </tr>)}</tbody></table></div>
  <div className="filters" style={{marginTop:15}}>
   <button type="button" className="button small light" disabled={page<=1} onClick={()=>void refresh(page-1)}>Previous</button>
   <span className="muted">Page {page} of {pages}</span>
   <button type="button" className="button small light" disabled={page>=pages} onClick={()=>void refresh(page+1)}>Next</button>
   <button type="button" className="button small light" onClick={()=>void refresh(1)}>Refresh</button>
  </div>
  {chosen&&<div className="adminCard" style={{marginTop:24}}>
   <h3>Purchase {chosen._id.slice(-10)} · {chosen.status}</h3>
   <div style={{overflowX:"auto"}}><table><thead><tr><th>SKU</th><th>Ordered</th><th>Already received</th><th>Outstanding</th><th>Receive now</th></tr></thead><tbody>
    {chosen.items.map(row=>{const remaining=row.quantity-row.received,id=lineId(row);
     return <tr key={id}><td>{row.sku} · {row.name}</td><td>{row.quantity}</td><td>{row.received}</td><td>{remaining}</td>
      <td><input aria-label={"Receive "+row.sku} type="number" min="0" max={remaining} step="1" value={receiptQty[id]||0}
       disabled={!canReceive||!["submitted","partially_received"].includes(chosen.status)}
       onChange={e=>{setReceiptQty(old=>({...old,[id]:Number(e.target.value)}));receiptKey.current=null;}} style={{width:100}}/></td></tr>;
    })}</tbody></table></div>
   {canReceive&&["submitted","partially_received"].includes(chosen.status)&&<form onSubmit={e=>void receive(e)}>
    <div className="field"><label htmlFor="goods-note">Goods receipt note (5+ characters)</label>
     <textarea id="goods-note" minLength={5} maxLength={500} required value={receiptNote}
      onChange={e=>{setReceiptNote(e.target.value);receiptKey.current=null;}} placeholder="Supplier delivery note / condition / receiving location"/></div>
    <button className="button" disabled={busy} type="submit">Confirm physical goods received</button>
    <p className="smallprint">Changes stock and audit logs in one database transaction. Retrying with the same receipt key does not double-count inventory.</p>
   </form>}
  </div>}
 </section>;
}
