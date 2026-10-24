
"use client";
import { useEffect,useMemo,useRef,useState } from "react";
import Link from "next/link";
import {ArrowRight,ArrowUpRight,Search,ShoppingBag,SlidersHorizontal} from "lucide-react";
type Product={id:string;name:string;slug:string;brand:string;category:string;origin:string;image:string;size:string;pricePaisa:number;available:number};
type CartLine={id:string;quantity:number};
type Customer={name:string;phone:string;district:string;area:string;address:string;notes:string};
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
const mainCategories=["All","Skincare","Beauty","Fashion","Watches","Mobile Accessories","Bed Sheets","Perfumes","Bags","Jewellery","Accessories"];
function matchCategory(actual:string,selected:string){
 if(selected==="All")return true;
 const normalized=actual.toLowerCase(),needle=selected.toLowerCase();
 if(needle==="skincare")return /skin|cleanser|serum|sunscreen|toner|cream/.test(normalized);
 if(needle==="beauty")return /beauty|cosmetic|makeup|skin|hair/.test(normalized);
 if(needle==="watches")return /watch|timepiece/.test(normalized);
 if(needle==="mobile accessories")return /mobile|phone|tech|electronics|earbud/.test(normalized);
 if(needle==="bed sheets")return /bed|home|linen|sheet/.test(normalized);
 if(needle==="perfumes")return /perfume|fragrance|scent/.test(normalized);
 if(needle==="bags")return /bag|purse|handbag/.test(normalized);
 if(needle==="jewellery")return /jewel|jewelr|necklace|ring|bracelet|earring/.test(normalized);
 if(needle==="fashion")return /fashion|cloth|apparel|dress|wear/.test(normalized);
 if(needle==="accessories")return /accessor|bag|watch/.test(normalized);
 return normalized===needle;
}
export default function Storefront({products,canOrder}:{products:Product[];canOrder:boolean}){
 const [search,setSearch]=useState(""),[category,setCategory]=useState("All"),[cart,setCart]=useState<CartLine[]>([]),[cartOpen,setCartOpen]=useState(false);
 const [remoteProducts,setRemoteProducts]=useState<Product[]>([]),[cartProducts,setCartProducts]=useState<Product[]>([]),[remotePage,setRemotePage]=useState(1),[remotePages,setRemotePages]=useState(1),[searching,setSearching]=useState(false);
 const [hydrated,setHydrated]=useState(false),[customer,setCustomer]=useState<Customer>({name:"",phone:"",district:"",area:"",address:"",notes:""});
 const [payment,setPayment]=useState("cod"),[deposit,setDeposit]=useState("0"),[submitting,setSubmitting]=useState(false);
 const [error,setError]=useState(""),[result,setResult]=useState<{orderNumber:string;totalPaisa:number}|null>(null);
 const keyRef=useRef<string|null>(null);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const requested=params.get("category");const initialSearch=params.get("q");if(initialSearch)setSearch(initialSearch.slice(0,80));if(requested&&mainCategories.some(x=>x.toLowerCase()===requested.toLowerCase()))setCategory(mainCategories.find(x=>x.toLowerCase()===requested.toLowerCase())||"All");else if(params.get("item"))setCategory("All");try{const value=JSON.parse(localStorage.getItem("anusmita-cart-v1")||"[]");if(Array.isArray(value))setCart(value.filter((x:any)=>typeof x.id==="string"&&Number.isInteger(x.quantity)&&x.quantity>0));}catch{}setHydrated(true);},[]);
 useEffect(()=>{if(hydrated)localStorage.setItem("anusmita-cart-v1",JSON.stringify(cart));},[cart,hydrated]);
 const categories=[...mainCategories,...Array.from(new Set(products.map(p=>p.category))).filter(c=>!mainCategories.some(x=>x.toLowerCase()===c.toLowerCase()))];
 const catalog=useMemo(()=>{const seen=new Map<string,Product>();for(const p of [...products,...remoteProducts,...cartProducts])seen.set(p.id,p);return Array.from(seen.values());},[products,remoteProducts,cartProducts]);
 const mapProduct=(p:any):Product=>({id:String(p._id),name:p.name,slug:p.slug,brand:p.brand||"",category:p.category,origin:p.origin,image:p.imageUrls?.[0]||"",size:p.size||"",pricePaisa:p.pricePaisa,available:p.available});
 useEffect(()=>{
  if(!search.trim()){setRemoteProducts([]);setRemotePages(1);setSearching(false);return;}
  const controller=new AbortController();setSearching(true);
  const timer=setTimeout(async()=>{try{
   const response=await fetch("/api/products?q="+encodeURIComponent(search)+"&page="+remotePage+"&limit=24",{signal:controller.signal});
   if(!response.ok)throw new Error("Search failed");const data=await response.json();
   setRemotePages(data.pages||1);setRemoteProducts(old=>remotePage===1?data.products.map(mapProduct):[...old,...data.products.map(mapProduct)]);
  }catch(e){if(!controller.signal.aborted)setRemoteProducts([]);}finally{if(!controller.signal.aborted)setSearching(false);}},250);
  return()=>{controller.abort();clearTimeout(timer);};
 },[search,remotePage]);
 useEffect(()=>{
  const missing=cart.map(l=>l.id).filter(id=>!products.some(p=>p.id===id));
  if(!missing.length){setCartProducts([]);return;}
  const controller=new AbortController();
  fetch("/api/products?ids="+encodeURIComponent(missing.slice(0,30).join(","))+"&limit=30",{signal:controller.signal})
   .then(r=>r.ok?r.json():Promise.reject(new Error("Lookup failed")))
   .then(data=>{if(!controller.signal.aborted)setCartProducts(data.products.map(mapProduct));}).catch(()=>{});
  return()=>controller.abort();
 },[cart,products]);
 const visible=(search.trim()?remoteProducts:products).filter(p=>matchCategory(p.category,category)&&(p.name+" "+p.brand+" "+p.origin).toLowerCase().includes(search.toLowerCase()));
 const detailed=useMemo(()=>cart.map(l=>({item:catalog.find(p=>p.id===l.id),quantity:l.quantity})).filter((l):l is {item:Product;quantity:number}=>Boolean(l.item)),[cart,catalog]);
 const subtotal=detailed.reduce((sum,l)=>sum+l.item.pricePaisa*l.quantity,0);
 const shipping=customer.district.trim().toLowerCase()==="dhaka"?7000:12000;
 const add=(id:string)=>{if(!canOrder)return;setCart(old=>{const item=catalog.find(p=>p.id===id);if(!item||item.available<=0)return old;const found=old.find(l=>l.id===id);return found?old.map(l=>l.id===id?{...l,quantity:Math.min(item.available,20,l.quantity+1)}:l):[...old,{id,quantity:1}];});};
 const setQty=(id:string,qty:number)=>setCart(old=>old.map(l=>l.id===id?{...l,quantity:Math.min(20,Math.max(0,qty),catalog.find(p=>p.id===id)?.available||0)}:l).filter(l=>l.quantity>0));
 const change=(k:keyof Customer,v:string)=>{setCustomer(c=>({...c,[k]:v}));keyRef.current=null;};
 async function checkout(ev:React.FormEvent<HTMLFormElement>){
  ev.preventDefault();setError("");setResult(null);
  if(!canOrder){setError("Checkout is not yet open");return;}
  if(!detailed.length)return;
  setSubmitting(true);
  try{
   if(!keyRef.current)keyRef.current=crypto.randomUUID();
   const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":keyRef.current},body:JSON.stringify({items:detailed.map(l=>({productId:l.item.id,quantity:l.quantity})),customer,paymentMethod:payment,depositPaisa:Math.round(Number(deposit)*100)})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Checkout failed");
   setResult({orderNumber:data.orderNumber,totalPaisa:data.totalPaisa});setCart([]);keyRef.current=null;
  }catch(e){setError(e instanceof Error?e.message:"Checkout failed");}finally{setSubmitting(false);}
 }

 return <><div className="shopTools luxShopTools">
  <div className="luxSearchBox"><Search size={19} strokeWidth={1.6} aria-hidden="true"/>
   <input id="store-search" type="search" value={search} onChange={e=>{setSearch(e.target.value);setRemotePage(1);setRemoteProducts([]);}}
    placeholder="What are you looking for?" aria-label="Search ANUSMITA products"/>
  </div>
  <div className="luxShopFilter"><SlidersHorizontal size={17} aria-hidden="true"/>
   <select aria-label="Filter products by category" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
  </div>
  {canOrder&&<button className="luxHeaderBag" type="button" onClick={()=>setCartOpen(true)}>
   <ShoppingBag size={18}/><span>Bag ({cart.reduce((sum,line)=>sum+line.quantity,0)})</span>
  </button>}
 </div>
 <div className="luxCategoryTabs" role="group" aria-label="Shop categories">
  {mainCategories.map(c=><button key={c} type="button" className={category===c?"active":""}
   aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}
 </div>
 {visible.length===0?(products.length===0&&!search.trim()?<div className="luxEmptyEdit">
  <div className="luxEmptyCopy"><span className="luxKicker">A NEW CHAPTER IS COMING</span>
   <h3>Something <em>lovely</em><br/>is on its way.</h3>
   <p>Our online product selection is being prepared. Discover the ANUSMITA story and collections while we get everything ready.</p>
   <a className="luxUnderLink" href="#collections">Explore the collections <ArrowUpRight size={18}/></a>
   <span className="luxEmptyFine">Preview only · No orders are being taken</span>
  </div>
  <div className="luxEmptyVisual" aria-label="ANUSMITA editorial beauty gallery">
   <img src="https://res.cloudinary.com/oseohmxd/image/upload/v1792790876/anusmita/drive/korea/drive-1VJkC6_mH_tZEM6qd62tmtrK19KibPi2m.jpg"
    alt="ANUSMITA beauty collection editorial" loading="lazy"/>
   <div className="luxEmptyStamp">THE ART OF<br/><i>DISCOVERY</i><small>ANUSMITA · BD</small></div>
  </div>
 </div>:<div className="luxNoResults" role="status">
  {searching?<p>Searching the collection…</p>:<>
   <h3>No matches in this edit.</h3>
   <p>Try another category or search for a different name.</p>
   <button className="luxUnderLink" type="button" onClick={()=>{setCategory("All");setSearch("");setRemotePage(1);}}>Clear filters <ArrowRight size={16}/></button>
  </>}
 </div>):
 <div className="productGrid luxProductGrid">{visible.map(p=><article className="productCard luxProductCard" key={p.id}>
  <Link className="productImage luxProductImage" href={"/products/"+p.slug} aria-label={"View "+p.name}>
   {p.image?<img alt={p.name} src={p.image} loading="lazy" referrerPolicy="no-referrer"/>:<span className="luxProductFallback" aria-hidden="true">A.</span>}
   <span className="luxProductExplore"><ArrowUpRight size={18}/></span>
   {p.available<=0&&<span className="luxStockStatus">Currently unavailable</span>}
  </Link>
  <div className="productInfo luxProductInfo">
   <div className="origin luxProductOrigin">{p.brand||p.origin}<span> / {p.category}</span></div>
   <h3><Link href={"/products/"+p.slug}>{p.name}</Link></h3>
   <div className="luxProductBottom">
    <div><div className="muted">{p.size||p.origin}</div><div className="price">{money(p.pricePaisa)}</div></div>
    {canOrder&&p.available>0?<button type="button" className="luxProductAdd" aria-label={"Add "+p.name+" to bag"} onClick={()=>{add(p.id);setCartOpen(true);}}>
     <ShoppingBag size={19}/></button>:<Link className="luxProductAdd" href={"/products/"+p.slug} aria-label={"View details for "+p.name}><ArrowUpRight size={18}/></Link>}
   </div>
  </div>
 </article>)}</div>}
 {search.trim() && remotePage<remotePages && <div style={{textAlign:"center",padding:"28px"}}><button className="button light" disabled={searching} onClick={()=>setRemotePage(p=>p+1)}>{searching?"Loading…":"Load more search results"}</button></div>}
 {canOrder&&cart.length>0&&<button className="cartToggle" onClick={()=>setCartOpen(true)} aria-label="Open shopping bag">Bag · {money(subtotal)}</button>}
 {canOrder&&cartOpen&&<><div className="scrim" onClick={()=>setCartOpen(false)} aria-hidden="true"/><aside className="cartPanel" aria-label="Shopping bag and checkout"><div className="cartTop"><h2>Your bag</h2><button className="iconButton" onClick={()=>setCartOpen(false)} aria-label="Close">✕</button></div>
 {result?<div className="success"><h3>Order received</h3><strong>{result.orderNumber}</strong><p>Total: {money(result.totalPaisa)}</p><p>Your order has been placed; payment is not yet verified. We will confirm it before fulfilment.</p><button className="button small" onClick={()=>{setCartOpen(false);setResult(null);}}>Continue browsing</button></div>:
 <>
 {detailed.length===0?<p className="notice">Your shopping bag is empty.</p>:<><div>{detailed.map(l=><div className="cartRow" key={l.item.id}><div><h4>{l.item.name}</h4><div className="muted">{money(l.item.pricePaisa)} each</div></div><div className="qty"><button aria-label={"Reduce "+l.item.name} onClick={()=>setQty(l.item.id,l.quantity-1)}>−</button>{l.quantity}<button aria-label={"Add "+l.item.name} onClick={()=>setQty(l.item.id,l.quantity+1)}>+</button></div></div>)}</div>
 <div className="summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p className="smallprint">Delivery fee estimated at checkout; final amount confirmed by the server.</p></div>
 <h3 style={{fontFamily:"Georgia,serif",fontWeight:400,fontSize:25}}>Delivery details</h3>
 <form onSubmit={checkout}><div className="formGrid">
 {(["name","phone","district","area","address"] as const).map(k=><div className={"field "+(k==="address"?"full":"")} key={k}><label htmlFor={"checkout-"+k}>{k.charAt(0).toUpperCase()+k.slice(1)} *</label><input id={"checkout-"+k} required value={customer[k]} onChange={e=>change(k,e.target.value)} maxLength={k==="address"?400:100} placeholder={k==="phone"?"01XXXXXXXXX":""} pattern={k==="phone"?"01[3-9][0-9]{8}":undefined}/></div>)}
 <div className="field full"><label htmlFor="notes">Delivery notes</label><textarea id="notes" rows={2} maxLength={400} value={customer.notes} onChange={e=>change("notes",e.target.value)}/></div>
 <div className="field full"><label htmlFor="payment">Payment preference</label><select id="payment" value={payment} onChange={e=>{setPayment(e.target.value);setDeposit("0");keyRef.current=null;}}><option value="cod">Cash on Delivery</option><option value="bank_transfer">Bank transfer (manual verification)</option><option value="bkash_manual">bKash transfer (manual verification)</option><option value="nagad_manual">Nagad transfer (manual verification)</option></select></div>
 {payment!=="cod"&&<div className="field full"><label htmlFor="deposit">Planned advance payment (BDT) — optional</label><input id="deposit" type="number" min="0" step="0.01" value={deposit} onChange={e=>{setDeposit(e.target.value);keyRef.current=null;}}/><p className="smallprint">Selecting a transfer method does not initiate or verify payment. Await instructions from ANUSMITA staff.</p></div>}
 </div>
 <div className="summary"><div><span>Delivery estimate</span><span>{money(shipping)}</span></div><div><strong>Estimated total</strong><strong>{money(subtotal+shipping)}</strong></div></div>
 {error&&<p className="error" role="alert">{error}</p>}
 <button className="button" style={{width:"100%"}} disabled={submitting}>{submitting?"Submitting…":"Place Order →"}</button><p className="smallprint">Prices, availability and delivery fee will be rechecked by the server. Orders are not payment confirmations.</p>
 </form></>}
 </>}</aside></>}
 </>;
}
