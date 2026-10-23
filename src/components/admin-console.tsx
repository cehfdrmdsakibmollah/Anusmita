
"use client";
import {useCallback,useEffect,useState} from "react";
import BulkCatalogImport from "@/components/bulk-catalog-import";
import ProductManager from "@/components/product-manager";
import DriveMediaLibrary from "@/components/drive-media-library";
type Overview={orderedPaisa:number;confirmedPaisa:number;deliveredSalesPaisa:number;recordedCollectionsPaisa:number;outstandingPaisa:number;supplierPayablePaisa:number;cogsPaisa:number;recordedExpensePaisa:number;estimatedGrossProfitPaisa:number;estimatedOperatingProfitPaisa:number;unreconciled:boolean;placedOrders:number;deliveredOrders:number;lowStockSkus:number;reservedUnits:number;inventoryCostPaisa:number};
type Order={_id:string;orderNumber:string;orderStatus:string;paymentStatus:string;collectedPaisa:number;totalPaisa:number;customer:{name:string;phone:string};createdAt:string};
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
const tabs=["Overview","Orders","Products","Inventory","Payments","Suppliers","Bulk Import","Drive Images"];
export default function AdminConsole({role}:{role:string}){
 const [tab,setTab]=useState("Overview"),[overview,setOverview]=useState<Overview|null>(null),[orders,setOrders]=useState<Order[]>([]),[notice,setNotice]=useState(""),[pending,setPending]=useState(false);
 const load=useCallback(async()=>{
  if(["owner","admin","finance","analyst"].includes(role)){
   const response=await fetch("/api/admin/overview",{cache:"no-store"});
   if(response.ok)setOverview(await response.json());
  }
  if(["owner","admin","sales","finance","support","analyst"].includes(role)){
   const response=await fetch("/api/admin/orders",{cache:"no-store"});
   if(response.ok)setOrders((await response.json()).orders);
  }
 },[role]);
 useEffect(()=>{void load();},[load]);
 async function send(url:string,body:unknown,method="POST"){
  setPending(true);setNotice("");
  try{
   const response=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Request rejected");
   setNotice("Saved successfully. Reference: "+(data.orderNumber||data.sku||data.name||data.id||data.paymentId||"updated"));
   await load();
  }catch(e){setNotice("Error: "+(e instanceof Error?e.message:"Request failed"));}finally{setPending(false);}
 }
 async function transition(order:Order,status:string){
  const trackingReference=status==="shipped"?window.prompt("Enter the courier-confirmed tracking reference:")||undefined:undefined;
  if(status==="shipped"&&!trackingReference)return;
  if(!window.confirm("Change "+order.orderNumber+" from "+order.orderStatus+" to "+status+"?"))return;
  await send("/api/admin/orders/"+order._id,{status,trackingReference},"PATCH");
 }
 function field(form:FormData,name:string){return String(form.get(name)||"").trim();}
 const canFinance=["owner","admin","finance"].includes(role),canStock=["owner","admin","inventory"].includes(role),canOrders=["owner","admin","sales"].includes(role);
 const canSuppliers=["owner","admin","purchasing"].includes(role);
 return <>
 <div className="tabbar" role="tablist" aria-label="ERP sections">{tabs.map(t=><button key={t} className={tab===t?"active":""} role="tab" aria-selected={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</div>
 {notice&&<p role="status" className={notice.startsWith("Error")?"error":"success"}>{notice}</p>}
 {tab==="Overview"&&<><p className="muted">Financial totals show actual recorded orders and manually verified payments. Profit is an estimate until reconciliation.</p>
 {overview?<><div className="kpiGrid">
 {([["Ordered value",overview.orderedPaisa],["Confirmed value",overview.confirmedPaisa],["Delivered value",overview.deliveredSalesPaisa],["Funds recorded",overview.recordedCollectionsPaisa],["Outstanding balances",overview.outstandingPaisa],["Supplier payables",overview.supplierPayablePaisa],["Delivered COGS",overview.cogsPaisa],["Recorded expenses",overview.recordedExpensePaisa],["Estimated gross profit",overview.estimatedGrossProfitPaisa],["Estimated operating profit",overview.estimatedOperatingProfitPaisa],["Inventory cost (on hand)",overview.inventoryCostPaisa]] as [string,number][]).map(([label,value])=><div className="kpi" key={label}><div className="muted">{label}</div><div className="number">{money(value)}</div></div>)}
 <div className="kpi"><div className="muted">Low-stock SKUs</div><div className="number">{overview.lowStockSkus}</div></div></div><p className="notice"><strong>Unreconciled estimates.</strong> Costs, tax, refunds, courier COD remittances and all operating expenses must be reconciled before net-profit reporting. Reserved units: {overview.reservedUnits}.</p></>:<p className="notice">Financial dashboard requires owner, administrator, finance or analyst access and a configured database.</p>}</>}
 {tab==="Orders"&&<div className="adminCard"><h2>Order queue</h2><p className="smallprint">Payment status and shipment status are separate. Mark an order shipped only after courier acceptance.</p>
 <table><thead><tr><th>Order</th><th>Customer</th><th>Value</th><th>Order state</th><th>Payment</th><th>Actions</th></tr></thead><tbody>{orders.map(o=><tr key={o._id}><td>{o.orderNumber}<br/><span className="muted">{new Date(o.createdAt).toLocaleDateString("en-BD")}</span></td><td>{o.customer?.name}<br/>{o.customer?.phone}</td><td>{money(o.totalPaisa)}</td><td>{o.orderStatus}</td><td>{o.paymentStatus}<br/><span className="muted">{money(o.collectedPaisa)} collected</span></td><td>{canOrders&&({placed:["confirmed","cancelled"],confirmed:["packed","cancelled"],packed:["shipped","cancelled"],shipped:["delivered"]} as Record<string,string[]>)[o.orderStatus]?.map(s=><button key={s} className="button small light" disabled={pending} style={{margin:"2px"}} onClick={()=>transition(o,s)}>{s}</button>)}<a style={{display:"block",marginTop:6}} href={"/admin/invoices/"+o._id}>Invoice</a></td></tr>)}</tbody></table>
 {orders.length===0&&<p className="notice">No accessible orders yet.</p>}</div>}
 {tab==="Products"&&<div className="adminCard"><h2>Add a product / variant</h2><p className="smallprint">Every size or colour should use its own unique SKU. New products are drafts by default unless you explicitly publish them.</p>
 {canStock?<form className="adminForm" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send("/api/admin/products",{
 name:field(f,"name"),slug:field(f,"slug"),sku:field(f,"sku"),brand:field(f,"brand"),category:field(f,"category"),
 origin:field(f,"origin"),size:field(f,"size"),description:field(f,"description"),imageUrls:field(f,"imageUrl")?[field(f,"imageUrl")]:[],
 pricePaisa:Math.round(Number(field(f,"price"))*100),costPaisa:Math.round(Number(field(f,"cost"))*100),
 onHand:Number(field(f,"stock")),reorderLevel:5,active:f.get("active")==="on"
 });}}>
 <div className="formGrid">{[["name","Product name"],["slug","URL slug"],["sku","Unique SKU"],["brand","Brand"],["category","Category"],["size","Size / variant"],["price","Selling price (BDT)"],["cost","Unit cost (BDT)"],["stock","Opening stock"],["imageUrl","Public HTTPS image URL"]].map(([key,label])=><div className="field" key={key}><label htmlFor={"p-"+key}>{label}</label><input id={"p-"+key} name={key} required={["name","slug","sku","category","price","cost","stock"].includes(key)} type={["price","cost","stock"].includes(key)?"number":"text"} min={["price","cost","stock"].includes(key)?"0":undefined} step={key==="stock"?"1":key==="price"||key==="cost"?"0.01":undefined}/></div>)}
 <div className="field"><label htmlFor="p-origin">Country</label><select id="p-origin" name="origin"><option>Bangladesh</option><option>Japan</option><option>Korea</option><option>China</option><option>Other</option></select></div><div className="field full"><label htmlFor="p-description">Product description</label><textarea id="p-description" name="description" rows={3}/></div></div>
 <label><input type="checkbox" name="active"/> Publish this product immediately</label><p><button className="button" disabled={pending}>Save product</button></p></form>:<p className="notice">Insufficient permission to create products.</p>}</div>}
 {tab==="Products"&&canStock&&<ProductManager/>}
 {tab==="Inventory"&&<div className="adminCard"><h2>Stock adjustment</h2>{canStock?<form className="adminForm" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send("/api/admin/stock",{productId:field(f,"productId"),type:field(f,"type"),quantity:Number(field(f,"quantity")),note:field(f,"note")});}}>
 <div className="field"><label>Product database ID</label><input name="productId" required placeholder="24-character ID"/></div>
 <div className="field"><label>Movement type</label><select name="type"><option value="receive">Stock received (+)</option><option value="damage">Damaged/lost (−)</option><option value="adjust">Adjustment (+/−)</option></select></div>
 <div className="field"><label>Quantity (negative when decreasing)</label><input name="quantity" type="number" required step="1"/></div>
 <div className="field"><label>Reason for audit log</label><textarea name="note" minLength={5} required/></div>
 <button className="button" disabled={pending}>Record stock movement</button></form>:<p className="notice">Stock adjustments require inventory permission.</p>}</div>}
 {tab==="Payments"&&<div className="adminCard"><h2>Manual payment reconciliation</h2><p className="smallprint">A customer screenshot is never sufficient proof. Independently verify funds with your merchant/bank account before using this form.</p>
 {canFinance?<form className="adminForm" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send("/api/admin/payments",{orderId:field(f,"orderId"),method:field(f,"method"),reference:field(f,"reference"),amountPaisa:Math.round(Number(field(f,"amount"))*100),note:field(f,"note"),verificationConfirmed:f.get("verified")==="on"});}}>
 <div className="field"><label>Order database ID</label><input name="orderId" required/></div>
 <div className="field"><label>Method</label><select name="method"><option value="bank_transfer">Bank transfer</option><option value="bkash_manual">bKash manual</option><option value="nagad_manual">Nagad manual</option><option value="cash">Cash received</option><option value="cod">Courier COD actually settled</option></select></div>
 <div className="field"><label>Unique verified payment reference</label><input name="reference" required/></div>
 <div className="field"><label>Amount actually received (BDT)</label><input type="number" min="0.01" step="0.01" name="amount" required/></div>
 <div className="field"><label>Reconciliation note</label><textarea name="note"/></div>
 <p><label><input type="checkbox" name="verified" required/> I independently confirmed this payment with the provider or actual cash receipt</label></p>
 <button className="button" disabled={pending}>Record verified funds</button></form>:<p className="notice">Finance permission required.</p>}</div>}
 {tab==="Drive Images"&&(canStock?<DriveMediaLibrary/>:<p className="notice">Inventory access required.</p>)}
 {tab==="Bulk Import"&&(canStock?<BulkCatalogImport/>:<p className="notice">Inventory access required.</p>)}
 {tab==="Suppliers"&&<div className="adminCard"><h2>Register supplier</h2>{canSuppliers?<form className="adminForm" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send("/api/admin/suppliers",{
 name:field(f,"name"),contact:field(f,"contact"),phone:field(f,"phone"),email:field(f,"email"),country:field(f,"country"),paymentTerms:field(f,"paymentTerms"),notes:field(f,"notes")});}}>
 {([["name","Supplier/company name"],["contact","Contact person"],["phone","Phone"],["email","Email"],["country","Country"],["paymentTerms","Payment terms"],["notes","Notes"]] as [string,string][]).map(([key,label])=><div className="field" key={key}><label>{label}</label><input name={key} required={key==="name"}/></div>)}<button className="button" disabled={pending}>Save supplier</button></form>:<p className="notice">Purchasing permission required.</p>}</div>}
 </>;
}
