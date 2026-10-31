'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Heart,ShoppingBag,Trash2,ArrowRight,Minus,Plus,LockKeyhole,Truck,ChevronRight,MapPin,Check,Wallet,CreditCard,ShieldCheck} from 'lucide-react';
import CommerceSteps from '@/components/commerce-steps';
import {districtLocations,areaOptions,locationPairValid} from '@/lib/bd-locations';
import {sheetCatalogue} from '@/lib/sheet-catalogue';
import {emptyShopping,sanitizeShopping,shoppingKey,shoppingSubtotal,type ShoppingState} from '@/lib/shopping-storage';
function read(){try{return sanitizeShopping(JSON.parse(localStorage.getItem(shoppingKey)||'null'))}catch{return emptyShopping}}
function useShopping(){const [state,setState]=useState<ShoppingState>(emptyShopping);const [ready,setReady]=useState(false);const [error,setError]=useState('');useEffect(()=>{const sync=()=>{setState(read());setReady(true)};sync();window.addEventListener('storage',sync);window.addEventListener('anusmita-shopping',sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener('anusmita-shopping',sync)}},[]);function update(fn:(s:ShoppingState)=>ShoppingState){try{const next=sanitizeShopping(fn(read()));localStorage.setItem(shoppingKey,JSON.stringify(next));setState(next);window.dispatchEvent(new Event('anusmita-shopping'));setError('');return true}catch{setError('Your browser could not save this selection. Please enable browser storage and try again.');return false}}return{state,ready,error,update}}
const money=(n:number)=>'৳'+(n/100).toLocaleString('en-BD');
export function ShoppingLinks(){const {state}=useShopping();return <><Link href="/wishlist" aria-label={'Wishlist, '+state.wishlist.length+' saved products'}><Heart size={20}/><small>{state.wishlist.length||''}</small></Link><Link href="/cart" aria-label={'Shopping bag, '+state.cart.reduce((n,l)=>n+l.quantity,0)+' items'}><ShoppingBag size={20}/><small>{state.cart.reduce((n,l)=>n+l.quantity,0)||''}</small></Link></>}
export function ShoppingActions({id,detail=false}:{id:string;detail?:boolean}){const {state,ready,error,update}=useShopping();const [notice,setNotice]=useState('');const router=useRouter();const saved=state.wishlist.includes(id);function add(buy=false){const ok=update(s=>{const old=s.cart.find(l=>l.id===id);return {...s,cart:old?s.cart.map(l=>l.id===id?{...l,quantity:Math.min(20,l.quantity+1)}:l):[...s.cart,{id,quantity:1}]}});if(ok){setNotice('Added to your bag');if(buy)router.push('/checkout')}}return <div className="shoppingActions"><div><button disabled={!ready} className="shoppingAdd" onClick={()=>add()}>Add to cart</button><button disabled={!ready} className="shoppingHeart" aria-label={saved?'Remove from wishlist':'Add to wishlist'} aria-pressed={saved} onClick={()=>update(s=>({...s,wishlist:saved?s.wishlist.filter(x=>x!==id):[...s.wishlist,id]}))}><Heart size={19} fill={saved?'currentColor':'none'}/></button></div>{detail&&<button disabled={!ready} className="shoppingBuy" onClick={()=>add(true)}>Buy now · Confirm with ANUSMITA</button>}<span role="status">{error||notice}{notice&&!error&&<> · <Link href="/cart">View cart</Link></>}</span></div>}
/** Compact, accessible wishlist toggle for the top-right corner of product imagery. */
export function ProductCardWishlist({id}:{id:string}){
 const {state,ready,error,update}=useShopping();
 const saved=state.wishlist.includes(id);
 return <button type="button" className="anShopCardHeart" disabled={!ready}
  aria-label={saved?'Remove from wishlist':'Add to wishlist'} aria-pressed={saved}
  title={error|| (saved?'Remove from wishlist':'Save to wishlist')}
  onClick={()=>update(s=>({...s,wishlist:saved?s.wishlist.filter(x=>x!==id):[...s.wishlist,id]}))}>
  <Heart size={19} strokeWidth={1.8} fill={saved?'currentColor':'none'}/>
 </button>;
}
type DisplayProduct={id:string;name:string;slug:string;size:string;image:string;pricePaisa:number|null;deliveryIncluded:boolean;category:string};
const staticProducts:DisplayProduct[]=sheetCatalogue.map(p=>({id:p.id,name:p.name,slug:p.slug,size:p.size,image:p.image,pricePaisa:p.pricePaisa,deliveryIncluded:p.deliveryIncluded,category:p.category}));
export default function ShoppingPage({mode,codEnabled=false}:{mode:'cart'|'wishlist'|'checkout';codEnabled?:boolean}){
 const {state,ready,error,update}=useShopping();
 const [consent,setConsent]=useState(false);
 const [codCustomer,setCodCustomer]=useState({name:'',phone:'',district:'',area:'',address:'',notes:''});
 const [codPending,setCodPending]=useState(false),[codError,setCodError]=useState('');
 const [codKey,setCodKey]=useState('');
 const [deliveryRegion,setDeliveryRegion]=useState<'dhaka'|'outside'|'international'>('dhaka');
 const [email,setEmail]=useState(''),[postal,setPostal]=useState('');
 const router=useRouter();
 const [remote,setRemote]=useState<DisplayProduct[]>([]);
 const [loading,setLoading]=useState(false);
 const [loadError,setLoadError]=useState('');
 const ids=useMemo(()=>[...new Set([...state.cart.map(x=>x.id),...state.wishlist])].filter(id=>/^[0-9a-f]{24}$/i.test(id)),[state]);
 const key=ids.join(',');
 useEffect(()=>{
  if(!key){setRemote([]);setLoading(false);setLoadError('');return;}
  const controller=new AbortController();setLoading(true);setLoadError('');
  Promise.all(Array.from({length:Math.ceil(ids.length/30)},(_,i)=>ids.slice(i*30,(i+1)*30)).map(async group=>{
   const response=await fetch('/api/products?ids='+encodeURIComponent(group.join(','))+'&limit=30',{signal:controller.signal,cache:'no-store'});
   if(!response.ok)throw new Error('Product lookup failed');
   const result=await response.json();
   return (result.products||[]).map((p:any):DisplayProduct=>({id:String(p._id),name:p.name,slug:p.slug,size:p.size||p.variantLabel||'',image:p.imageUrls?.[0]||'',pricePaisa:p.pricePaisa,deliveryIncluded:false,category:p.category||''}));
  })).then(batches=>{if(!controller.signal.aborted)setRemote(batches.flat())}).catch(()=>{if(!controller.signal.aborted)setLoadError('Some products could not be loaded. Refresh and try again.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[key]);
 const productMap=useMemo(()=>new Map([...staticProducts,...remote].map(p=>[p.id,p])),[remote]);
 const missing=ids.filter(id=>!productMap.has(id));
 const lines=state.cart.map(line=>({...line,p:productMap.get(line.id)})).filter((line):line is {id:string;quantity:number;p:DisplayProduct}=>Boolean(line.p));
 const wishlist=state.wishlist.map(id=>productMap.get(id)).filter((p):p is DisplayProduct=>Boolean(p));
 const isCheckout=mode==='checkout';
 const total=lines.reduce((sum,l)=>sum+(l.p.pricePaisa||0)*l.quantity,0);
 const unknown=lines.some(l=>l.p.pricePaisa===null);
 const extraDelivery=lines.some(l=>!l.p.deliveryIncluded);
 async function submitCod(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!codEnabled||!consent||codPending||loadError||missing.length||unknown||!locationPairValid(codCustomer.district,codCustomer.area)||deliveryRegion==="international"||lines.some(l=>!/^[0-9a-f]{24}$/i.test(l.id)))return;
  setCodPending(true);setCodError('');
  const key=codKey||crypto.randomUUID();setCodKey(key);
  try{
   const response=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({items:lines.map(l=>({productId:l.id,quantity:l.quantity})),customer:codCustomer,paymentMethod:'cod',depositPaisa:0})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'COD order was not accepted');
   if(typeof result.receiptUrl!=='string'||!result.receiptUrl.startsWith('/order-success?token='))throw new Error('Order recorded but receipt unavailable. Contact support with your order reference.');
   setCodKey('');update(x=>({...x,cart:[]}));router.push(result.receiptUrl);
  }catch(error){setCodError(error instanceof Error?error.message:'Unable to place COD order');}finally{setCodPending(false)}
 }

 return <div className={"anWide shoppingPage anFlowPage"+(isCheckout?" anFlowCheckoutReference":"")}>{isCheckout&&<nav className="anCheckoutBreadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13}/><Link href="/cart">Shopping Bag</Link><ChevronRight size={13}/><span>Checkout</span></nav>}{mode!=="wishlist"&&<CommerceSteps step={isCheckout?2:1}/>}<p className="anOverline">ANUSMITA · THOUGHTFULLY CURATED</p>
  <h1>{mode==='wishlist'?'Your saved favourites.':isCheckout?'Checkout':'Your Shopping Bag'}</h1>
  {mode!=="wishlist"&&<p className="anFlowSubtitle">{isCheckout?"Almost there! Tell us where to deliver your favourites.":"A little more beautiful, one favourite at a time."}</p>}
  <nav className="shoppingNav"><Link href="/shop">Continue shopping</Link><Link href="/cart">Cart ({state.cart.reduce((n,l)=>n+l.quantity,0)})</Link><Link href="/wishlist">Wishlist ({state.wishlist.length})</Link></nav>
  {!ready||loading?<p role="status">Loading your selection…</p>:<>
   {loadError&&<p className="error" role="alert">{loadError}</p>}
   {missing.length>0&&<p className="notice" role="status">{missing.length} saved product(s) are unavailable or no longer published. They have not been removed from your list.</p>}
   {mode==='wishlist'?(wishlist.length?<div className="sheetGrid">{wishlist.map(p=><article className="sheetCard" key={p.id}>
    <Link href={'/products/'+p.slug}><div className="sheetPhoto">{p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<span>ANUSMITA</span>}</div><div className="sheetCardCopy"><h3>{p.name}</h3><strong>{p.pricePaisa===null?'Confirm price':money(p.pricePaisa)}</strong></div></Link>
    <ShoppingActions id={p.id}/>
   </article>)}</div>:<div className="sheetEmpty"><h2>Your wishlist is waiting.</h2><p>Tap the heart on a product to save it here.</p><Link href="/shop">Explore products →</Link></div>):
   (!lines.length?<div className="sheetEmpty"><h2>Your bag is empty.</h2><Link href="/shop">Find something lovely →</Link></div>:
   <div className="shoppingLayout anFlowLayout"><section className="anFlowItems">{!isCheckout&&<div className="anFlowHero"><div><small>YOUR CURATED EDIT</small><h2>Your Shopping Bag</h2><p>Selected with care. Made for your moments.</p></div><img src="/brand/promo-reference.webp" alt="" loading="lazy"/></div>}{isCheckout&&<div className="anFlowCheckoutIntro"><div><h2>Checkout</h2><p>Almost there! Tell us where to deliver your favourites.</p></div><span className="anCheckoutFloral" aria-hidden="true">✿ ❀ ✿</span></div>}{lines.map(({id,quantity,p})=><article className="shoppingLine anFlowItem" key={id}>
    <Link href={'/products/'+p.slug}>{p.image?<img src={p.image} alt={p.name}/>:<span className="shoppingImageFallback">A.</span>}</Link>
    <div><small>{p.category}</small><h2><Link href={'/products/'+p.slug}>{p.name}</Link></h2><p>{p.size}</p><p>{p.pricePaisa===null?'Price to be confirmed':money(p.pricePaisa)} · Availability confirmed before ordering</p>
     <div className="anFlowQty"><button type="button" disabled={quantity<=1} aria-label={"Reduce quantity of "+p.name} onClick={()=>update(x=>({...x,cart:x.cart.map(l=>l.id===id?{...l,quantity:Math.max(1,l.quantity-1)}:l)}))}><Minus size={14}/></button><output>{quantity}</output><button type="button" disabled={quantity>=20} aria-label={"Increase quantity of "+p.name} onClick={()=>update(x=>({...x,cart:x.cart.map(l=>l.id===id?{...l,quantity:Math.min(20,l.quantity+1)}:l)}))}><Plus size={14}/></button></div>
     <button className="shoppingRemove" aria-label={'Remove '+p.name} onClick={()=>update(s=>({...s,cart:s.cart.filter(l=>l.id!==id)}))}><Trash2 size={15}/> Remove</button>
    </div><strong>{p.pricePaisa===null?'Confirm price':money(p.pricePaisa*quantity)}</strong>
   </article>)}{isCheckout&&<form className="anCodForm anFlowCheckoutForm" onSubmit={submitCod}>
 <h3>Delivery Details</h3>
 <div className="anCheckoutFieldGrid">
 <label>Full Name <span>*</span><input required autoComplete="name" placeholder="Enter your full name" value={codCustomer.name} maxLength={100} onChange={e=>{setCodCustomer(x=>({...x,name:e.target.value}));setCodKey('');}}/></label>
 <label>Phone Number <span>*</span><input required type="tel" inputMode="tel" autoComplete="tel" pattern="01[3-9][0-9]{8}" placeholder="01XXXXXXXXX" value={codCustomer.phone} maxLength={11} onChange={e=>{setCodCustomer(x=>({...x,phone:e.target.value}));setCodKey('');}}/></label>
 <label className="anCheckoutFull">Email (optional)<input type="email" autoComplete="email" value={email} maxLength={150} placeholder="Enter your email address" onChange={e=>setEmail(e.target.value)}/></label>
 <label className="anCheckoutFull">Street Address <span>*</span><input required autoComplete="street-address" placeholder="House number, road name, apartment (if any)" value={codCustomer.address} maxLength={400} onChange={e=>{setCodCustomer(x=>({...x,address:e.target.value}));setCodKey('');}}/></label>
 <label>District / City <span>*</span><select required autoComplete="address-level1" value={codCustomer.district} onChange={e=>{const district=e.target.value;setCodCustomer(x=>({...x,district,area:""}));setDeliveryRegion(district==="Dhaka"?"dhaka":district?"outside":"dhaka");setCodKey("");}}><option value="">Select district / city</option>{districtLocations.map(d=><option key={d.district} value={d.district}>{d.district}</option>)}</select></label>
 <label>Area / Thana <span>*</span><select required autoComplete="address-level2" value={codCustomer.area} disabled={!codCustomer.district} onChange={e=>{setCodCustomer(x=>({...x,area:e.target.value}));setCodKey("");}}><option value="">{codCustomer.district?"Select area / thana":"Select district first"}</option>{areaOptions(codCustomer.district).map(area=><option key={area} value={area}>{area}</option>)}</select></label>
 <label>Postal Code (optional)<input inputMode="numeric" autoComplete="postal-code" placeholder="Enter postal code" value={postal} maxLength={10} onChange={e=>setPostal(e.target.value)}/></label>
 <label>Order Notes (optional)<input placeholder="Any special instructions..." maxLength={400} value={codCustomer.notes} onChange={e=>setCodCustomer(x=>({...x,notes:e.target.value}))}/></label>
 </div>
 <h3 className="anCheckoutSectionHeading">Shipping Option</h3>
 <div className="anCheckoutShippingOptions" role="group" aria-label="Shipping region">
 <button type="button" aria-pressed={deliveryRegion==='dhaka'} onClick={()=>{setDeliveryRegion("dhaka");if(codCustomer.district&&codCustomer.district!=="Dhaka")setCodCustomer(x=>({...x,district:"",area:""}));}} className={deliveryRegion==='dhaka'?'selected':''}><span className="anCheckoutRadio">{deliveryRegion==='dhaka'?<Check size={13}/>:null}</span><span><strong>Inside Dhaka</strong><small>Fee confirmed at order submission</small></span></button>
 <button type="button" aria-pressed={deliveryRegion==='outside'} onClick={()=>{setDeliveryRegion("outside");if(codCustomer.district==="Dhaka")setCodCustomer(x=>({...x,district:"",area:""}));}} className={deliveryRegion==='outside'?'selected':''}><span className="anCheckoutRadio">{deliveryRegion==='outside'?<Check size={13}/>:null}</span><span><strong>Outside Dhaka</strong><small>Fee confirmed at order submission</small></span></button>
 <button type="button" aria-pressed={deliveryRegion==='international'} onClick={()=>setDeliveryRegion('international')} className={deliveryRegion==='international'?'selected':''}><span className="anCheckoutRadio">{deliveryRegion==='international'?<Check size={13}/>:null}</span><span><strong>Outside Bangladesh</strong><small>Quote required · ordering unavailable</small></span></button>
 </div>
 {deliveryRegion==='international'&&<p className="anFlowNotice" role="status">International shipping is not configured. Please contact ANUSMITA for a quote.</p>}
 <h3 className="anCheckoutSectionHeading">Payment Method</h3>
 <div className="anCheckoutPaymentOptions"><div aria-disabled="true"><CreditCard size={19}/><span>bKash</span><small>Not connected</small></div><div aria-disabled="true"><Wallet size={19}/><span>Nagad</span><small>Not connected</small></div><div className="selected"><Truck size={19}/><span>Cash on Delivery</span><small>Pay on delivery</small><Check size={15}/></div></div>
 <div className="anCheckoutFormTotal"><strong>Order Summary</strong><span>{state.cart.reduce((n,l)=>n+l.quantity,0)} item(s)</span><div><span>Subtotal</span><b>{money(total)}</b></div><div><span>Delivery</span><b>{extraDelivery?'Confirmed by server':'Included'}</b></div><div className="anCheckoutFormGrand"><span>Product subtotal</span><b>{money(total)}</b></div></div>
 <label className="shoppingConsent anCheckoutConsent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I confirm my details and agree to the applicable terms. COD payment is due on delivery.</label>
 {codError&&<p role="alert" className="error">{codError}</p>}
 {!codEnabled&&<div className="anFlowClosed"><LockKeyhole size={18}/><strong>Checkout preview only</strong><p>Live COD checkout has not been enabled. No customer details will be submitted from this preview.</p></div>}
 <button className="sheetPrimary anFlowButton anCheckoutPlace" type="submit" disabled={!codEnabled||deliveryRegion==='international'||!locationPairValid(codCustomer.district,codCustomer.area)||!consent||codPending||Boolean(loadError)||missing.length>0||unknown}>{codPending?'Submitting…':codEnabled?'Place COD Order':'COD checkout unavailable'} <ArrowRight size={16}/></button>
 <small className="anCheckoutTrust"><ShieldCheck size={13}/> Secure order processing · No advance payment for COD</small>
 </form>}</section>
   <aside className="shoppingSummary anFlowSummary"><h2>Order Summary</h2><p className="anFlowSummaryCaption">{state.cart.reduce((n,l)=>n+l.quantity,0)} item(s) in your bag</p><div><span>{unknown?'Known-price subtotal':'Product subtotal'}</span><strong>{money(total)}</strong></div>
    {unknown&&<p>Some items need a price confirmation and are not included in the subtotal.</p>}
    <div><span>Delivery</span><span>{extraDelivery?'To be confirmed':'Included'}</span></div>
    <p className="anFlowNotice">Shipping and availability are confirmed by our team. No payment is collected in catalogue mode.</p>
    {isCheckout?<><p className="anFlowPaymentLabel">Payment method: <strong>Cash on Delivery</strong></p><p>Complete delivery details in the form on this page.</p><Link href="/cart">Back to cart</Link></>:
     <Link className="sheetPrimary anFlowButton" href="/checkout">Proceed to Checkout <ArrowRight size={16}/></Link>}
    <small>Your selections are saved on this browser.</small>
   </aside></div>)}
  </>}
  {error&&<p role="alert" className="error">{error}</p>}
 </div>;
}
