"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {Store,LayoutDashboard,ShoppingCart,Package,Boxes,ArrowLeftRight,AlertTriangle,FileText,Users,ChartNoAxesColumnIncreasing,Settings,Search,RefreshCw,Bell,ScanBarcode,Plus,Minus,Trash2,Printer,Check,WifiOff,Wallet,ShoppingBag,ArrowUpRight,ShieldCheck,Clock3,History,Building2,X} from "lucide-react";
type Branch={id:string;name:string;code:string;address:string};
type Product={id:string;name:string;sku:string;barcode:string;category:string;image:string;pricePaisa:number;branchStock:number;available:number;reorderLevel:number};
type Sale={id:string;invoiceNumber:string;totalPaisa:number;createdAt:string;cashierName:string;customerName:string};
type CartLine={product:Product;quantity:number};
type PosResponse={branches:Branch[];products:Product[];sales:Sale[];today:{salesPaisa:number;orders:number;items:number};lowStock:{productId:string;name:string;sku:string;quantity:number}[]};
type Receipt={invoiceNumber:string;branch:string;cashier:string;customer:string;lines:{name:string;sku:string;quantity:number;unitPricePaisa:number}[];subtotalPaisa:number;discountPaisa:number;totalPaisa:number;tenderedPaisa:number;changePaisa:number;date:string};
const money=(paisa:number)=>"৳ "+new Intl.NumberFormat("en-BD",{maximumFractionDigits:2}).format((paisa||0)/100);
const empty:PosResponse={branches:[],products:[],sales:[],today:{salesPaisa:0,orders:0,items:0},lowStock:[]};
const blankId=()=>crypto.randomUUID();
const nav=[["Overview","/admin/dashboard",LayoutDashboard],["Offline POS","/admin/offline-pos",ShoppingCart],["Sales & Invoices","/admin/offline-pos?view=invoices",FileText],["Inventory","/admin/inventory",Package],["Warehouse Ledger","/admin?tab=Warehouse%20Transfers",Boxes],["Stock Transfers","/admin?tab=Warehouse%20Transfers",ArrowLeftRight],["Branches & Damage","/admin/offline-pos/management",Store],["Products","/admin/products/manage",ShoppingBag],["Customers","/admin/customers",Users],["Reports","/admin/dashboard",ChartNoAxesColumnIncreasing],["Settings","/admin/integrations",Settings]] as const;
export default function OfflinePosWorkspace({canCheckout,canDiscount,cashierName}:{canCheckout:boolean;canDiscount:boolean;cashierName:string}){
 const [branchId,setBranchId]=useState(""),[data,setData]=useState<PosResponse>(empty),[cart,setCart]=useState<CartLine[]>([]);
 const [search,setSearch]=useState(""),[query,setQuery]=useState(""),[category,setCategory]=useState("All Products");
 const [paymentMethod,setPaymentMethod]=useState<"cash">("cash"),[discount,setDiscount]=useState("0"),[tendered,setTendered]=useState("");
 const [customer,setCustomer]=useState(""),[phone,setPhone]=useState("");
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [online,setOnline]=useState(true),[view,setView]=useState<"billing"|"invoices">("billing"),[receipt,setReceipt]=useState<Receipt|null>(null);
 const [opKey,setOpKey]=useState(blankId),[confirmedId,setConfirmedId]=useState("");
 const barcodeRef=useRef<HTMLInputElement>(null);
 const selectedBranch=data.branches.find(x=>x.id===branchId);
 const subtotal=cart.reduce((sum,line)=>sum+line.product.pricePaisa*line.quantity,0);
 const discountPaisa=Math.max(0,Math.round(Number(discount||0)*100));
 const grandTotal=Math.max(0,subtotal-discountPaisa);
 const tenderedPaisa=Math.round(Number(tendered||0)*100),change=Math.max(0,tenderedPaisa-grandTotal);
 const validDiscount=Number.isFinite(discountPaisa)&&discountPaisa<subtotal&&discountPaisa>=0&&Number(discount||0)>=0&&discountPaisa<=Math.floor(subtotal*0.2)&&(canDiscount||discountPaisa===0);
 const validTender=Number.isSafeInteger(tenderedPaisa)&&tenderedPaisa>=grandTotal;
 const branchStockValid=cart.every(line=>line.quantity<=line.product.available);
 const categories=useMemo(()=>["All Products",...new Set(data.products.map(x=>x.category).filter(Boolean))], [data.products]);
 const visible=useMemo(()=>data.products.filter(p=>(category==="All Products"||p.category===category)&&(!query||[p.name,p.sku,p.barcode].some(x=>x.toLowerCase().includes(query.toLowerCase())))).slice(0,80),[data.products,category,query]);
 const invalidate=()=>{setOpKey(blankId());setConfirmedId("");setReceipt(null);};
 const load=useCallback(async(id:string)=>{
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/offline-pos"+(id?"?branchId="+encodeURIComponent(id):""),{cache:"no-store"});
   const json=await response.json();
   if(!response.ok)throw Error(json.error||"POS data unavailable");
   setData(json);
   if(!id&&json.branches?.length)setBranchId(json.branches[0].id);
   setCart(old=>old.map(line=>({product:json.products?.find((p:Product)=>p.id===line.product.id)||line.product,quantity:line.quantity})));
  }catch(e){setError(e instanceof Error?e.message:"Unable to load POS");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{setOnline(navigator.onLine);const up=()=>setOnline(true),down=()=>setOnline(false);window.addEventListener("online",up);window.addEventListener("offline",down);return()=>{window.removeEventListener("online",up);window.removeEventListener("offline",down);}},[]);
 useEffect(()=>{void load(branchId);},[branchId,load]);
 useEffect(()=>{const u=new URLSearchParams(window.location.search);if(u.get("view")==="invoices")setView("invoices");},[]);
 function add(p:Product){if(!canCheckout||!p.available)return;invalidate();setNotice("");setCart(old=>{const current=old.find(x=>x.product.id===p.id);return current?old.map(x=>x.product.id===p.id?{...x,quantity:Math.min(p.available,x.quantity+1)}:x):[...old,{product:p,quantity:1}];});}
 function quantity(productId:string,value:number){invalidate();setCart(old=>old.map(x=>x.product.id===productId?{...x,quantity:Math.max(1,Math.min(x.product.available||1,value))}:x));}
 function reset(){invalidate();setCart([]);setDiscount("0");setTendered("");setCustomer("");setPhone("");setNotice("");}
 async function checkout(){
  if(!canCheckout||!branchId||!online||!cart.length||!branchStockValid||!validDiscount||!validTender||busy){setError("Check branch stock, cash amount and permissions before checkout.");return;}
  const snapshot={branch:selectedBranch?.name||"",cashier:cashierName,customer,lines:cart.map(l=>({name:l.product.name,sku:l.product.sku,quantity:l.quantity,unitPricePaisa:l.product.pricePaisa})),subtotalPaisa:subtotal,discountPaisa,totalPaisa:grandTotal,tenderedPaisa,changePaisa:change,date:new Date().toLocaleString("en-BD",{timeZone:"Asia/Dhaka"})};
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/offline-pos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({operationKey:opKey,branchId,lines:cart.map(l=>({productId:l.product.id,quantity:l.quantity})),paymentMethod,discountPaisa,tenderedPaisa,customerName:customer.trim(),customerPhone:phone.trim()})});
   const json=await response.json();
   if(!response.ok)throw Error(json.error||"Cash sale was not confirmed");
   setReceipt({...snapshot,invoiceNumber:json.invoiceNumber,totalPaisa:json.totalPaisa,changePaisa:json.changePaisa});
   setConfirmedId(json.invoiceNumber);
   setNotice((json.alreadyApplied?"Existing confirmed invoice: ":"Sale confirmed and stock deducted: ")+json.invoiceNumber);
   setCart([]);setTendered("");setDiscount("0");setCustomer("");setPhone("");setOpKey(blankId());
   await load(branchId);
  }catch(e){setError((e instanceof Error?e.message:"POS checkout failed")+". If network status is uncertain, use the same checkout to retry; do not start a new cart.");}
  finally{setBusy(false);}
 }
 function print(){if(receipt)window.print();}
 const isInvoice=view==="invoices";
 return <div className="anpos">
  <aside className="anpos-sidebar">
   <div className="anpos-brand"><strong>ANUSMITA</strong><span>FASHION · JEWELLERY · BEAUTY</span></div>
   <nav aria-label="POS navigation">{nav.map(([label,url,Icon])=><Link className={label==="Offline POS"&&!isInvoice||label==="Sales & Invoices"&&isInvoice?"active":""} key={label} href={url}><Icon size={17}/><span>{label}</span></Link>)}</nav>
   <div className="anpos-sidebar-bottom"><Store size={25}/><strong>Offline POS & Inventory ERP</strong><small>Connected enterprise terminal</small></div>
  </aside>
  <main className="anpos-main">
   <header className="anpos-topbar"><div className="anpos-heading"><div className="anpos-store-icon"><Store size={22}/></div><div><h1>Offline POS & Inventory ERP <span>Enterprise</span></h1><p>In-store sales, branch stock, cashier management & reporting</p></div></div>
    <div className="anpos-toptools"><label className="anpos-branch"><Store size={17}/><select aria-label="Select POS branch" value={branchId} onChange={e=>{reset();setBranchId(e.target.value)}} disabled={busy}><option value="">Select branch</option>{data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><button type="button" title="Reload branch inventory" onClick={()=>void load(branchId)} disabled={loading||busy}><RefreshCw size={18}/></button><div className="anpos-avatar">{cashierName.slice(0,1).toUpperCase()}</div></div>
   </header>
   <div className="anpos-body">
    {!online&&<div className="anpos-warning" role="alert"><WifiOff size={19}/> Connection unavailable. Draft carts remain visible, but stock cannot be reserved or a sale confirmed until online. No offline sale has been recorded.</div>}
    {error&&<div className="anpos-error" role="alert"><AlertTriangle size={18}/>{error}<button aria-label="Dismiss error" onClick={()=>setError("")}><X size={16}/></button></div>}
    {notice&&<div className="anpos-success" role="status"><ShieldCheck size={18}/>{notice}</div>}
    <section className="anpos-kpis" aria-label="Branch overview">
     <div><span className="anpos-kpi-icon pink"><Wallet/></span><div><small>Today's Cash Sales</small><strong>{money(data.today.salesPaisa)}</strong><em>{selectedBranch?.name||"Select a branch"}</em></div></div>
     <div><span className="anpos-kpi-icon green"><ShoppingCart/></span><div><small>Completed Sales</small><strong>{data.today.orders}</strong><em>Confirmed invoices</em></div></div>
     <div><span className="anpos-kpi-icon gold"><Package/></span><div><small>Items Sold</small><strong>{data.today.items} pcs</strong><em>Today's branch total</em></div></div>
     <div><span className="anpos-kpi-icon red"><AlertTriangle/></span><div><small>Low Stock (≤5)</small><strong>{data.lowStock.length}</strong><em>Allocated stock warnings</em></div></div>
     <div><span className="anpos-kpi-icon purple"><Boxes/></span><div><small>Branch Products</small><strong>{data.products.length}</strong><em>Available allocated SKUs</em></div></div>
    </section>
    <section className="anpos-tabs" aria-label="POS workflows"><button className={!isInvoice?"active":""} onClick={()=>setView("billing")}><ShoppingCart size={17}/> POS Billing</button><button className={isInvoice?"active":""} onClick={()=>setView("invoices")}><FileText size={17}/> Invoices</button><Link href="/admin/inventory"><Package size={16}/> Inventory</Link><Link href="/admin?tab=Warehouse%20Transfers"><ArrowLeftRight size={16}/> Stock Transfers</Link><button className="anpos-scan" onClick={()=>{setView("billing");barcodeRef.current?.focus()}}><ScanBarcode size={17}/> Scan Barcode</button></section>
    {isInvoice?<section className="anpos-panel anpos-invoices"><header><h2>Recent Branch Cash Invoices</h2><button onClick={()=>void load(branchId)} disabled={loading}><RefreshCw size={15}/> Refresh</button></header><p>Only confirmed cash transactions in the selected branch appear here. Sales cannot be deleted from this terminal.</p><div className="anpos-invoice-table"><table><thead><tr><th>Invoice</th><th>Cashier</th><th>Customer</th><th>Date</th><th>Total</th></tr></thead><tbody>{data.sales.map(s=><tr key={s.id}><td>{s.invoiceNumber}</td><td>{s.cashierName}</td><td>{s.customerName||"Walk-in"}</td><td>{new Date(s.createdAt).toLocaleString("en-BD",{timeZone:"Asia/Dhaka"})}</td><td>{money(s.totalPaisa)}</td></tr>)}</tbody></table>{!data.sales.length&&<p>No confirmed sales for this branch.</p>}</div></section>:
    <div className="anpos-layout">
     <section className="anpos-panel anpos-catalog"><header><h2>Browse products</h2><span>{loading?"Loading…":data.products.length+" allocated SKUs"}</span></header>
      <div className="anpos-search"><Search size={18}/><input ref={barcodeRef} value={search} onChange={e=>{setSearch(e.target.value);setQuery(e.target.value)}} onKeyDown={e=>{if(e.key==="Enter"){const p=data.products.find(x=>x.barcode===search||x.sku.toLowerCase()===search.toLowerCase());if(p){add(p);setSearch("");setQuery("");}}}} placeholder="Scan barcode or search by product name, SKU..." aria-label="Search product or scan barcode"/></div>
      <div className="anpos-filters">{categories.map(c=><button type="button" key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      <div className="anpos-products">{visible.map(p=><article className="anpos-product" key={p.id}><div className="anpos-photo">{p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<div className="anpos-no-photo">ANUSMITA</div>}</div><div className="anpos-product-details"><h3 title={p.name}>{p.name}</h3><small>{p.sku}</small><span className={p.available<=5?"low":"ok"}>{p.available<=5?"Low stock: ":"In stock: "}{p.available}</span><div><strong>{money(p.pricePaisa)}</strong><button type="button" aria-label={"Add "+p.name} disabled={!p.available||!canCheckout} onClick={()=>add(p)}><Plus size={17}/></button></div></div></article>)}</div>
      {!visible.length&&<div className="anpos-empty">{branchId?"No matching allocated products. Allocate inventory to this branch in Warehouse Ledger.":"Select an active branch to view allocated inventory."}</div>}
     </section>
     <section className="anpos-panel anpos-cart"><header><h2>Current Sale <span>({cart.reduce((n,l)=>n+l.quantity,0)} items)</span></h2><button className="anpos-clear" type="button" onClick={reset} disabled={!cart.length||busy}><Trash2 size={15}/> Clear</button></header>
      <div className="anpos-cart-items">{cart.map(line=><div className="anpos-cart-line" key={line.product.id}><div className="anpos-cart-thumb">{line.product.image?<img src={line.product.image} alt=""/>:<Package size={20}/>}</div><div className="anpos-cart-info"><h3>{line.product.name}</h3><small>SKU: {line.product.sku}</small><div className="anpos-cart-controls"><span>{money(line.product.pricePaisa)}</span><div><button aria-label="Decrease quantity" disabled={busy||line.quantity<=1} onClick={()=>quantity(line.product.id,line.quantity-1)}><Minus size={14}/></button><b>{line.quantity}</b><button aria-label="Increase quantity" disabled={busy||line.quantity>=line.product.available} onClick={()=>quantity(line.product.id,line.quantity+1)}><Plus size={14}/></button></div></div></div><button className="anpos-remove" aria-label="Remove item" onClick={()=>{invalidate();setCart(old=>old.filter(x=>x.product.id!==line.product.id))}}><X size={16}/></button></div>)}{!cart.length&&<div className="anpos-empty">Scan a barcode or add products from the catalog to start a sale.</div>}</div>
      <div className="anpos-checkout"><label className="anpos-label">Customer (optional)<input maxLength={100} value={customer} onChange={e=>{invalidate();setCustomer(e.target.value)}} placeholder="Walk-in customer name"/></label><label className="anpos-label">Phone (optional)<input maxLength={11} value={phone} onChange={e=>{invalidate();setPhone(e.target.value)}} placeholder="01XXXXXXXXX"/></label>
       <div className="anpos-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><label><span>Discount (৳)</span><input type="number" min="0" step=".01" disabled={!canDiscount} title={canDiscount?"Maximum 20% without separate approval":"Manager authorization required for discounts"} value={discount} onChange={e=>{invalidate();setDiscount(e.target.value)}} aria-label="Discount in taka"/></label><div className="grand"><span>Grand Total</span><strong>{money(grandTotal)}</strong></div></div>
       <div className="anpos-paymethods"><button className="active" type="button" onClick={()=>setPaymentMethod("cash")}><Wallet size={16}/> Cash</button><span>Card / MFS requires a verified payment provider</span></div>
       <div className="anpos-cash"><label className="anpos-label">Cash Received (৳)<input type="number" min="0" step=".01" value={tendered} onChange={e=>{invalidate();setTendered(e.target.value)}} placeholder="0.00"/></label><div><small>Change Return</small><strong>{money(change)}</strong></div></div>
       <div className="anpos-actions"><button type="button" onClick={print} disabled={!receipt}><Printer size={16}/> Print Last Receipt</button><button className="anpos-complete" type="button" onClick={()=>void checkout()} disabled={!canCheckout||!online||busy||!branchId||!cart.length||!branchStockValid||!validDiscount||!validTender}><Check size={18}/>{busy?"Processing…":"Complete Cash Sale"}</button></div>
       <small className="anpos-safety">Stock is deducted only after a successful authenticated server transaction. No checkout is confirmed while offline.</small>
      </div>
     </section>
     <aside className="anpos-right"><section className="anpos-panel anpos-alerts"><header><h2><AlertTriangle size={17}/> Stock Alerts (≤5)</h2><Link href="/admin/inventory">View All</Link></header>{data.lowStock.slice(0,8).map(s=><div key={s.productId}><div><strong>{s.name}</strong><small>{s.sku}</small></div><b>{s.quantity}</b></div>)}{!data.lowStock.length&&<p>No branch low-stock alerts available.</p>}</section>
      <section className="anpos-panel anpos-performance"><header><h2>Branch Performance</h2></header><p>Today's confirmed cash sales</p><strong>{money(data.today.salesPaisa)}</strong><div className="anpos-progress"><span style={{width:data.today.salesPaisa>0?"100%":"0%"}}/></div><small>{selectedBranch?.name||"No branch selected"}</small></section>
      <section className="anpos-panel anpos-recent"><header><h2><History size={17}/> Recent Invoices</h2><button onClick={()=>setView("invoices")}>View All</button></header>{data.sales.slice(0,4).map(s=><div key={s.id}><span>{s.invoiceNumber}<small>{s.cashierName}</small></span><strong>{money(s.totalPaisa)}</strong></div>)}{!data.sales.length&&<p>No confirmed branch sales yet.</p>}</section>
      <section className="anpos-panel anpos-links"><h2>Inventory ERP Tools</h2><Link href="/admin/offline-pos/management"><Store size={17}/> Branches & Damage Register <ArrowUpRight size={15}/></Link><Link href="/admin?tab=Warehouse%20Transfers"><Boxes size={17}/> Warehouse stock & transfer <ArrowUpRight size={15}/></Link><Link href="/admin/inventory"><AlertTriangle size={17}/> Damage & stock adjustment <ArrowUpRight size={15}/></Link><Link href="/admin/staff"><Users size={17}/> Staff & permissions <ArrowUpRight size={15}/></Link></section>
     </aside>
    </div>}
   </div>
  </main>
  {receipt&&<div className="anpos-print" aria-hidden="true"><h1>ANUSMITA</h1><p>IN-STORE CASH RECEIPT</p><p>{receipt.branch}</p><p>{receipt.date}</p><p>{receipt.invoiceNumber}</p><p>Cashier: {receipt.cashier}</p><p>Customer: {receipt.customer||"Walk-in"}</p><hr/>{receipt.lines.map(l=><div key={l.sku}>{l.name} × {l.quantity}<span>{money(l.quantity*l.unitPricePaisa)}</span></div>)}<hr/><div>Subtotal <span>{money(receipt.subtotalPaisa)}</span></div><div>Discount <span>{money(receipt.discountPaisa)}</span></div><div><b>Total</b><b>{money(receipt.totalPaisa)}</b></div><div>Cash <span>{money(receipt.tenderedPaisa)}</span></div><div>Change <span>{money(receipt.changePaisa)}</span></div><p>Thank you for shopping at ANUSMITA</p></div>}
 </div>;
}
