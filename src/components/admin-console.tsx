
"use client";
import {useCallback,useEffect,useState} from "react";
import BulkCatalogImport from "@/components/bulk-catalog-import";
import AdminProductWorkspace from "@/components/admin-product-workspace";
import DriveMediaLibrary from "@/components/drive-media-library";
import R2Media from "@/components/r2-media";
import CloudinaryMedia from "@/components/cloudinary-media";
import LaunchReadiness from "@/components/launch-readiness";
import PurchaseManager from "@/components/purchase-manager";
import CanvaCatalogueReview from "@/components/canva-catalogue-review";
import HrWholesaleSource from "@/components/hr-wholesale-source";
import ChatbotManager from "@/components/chatbot-manager";
import HomepageManager from "@/components/homepage-manager";
import CourierSetup from "@/components/courier-setup";
import SocialInbox from "@/components/social-inbox";
import StoreChromeEditor from "@/components/store-chrome-editor";
import InventoryHealth from "@/components/inventory-health";
import CustomerCRM from "@/components/customer-crm";
import ActivityAudit from "@/components/activity-audit";
import IntegrationHub from "@/components/integration-hub";
import OrderQuality from "@/components/order-quality";
import FinanceAudit from "@/components/finance-audit";
import WarehouseLedger from "@/components/warehouse-ledger";
import OperationsRoadmap from "@/components/operations-roadmap";
type Overview={orderedPaisa:number;confirmedPaisa:number;deliveredSalesPaisa:number;recordedCollectionsPaisa:number;outstandingPaisa:number;supplierPayablePaisa:number;supplierPaidPaisa:number;cogsPaisa:number;recordedExpensePaisa:number;estimatedGrossProfitPaisa:number;estimatedOperatingProfitPaisa:number;unreconciled:boolean;placedOrders:number;deliveredOrders:number;lowStockSkus:number;reservedUnits:number;inventoryCostPaisa:number};
type Order={_id:string;orderNumber:string;orderStatus:string;paymentStatus:string;collectedPaisa:number;totalPaisa:number;customer:{name:string;phone:string};createdAt:string};
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
const tabs=["Overview","Enterprise Modules","Warehouse Transfers","Assistant Replies","Homepage Studio","Orders","Courier Setup","Products","Inventory","Payments","Suppliers","Purchasing","Bulk Import","Canva Catalogue","HR Wholesale","Drive Images","Cloudinary","R2 Images","Launch Readiness","Finance Audit","Order Quality","Integration Hub","Activity Logs","Customers","Inventory Health","Header & Footer","Social Inbox"];
export default function AdminConsole({role,initialTab}:{role:string;initialTab?:string}){
 const [tab,setTab]=useState(initialTab&&tabs.includes(initialTab)?initialTab:"Overview"),[overview,setOverview]=useState<Overview|null>(null),[orders,setOrders]=useState<Order[]>([]),[notice,setNotice]=useState(""),[pending,setPending]=useState(false);
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
 return <div className={tab==="Products"?"apConsole":""}>
 <div className="tabbar" role="tablist" aria-label="ERP sections">{tabs.map(t=><button key={t} className={tab===t?"active":""} role="tab" aria-selected={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</div>
 {tab==="Assistant Replies"&&(["owner","admin"].includes(role)?<ChatbotManager/>:<p>Owner or admin access required.</p>)}
 {notice&&<p role="status" className={notice.startsWith("Error")?"error":"success"}>{notice}</p>}
 {tab==="Overview"&&<><p className="muted">Financial totals show actual recorded orders and manually verified payments. Profit is an estimate until reconciliation.</p>
 {overview?<><div className="kpiGrid">
 {([["Ordered value",overview.orderedPaisa],["Confirmed value",overview.confirmedPaisa],["Delivered value",overview.deliveredSalesPaisa],["Funds recorded",overview.recordedCollectionsPaisa],["Outstanding balances",overview.outstandingPaisa],["Supplier commitments remaining (est.)",overview.supplierPayablePaisa],["Verified supplier payouts",overview.supplierPaidPaisa],["Delivered COGS",overview.cogsPaisa],["Recorded expenses",overview.recordedExpensePaisa],["Estimated gross profit",overview.estimatedGrossProfitPaisa],["Estimated operating profit",overview.estimatedOperatingProfitPaisa],["Inventory cost (on hand)",overview.inventoryCostPaisa]] as [string,number][]).map(([label,value])=><div className="kpi" key={label}><div className="muted">{label}</div><div className="number">{money(value)}</div></div>)}
 <div className="kpi"><div className="muted">Low-stock SKUs</div><div className="number">{overview.lowStockSkus}</div></div></div><p className="notice"><strong>Unreconciled estimates.</strong> Supplier commitments are planned purchase totals, not verified invoices. Costs, tax, refunds, courier COD remittances and operating expenses require reconciliation before net-profit reporting. Reserved units: {overview.reservedUnits}.</p></>:<p className="notice">Financial dashboard requires owner, administrator, finance or analyst access and a configured database.</p>}</>}
 {tab==="Enterprise Modules"&&(["owner","admin","inventory","purchasing","finance","analyst"].includes(role)?<OperationsRoadmap role={role}/>:<p className="notice">Operations access required.</p>)}
 {tab==="Warehouse Transfers"&&(["owner","admin","inventory","purchasing"].includes(role)?<WarehouseLedger role={role}/>:<p className="notice">Warehouse permission required.</p>)}
 {tab==="Finance Audit"&&(["owner","admin","finance","analyst"].includes(role)?<FinanceAudit/>:<p className="notice">Permission required.</p>)}
 {tab==="Order Quality"&&(["owner","admin","sales","support","analyst"].includes(role)?<OrderQuality/>:<p className="notice">Permission required.</p>)}
 {tab==="Integration Hub"&&(["owner","admin"].includes(role)?<IntegrationHub/>:<p className="notice">Permission required.</p>)}
 {tab==="Activity Logs"&&(["owner","admin","analyst"].includes(role)?<ActivityAudit/>:<p className="notice">Permission required.</p>)}
 {tab==="Customers"&&(["owner","admin","sales","support","analyst"].includes(role)?<CustomerCRM/>:<p className="notice">Permission required.</p>)}
 {tab==="Inventory Health"&&(["owner","admin","inventory","purchasing"].includes(role)?<InventoryHealth/>:<p className="notice">Permission required.</p>)}
 {tab==="Header & Footer"&&(["owner","admin"].includes(role)?<StoreChromeEditor/>:<p className="notice">Permission required.</p>)}
 {tab==="Social Inbox"&&(["owner","admin","support"].includes(role)?<SocialInbox/>:<p className="notice">Permission required.</p>)}
 {tab==="Homepage Studio"&&(["owner","admin"].includes(role)?<HomepageManager/>:<p className="notice">Owner or admin permission required.</p>)}
 {tab==="Courier Setup"&&<CourierSetup role={role}/>}
 {tab==="Orders"&&<div className="adminCard"><h2>Order queue</h2><p className="smallprint">Payment status and shipment status are separate. Mark an order shipped only after courier acceptance.</p>
 <table><thead><tr><th>Order</th><th>Customer</th><th>Value</th><th>Order state</th><th>Payment</th><th>Actions</th></tr></thead><tbody>{orders.map(o=><tr key={o._id}><td>{o.orderNumber}<br/><span className="muted">{new Date(o.createdAt).toLocaleDateString("en-BD")}</span></td><td>{o.customer?.name}<br/>{o.customer?.phone}</td><td>{money(o.totalPaisa)}</td><td>{o.orderStatus}</td><td>{o.paymentStatus}<br/><span className="muted">{money(o.collectedPaisa)} collected</span></td><td>{canOrders&&({placed:["confirmed","cancelled"],confirmed:["packed","cancelled"],packed:["shipped","cancelled"],shipped:["delivered"]} as Record<string,string[]>)[o.orderStatus]?.map(s=><button key={s} className="button small light" disabled={pending} style={{margin:"2px"}} onClick={()=>transition(o,s)}>{s}</button>)}<a style={{display:"block",marginTop:6}} href={"/admin/invoices/"+o._id}>Invoice</a></td></tr>)}</tbody></table>
 {orders.length===0&&<p className="notice">No accessible orders yet.</p>}</div>}
 {tab==="Products"&&(canStock?<AdminProductWorkspace/>:<p className="notice">Inventory permission required.</p>)}
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
 {tab==="Launch Readiness"&&(["owner","admin"].includes(role)?<LaunchReadiness/>:<p className="notice">Owner or admin access required.</p>)}
 {tab==="R2 Images"&&(canStock?<R2Media/>:<p className="notice">Inventory access required.</p>)}
 {tab==="Cloudinary"&&(canStock?<CloudinaryMedia/>:<p className="notice">Inventory access required.</p>)}
 {tab==="Drive Images"&&(canStock?<DriveMediaLibrary/>:<p className="notice">Inventory access required.</p>)}
 {tab==="HR Wholesale"&&(["owner","admin","inventory","purchasing"].includes(role)?<HrWholesaleSource role={role}/>:<p className="notice">Purchasing or inventory permission required.</p>)}
 {tab==="Canva Catalogue"&&(canStock||canSuppliers?<CanvaCatalogueReview/>:<p className="notice">Inventory or purchasing access required.</p>)}
 {tab==="Bulk Import"&&(canStock?<BulkCatalogImport/>:<p className="notice">Inventory access required.</p>)}
 {tab==="Purchasing"&&(["owner","admin","purchasing","inventory","finance"].includes(role)?<PurchaseManager role={role}/>:<p className="notice">Purchasing, inventory or finance permission required.</p>)}
 {tab==="Suppliers"&&<div className="adminCard"><h2>Register supplier</h2>{canSuppliers?<form className="adminForm" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void send("/api/admin/suppliers",{
 name:field(f,"name"),contact:field(f,"contact"),phone:field(f,"phone"),email:field(f,"email"),country:field(f,"country"),paymentTerms:field(f,"paymentTerms"),notes:field(f,"notes")});}}>
 {([["name","Supplier/company name"],["contact","Contact person"],["phone","Phone"],["email","Email"],["country","Country"],["paymentTerms","Payment terms"],["notes","Notes"]] as [string,string][]).map(([key,label])=><div className="field" key={key}><label>{label}</label><input name={key} required={key==="name"}/></div>)}<button className="button" disabled={pending}>Save supplier</button></form>:<p className="notice">Purchasing permission required.</p>}</div>}
 </div>;
}
