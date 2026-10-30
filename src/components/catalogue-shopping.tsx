'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Heart,ShoppingBag,Trash2} from 'lucide-react';
import {sheetCatalogue} from '@/lib/sheet-catalogue';
import {emptyShopping,sanitizeShopping,shoppingKey,shoppingSubtotal,type ShoppingState} from '@/lib/shopping-storage';
function read(){try{return sanitizeShopping(JSON.parse(localStorage.getItem(shoppingKey)||'null'))}catch{return emptyShopping}}
function useShopping(){const [state,setState]=useState<ShoppingState>(emptyShopping);const [ready,setReady]=useState(false);const [error,setError]=useState('');useEffect(()=>{const sync=()=>{setState(read());setReady(true)};sync();window.addEventListener('storage',sync);window.addEventListener('anusmita-shopping',sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener('anusmita-shopping',sync)}},[]);function update(fn:(s:ShoppingState)=>ShoppingState){try{const next=sanitizeShopping(fn(read()));localStorage.setItem(shoppingKey,JSON.stringify(next));setState(next);window.dispatchEvent(new Event('anusmita-shopping'));setError('');return true}catch{setError('Your browser could not save this selection. Please enable browser storage and try again.');return false}}return{state,ready,error,update}}
const money=(n:number)=>'৳'+(n/100).toLocaleString('en-BD');
export function ShoppingLinks(){const {state}=useShopping();return <><Link href="/wishlist" aria-label={'Wishlist, '+state.wishlist.length+' saved products'}><Heart size={20}/><small>{state.wishlist.length||''}</small></Link><Link href="/cart" aria-label={'Shopping bag, '+state.cart.reduce((n,l)=>n+l.quantity,0)+' items'}><ShoppingBag size={20}/><small>{state.cart.reduce((n,l)=>n+l.quantity,0)||''}</small></Link></>}
export function ShoppingActions({id,detail=false}:{id:string;detail?:boolean}){const {state,ready,error,update}=useShopping();const [notice,setNotice]=useState('');const router=useRouter();const saved=state.wishlist.includes(id);function add(buy=false){const ok=update(s=>{const old=s.cart.find(l=>l.id===id);return {...s,cart:old?s.cart.map(l=>l.id===id?{...l,quantity:Math.min(20,l.quantity+1)}:l):[...s.cart,{id,quantity:1}]}});if(ok){setNotice('Added to your bag');if(buy)router.push('/checkout')}}return <div className="shoppingActions"><div><button disabled={!ready} className="shoppingAdd" onClick={()=>add()}>Add to cart</button><button disabled={!ready} className="shoppingHeart" aria-label={saved?'Remove from wishlist':'Add to wishlist'} aria-pressed={saved} onClick={()=>update(s=>({...s,wishlist:saved?s.wishlist.filter(x=>x!==id):[...s.wishlist,id]}))}><Heart size={19} fill={saved?'currentColor':'none'}/></button></div>{detail&&<button disabled={!ready} className="shoppingBuy" onClick={()=>add(true)}>Buy now · Confirm with ANUSMITA</button>}<span role="status">{error||notice}{notice&&!error&&<> · <Link href="/cart">View cart</Link></>}</span></div>}
type DisplayProduct={id:string;name:string;slug:string;size:string;image:string;pricePaisa:number|null;deliveryIncluded:boolean;category:string};
const staticProducts:DisplayProduct[]=sheetCatalogue.map(p=>({id:p.id,name:p.name,slug:p.slug,size:p.size,image:p.image,pricePaisa:p.pricePaisa,deliveryIncluded:p.deliveryIncluded,category:p.category}));
export default function ShoppingPage({mode}:{mode:'cart'|'wishlist'|'checkout'}){
 const {state,ready,error,update}=useShopping();
 const [consent,setConsent]=useState(false);
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
 const summary=['Hello ANUSMITA, I would like to request an order:',...lines.map(l=>`${l.id} | ${l.p.name} | ${l.p.size} | Qty ${l.quantity} | ${l.p.pricePaisa===null?'Please confirm price':money(l.p.pricePaisa*l.quantity)}`),`Known-price subtotal: ${money(total)}${unknown?' + items awaiting a price':''}`,'Please confirm availability, sizes, delivery fees, final total and payment options before accepting my order.'].join('\n');
 return <div className="anWide shoppingPage"><p className="anOverline">YOUR ANUSMITA SELECTION</p>
  <h1>{mode==='wishlist'?'Your saved favourites.':isCheckout?'Review your order request.':'Your shopping bag.'}</h1>
  <nav className="shoppingNav"><Link href="/shop">Continue shopping</Link><Link href="/cart">Cart ({state.cart.reduce((n,l)=>n+l.quantity,0)})</Link><Link href="/wishlist">Wishlist ({state.wishlist.length})</Link></nav>
  {!ready||loading?<p role="status">Loading your selection…</p>:<>
   {loadError&&<p className="error" role="alert">{loadError}</p>}
   {missing.length>0&&<p className="notice" role="status">{missing.length} saved product(s) are unavailable or no longer published. They have not been removed from your list.</p>}
   {mode==='wishlist'?(wishlist.length?<div className="sheetGrid">{wishlist.map(p=><article className="sheetCard" key={p.id}>
    <Link href={'/products/'+p.slug}><div className="sheetPhoto">{p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<span>ANUSMITA</span>}</div><div className="sheetCardCopy"><h3>{p.name}</h3><strong>{p.pricePaisa===null?'Confirm price':money(p.pricePaisa)}</strong></div></Link>
    <ShoppingActions id={p.id}/>
   </article>)}</div>:<div className="sheetEmpty"><h2>Your wishlist is waiting.</h2><p>Tap the heart on a product to save it here.</p><Link href="/shop">Explore products →</Link></div>):
   (!lines.length?<div className="sheetEmpty"><h2>Your bag is empty.</h2><Link href="/shop">Find something lovely →</Link></div>:
   <div className="shoppingLayout"><section>{lines.map(({id,quantity,p})=><article className="shoppingLine" key={id}>
    <Link href={'/products/'+p.slug}>{p.image?<img src={p.image} alt={p.name}/>:<span className="shoppingImageFallback">A.</span>}</Link>
    <div><small>{id}</small><h2><Link href={'/products/'+p.slug}>{p.name}</Link></h2><p>{p.size}</p><p>{p.pricePaisa===null?'Price to be confirmed':money(p.pricePaisa)} · Availability confirmed before ordering</p>
     <label>Quantity <input aria-label={'Quantity for '+p.name} type="number" min="1" max="20" value={quantity} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>0&&n<=20)update(s=>({...s,cart:s.cart.map(l=>l.id===id?{...l,quantity:n}:l)}))}}/></label>
     <button className="shoppingRemove" aria-label={'Remove '+p.name} onClick={()=>update(s=>({...s,cart:s.cart.filter(l=>l.id!==id)}))}><Trash2 size={15}/> Remove</button>
    </div><strong>{p.pricePaisa===null?'Confirm price':money(p.pricePaisa*quantity)}</strong>
   </article>)}</section>
   <aside className="shoppingSummary"><h2>{isCheckout?'Order request':'Bag summary'}</h2><div><span>{unknown?'Known-price subtotal':'Product subtotal'}</span><strong>{money(total)}</strong></div>
    {unknown&&<p>Some items need a price confirmation and are not included in the subtotal.</p>}
    <div><span>Delivery</span><span>{extraDelivery?'To be confirmed':'Included'}</span></div>
    <p>Stock is not reserved. We will confirm availability and the final total before accepting your request. No payment is collected here.</p>
    {isCheckout?<><label className="shoppingConsent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I understand this is an order request, not a confirmed purchase.</label>
     {consent?<a className="sheetPrimary" href={'https://wa.me/8801310339192?text='+encodeURIComponent(summary)} target="_blank" rel="noopener noreferrer">Send request on WhatsApp →</a>:<button className="sheetPrimary" disabled>Send request on WhatsApp →</button>}<Link href="/cart">Back to cart</Link></>:
     <Link className="sheetPrimary" href="/checkout">Continue to order request →</Link>}
    <small>Your selections are saved on this browser.</small>
   </aside></div>)}
  </>}
  {error&&<p role="alert" className="error">{error}</p>}
 </div>;
}
