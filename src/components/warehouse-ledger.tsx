"use client";
import {useEffect,useState} from "react";
type Location={id:string;code:string;name:string;active:boolean};
type Product={_id:string;sku:string;name:string;onHand:number;reserved:number};
type Balance={id:string;sku:string;name:string;location:string;quantity:number};
type Event={id:string;kind:string;quantity:number;createdAt:string};
export default function WarehouseLedger({role}:{role:string}){
 const [locations,setLocations]=useState<Location[]>([]),[products,setProducts]=useState<Product[]>([]),[balances,setBalances]=useState<Balance[]>([]),[events,setEvents]=useState<Event[]>([]);
 const [productId,setProductId]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState(""),[quantity,setQuantity]=useState(1),[kind,setKind]=useState<"allocate"|"transfer">("allocate"),[note,setNote]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const canWrite=["owner","admin","inventory"].includes(role);
 async function load(){
  try{
   const [a,b,c]=await Promise.all([fetch("/api/admin/warehouse-locations",{cache:"no-store"}),fetch("/api/admin/products?page=1",{cache:"no-store"}),fetch("/api/admin/warehouse-ledger",{cache:"no-store"})]);
   if(!a.ok||!b.ok||!c.ok)throw new Error("Unable to load warehouse records");
   const [la,pr,le]=await Promise.all([a.json(),b.json(),c.json()]);
   setLocations(la.locations||[]);setProducts(pr.products||[]);setBalances(le.balances||[]);setEvents(le.events||[]);
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Unable to load"));}
 }
 useEffect(()=>{void load();},[]);
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!window.confirm(kind==="allocate"?"Confirm these units physically exist and are currently at the selected location?":"Confirm physical stock transfer between these locations?"))return;
  setBusy(true);setNotice("");
  const operationKey=crypto.randomUUID();
  try{
   const res=await fetch("/api/admin/warehouse-ledger",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operationKey,kind,productId,toLocationId:to,...(kind==="transfer"?{fromLocationId:from}:{}),quantity,note})});
   const body=await res.json();if(!res.ok)throw new Error(body.error||"Operation rejected");
   setNotice("Recorded warehouse "+kind+". No global on-hand quantity added.");setNote("");await load();
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Operation failed")+". If response was lost, check history before retrying.");}
  finally{setBusy(false);}
 }
 return <section className="adminCard"><h2>Warehouse Allocation & Transfer Ledger</h2>
  <p className="smallprint">Location allocations are backed by existing available on-hand inventory. They never increase global stock. All transfers are database-transactional and audited. Existing inventory adjustments outside this ledger may require reconciliation.</p>
  {notice&&<p role="status">{notice}</p>}
  {canWrite&&<form onSubmit={e=>void save(e)} className="adminForm">
   <div className="field"><label>Movement</label><select value={kind} onChange={e=>setKind(e.target.value as "allocate"|"transfer")}><option value="allocate">Allocate existing physical stock to a location</option><option value="transfer">Transfer between recorded locations</option></select></div>
   <div className="field"><label>Product (first 30 shown)</label><select required value={productId} onChange={e=>setProductId(e.target.value)}><option value="">Select SKU</option>{products.map(p=><option key={p._id} value={p._id}>{p.sku} — {p.name} ({Math.max(0,p.onHand-p.reserved)} globally available)</option>)}</select></div>
   {kind==="transfer"&&<div className="field"><label>From location</label><select required value={from} onChange={e=>setFrom(e.target.value)}><option value="">Select source</option>{locations.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></div>}
   <div className="field"><label>Destination location</label><select required value={to} onChange={e=>setTo(e.target.value)}><option value="">Select destination</option>{locations.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select></div>
   <div className="field"><label>Units</label><input type="number" min={1} max={100000} step="1" required value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></div>
   <div className="field"><label>Physical count or transfer confirmation note (8+ chars)</label><textarea required minLength={8} maxLength={300} value={note} onChange={e=>setNote(e.target.value)}/></div>
   <button className="button" type="submit" disabled={busy}>Record audited {kind}</button>
  </form>}
  <h3>Recorded location balances (first 100)</h3>
  {balances.length?<div style={{overflowX:"auto"}}><table><thead><tr><th>SKU</th><th>Location</th><th>Units</th></tr></thead><tbody>{balances.map(b=><tr key={b.id}><td>{b.sku} · {b.name}</td><td>{b.location}</td><td>{b.quantity}</td></tr>)}</tbody></table></div>:<p className="smallprint">No location balances recorded.</p>}
  <h3>Recent allocation & transfer events</h3>{events.length?<ul>{events.map(e=><li key={e.id}>{e.kind} · {e.quantity} units · {new Date(e.createdAt).toLocaleString("en-BD")}</li>)}</ul>:<p className="smallprint">No warehouse events recorded.</p>}
 </section>;
}
