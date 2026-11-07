"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,Store,Plus,Save,RefreshCw,AlertTriangle,Package,Warehouse,ClipboardList,ShieldCheck} from "lucide-react";
type Branch={id:string;code:string;name:string;address:string;phone:string;managerName:string;active:boolean;stock:number;skus:number};
type Damage={id:string;branchName:string;sku:string;productName:string;quantity:number;unitCostPaisa:number;reason:string;createdAt:string};
type Product={_id:string;sku:string;name:string;onHand:number;reserved:number};
const initial={name:"",code:"",address:"",phone:"",managerName:"",active:true};
export default function PosOperations({canEdit,canManageBranches}:{canEdit:boolean;canManageBranches:boolean}){
 const [tab,setTab]=useState<"branches"|"damage">("branches");
 const [branches,setBranches]=useState<Branch[]>([]),[form,setForm]=useState(initial),[editing,setEditing]=useState<string|null>(null);
 const [damageRows,setDamageRows]=useState<Damage[]>([]),[branchId,setBranchId]=useState(""),[productId,setProductId]=useState("");
 const [search,setSearch]=useState(""),[products,setProducts]=useState<Product[]>([]),[qty,setQty]=useState("1"),[reason,setReason]=useState("");
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState(""),[error,setError]=useState(""),[operationKey,setOperationKey]=useState(()=>crypto.randomUUID());
 async function refresh(){
  setLoading(true);setError("");
  try{
   const [a,b]=await Promise.all([fetch("/api/admin/offline-pos/branches",{cache:"no-store"}),fetch("/api/admin/offline-pos/damage",{cache:"no-store"})]);
   const x=await a.json(),y=await b.json();
   if(!a.ok||!b.ok)throw Error(x.error||y.error||"Unable to load store records");
   setBranches(x.branches||[]);setDamageRows(y.records||[]);
   if(!branchId&&x.branches?.length)setBranchId(x.branches.find((v:Branch)=>v.active)?.id||"");
  }catch(e){setError(e instanceof Error?e.message:"Unable to load records");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 async function findProducts(){
  setError("");try{
   const r=await fetch("/api/admin/products?perPage=10&q="+encodeURIComponent(search),{cache:"no-store"});const j=await r.json();
   if(!r.ok)throw Error(j.error||"Product search failed");
   setProducts(j.products||[]);
  }catch(e){setError(String(e));}
 }
 useEffect(()=>{if(tab!=="damage")return;const timer=setTimeout(()=>{void findProducts();},300);return()=>clearTimeout(timer);},[search,tab]);
 function edit(branch:Branch){
  setEditing(branch.id);
  setForm({name:branch.name,code:branch.code,address:branch.address,phone:branch.phone,managerName:branch.managerName,active:branch.active});
  setNotice("");
 }
 function reset(){setEditing(null);setForm(initial);}
 async function saveBranch(e:React.FormEvent){
  e.preventDefault();if(!canManageBranches||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const payload=editing?{id:editing,name:form.name,address:form.address,phone:form.phone,managerName:form.managerName,active:form.active}:{name:form.name,code:form.code,address:form.address,phone:form.phone,managerName:form.managerName};
   const r=await fetch("/api/admin/offline-pos/branches",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Branch save failed");
   setNotice("Branch saved with authenticated audit log.");reset();await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Branch save failed");}
  finally{setBusy(false);}
 }
 async function recordDamage(e:React.FormEvent){
  e.preventDefault();if(!canEdit||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/offline-pos/damage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operationKey,branchId,productId,quantity:Number(qty),reason})});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Damage registration failed");
   setNotice((j.alreadyApplied?"Previously recorded":"Damage stock deducted and audited")+" · "+j.id);
   setOperationKey(crypto.randomUUID());setReason("");setQty("1");setProductId("");await refresh();
  }catch(e){setError(e instanceof Error?e.message:"Damage recording failed");}
  finally{setBusy(false);}
 }
 const chosen=products.find(x=>x._id===productId);
 return <div className="anposops"><header><div><p>ANUSMITA · PHYSICAL STORE MANAGEMENT</p><h1>Branches & Damage Inventory</h1><span>Manage showroom locations and record physical damage against allocated branch stock.</span></div><Link href="/admin/offline-pos"><ArrowLeft size={17}/> Back to POS</Link></header>
  <nav aria-label="Branch management tabs"><button className={tab==="branches"?"selected":""} onClick={()=>setTab("branches")}><Store size={17}/> Branch Manager</button><button className={tab==="damage"?"selected":""} onClick={()=>setTab("damage")}><AlertTriangle size={17}/> Damage Register</button><button onClick={()=>void refresh()}><RefreshCw size={16}/> Refresh</button><Link href="/admin?tab=Warehouse%20Transfers"><Warehouse size={17}/> Warehouse Transfer</Link></nav>
  {error&&<p className="anposops-error" role="alert">{error}</p>}{notice&&<p className="anposops-success" role="status"><ShieldCheck size={17}/>{notice}</p>}
  {tab==="branches"?<div className="anposops-grid">
   <form className="anposops-card" onSubmit={e=>void saveBranch(e)}><h2><Store size={18}/> {editing?"Edit branch":"Create branch"}</h2>
    <label>Branch name<input required maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Khulna Main Showroom"/></label>
    <label>Branch code<input required disabled={!!editing} pattern="[A-Za-z0-9_-]{2,24}" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="KHULNA-01"/></label>
    <label>Full address<textarea maxLength={250} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
    <label>Contact phone<input maxLength={20} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
    <label>Manager name<input maxLength={100} value={form.managerName} onChange={e=>setForm({...form,managerName:e.target.value})}/></label>
    {editing&&<label className="anposops-check"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Branch active</label>}
    <p>Archiving is blocked when a branch still has allocated inventory. Historical invoices are always preserved.</p>
    <div className="anposops-actions"><button type="submit" disabled={!canManageBranches||busy}><Save size={16}/> {busy?"Saving…":"Save Branch"}</button>{editing&&<button type="button" className="secondary" onClick={reset}>Cancel</button>}</div>
   </form>
   <section className="anposops-card anposops-records"><h2><ClipboardList size={18}/> Registered Locations <span>{branches.length}</span></h2>
    <div className="anposops-table"><table><thead><tr><th>Code</th><th>Branch</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{branches.map(b=><tr key={b.id}><td><strong>{b.code}</strong></td><td>{b.name}<small>{b.address||"No address"} · {b.managerName||"No manager"}</small></td><td>{b.stock} pcs<small>{b.skus} SKUs</small></td><td><span className={b.active?"state active":"state"}>{b.active?"Active":"Inactive"}</span></td><td><button type="button" className="small" onClick={()=>edit(b)} disabled={!canManageBranches}>Edit</button></td></tr>)}</tbody></table></div>{!branches.length&&<p>No branches registered yet. Create a location to activate POS stock allocation.</p>}
   </section>
  </div>:<div className="anposops-grid">
   <form className="anposops-card" onSubmit={e=>void recordDamage(e)}><h2><AlertTriangle size={18}/> Report physical damage</h2>
    <label>Branch<select required value={branchId} onChange={e=>{setBranchId(e.target.value);setOperationKey(crypto.randomUUID())}}><option value="">Select branch</option>{branches.filter(x=>x.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label>Search product by name / SKU<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Product search"/></label>
    <label>Product<select required value={productId} onChange={e=>{setProductId(e.target.value);setOperationKey(crypto.randomUUID())}}><option value="">Select a real product</option>{products.map(p=><option key={p._id} value={p._id}>{p.sku} · {p.name}</option>)}</select></label>
    {chosen&&<p>Global physical: {chosen.onHand}; reserved: {chosen.reserved}. Actual branch balance is checked on submit.</p>}
    <label>Damaged quantity<input required type="number" min="1" max="100000" value={qty} onChange={e=>{setQty(e.target.value);setOperationKey(crypto.randomUUID())}}/></label>
    <label>Reason<textarea required minLength={8} maxLength={300} value={reason} onChange={e=>{setReason(e.target.value);setOperationKey(crypto.randomUUID())}} placeholder="Bottle cracked during shelf display"/></label>
    <p>Submitting subtracts from the selected branch and central unreserved stock in one transaction. It also creates a permanent damage register and audit movement.</p>
    <button type="submit" disabled={!canEdit||!branchId||!productId||busy}><AlertTriangle size={16}/> {busy?"Recording…":"Record Damage & Deduct Stock"}</button>
   </form>
   <section className="anposops-card anposops-records"><h2><Package size={18}/> Recent damage records <span>{damageRows.length}</span></h2>
    <div className="anposops-table"><table><thead><tr><th>Date</th><th>Product</th><th>Branch</th><th>Qty</th><th>Reason</th></tr></thead><tbody>{damageRows.map(d=><tr key={d.id}><td>{new Date(d.createdAt).toLocaleDateString("en-BD")}</td><td><strong>{d.productName}</strong><small>{d.sku}</small></td><td>{d.branchName}</td><td>{d.quantity}</td><td>{d.reason}</td></tr>)}</tbody></table></div>{!damageRows.length&&<p>No branch damage has been registered.</p>}
   </section>
  </div>}
 </div>;
}
