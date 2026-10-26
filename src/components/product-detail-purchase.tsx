
"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowRight,Check,Heart,Minus,Plus,Share2,ShoppingBag} from "lucide-react";
import {isPerfumeCategory,perfumeSizeCards,colourChoices,sizeChoices,type ProductVariant} from "@/lib/product-variants";
import {categoryLabels,unitPrice,assistantHref,productEnquiry,type ProductDetails} from "@/lib/product-experience";
type Props={
 product:ProductVariant&{name:string;category:string;brand:string;description:string;origin:string;size:string;details?:ProductDetails};
 siblings:ProductVariant[];
 canOrder:boolean;
 preview?:boolean;
};
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
export default function ProductDetailPurchase({product,siblings,canOrder,preview=false}:Props){
 const [qty,setQty]=useState(1),[favourite,setFavourite]=useState(false),[message,setMessage]=useState(""),[gift,setGift]=useState(false),[giftNote,setGiftNote]=useState("");
 const unit=unitPrice(product.pricePaisa,product.size);
 const colours=colourChoices(siblings,product),variants=sizeChoices(siblings,product);
 const help=assistantHref(product.name,preview?undefined:product.slug);
 const enquiry=productEnquiry(product.name,product.slug,product.size,product.color||"",qty,gift?giftNote:"");
 const perfume=isPerfumeCategory(product.category);
 const choices=perfume?perfumeSizeCards(siblings,product):[];
 const maxQty=Math.min(20,Math.max(0,product.available));
 useEffect(()=>{
  if(preview)return;
  try{
   const saved=JSON.parse(localStorage.getItem("anusmita-wishlist-v1")||"[]");
   setFavourite(Array.isArray(saved)&&saved.includes(product.id));
  }catch{}
 },[product.id,preview]);
 function toggleFavourite(){
  if(preview)return;
  try{
   const stored=JSON.parse(localStorage.getItem("anusmita-wishlist-v1")||"[]");
   const saved:string[]=Array.isArray(stored)?stored.filter((x):x is string=>typeof x==="string"):[];
   const next=favourite?saved.filter(id=>id!==product.id):Array.from(new Set([...saved,product.id]));
   localStorage.setItem("anusmita-wishlist-v1",JSON.stringify(next.slice(-100)));
   setFavourite(!favourite);
   setMessage(favourite?"Removed from saved products":"Saved to your wishlist on this device");
  }catch{setMessage("Your browser did not allow saving your wishlist");}
 }
 function addToCart(){
  if(!canOrder||preview||maxQty===0)return;
  try{
   const data=JSON.parse(localStorage.getItem("anusmita-cart-v1")||"[]");
   const lines:Array<{id:string;quantity:number}>=Array.isArray(data)?data.filter((x:any)=>typeof x.id==="string"&&Number.isInteger(x.quantity)&&x.quantity>0):[];
   const found=lines.find(x=>x.id===product.id);
   if(found)found.quantity=Math.min(maxQty,found.quantity+qty);
   else lines.push({id:product.id,quantity:qty});
   localStorage.setItem("anusmita-cart-v1",JSON.stringify(lines.slice(-30)));
   // Checkout, availability and prices are revalidated by the existing shop.
   window.location.assign("/?item="+encodeURIComponent(product.slug)+"#shop");
  }catch{setMessage("Could not save the bag. Please retry from the collection page.");}
 }
 async function share(){
  const link=window.location.href;
  try{await navigator.clipboard.writeText(link);setMessage("Product link copied");}
  catch{setMessage("Copy this URL to share: "+link);}
 }
 return <div className="anPdpBuy">
  <div className="anPdpOverline">{product.brand||"ANUSMITA"} <span> / </span> {product.category}</div>
  <h1>{product.name}</h1>
  {preview?<div className="anPdpDemoPrice"><strong>Pricing available soon</strong><span>Demonstration product · no price or discount displayed</span></div>:
   <p className="anPdpPrice">{money(product.pricePaisa)}
    <span className="anPdpPriceCaption">BDT · exact price for selected size</span></p>}
  {!preview&&unit&&<p className="pd-unit">{money(unit.paisa)} / {unit.unit}</p>}
  {product.description?<p className="anPdpDescription">{product.description}</p>:
   <p className="anPdpDescription">Thoughtfully selected for the ANUSMITA collection. Please check the product details and available sizes.</p>}
  {colours.length>0&&<fieldset className="pd-colours"><legend>Colour / shade: <strong>{product.color}</strong></legend><div>{colours.map(c=><Link key={c.color} href={'/products/'+c.slug} aria-current={c.selected?'page':undefined} className={c.selected?'selected':''}>{/^#[0-9a-f]{6}$/i.test(c.hex)&&<i style={{background:c.hex}}/>}{c.color}</Link>)}</div></fieldset>}
  {perfume?<div className="anPdpVariantArea">
   <div className="anPdpOptionLabel"><strong>Size</strong><span>2ml Spray · 5ml · 10ml · 15ml · 50ml · 100ml</span></div>
   <div className="anPdpSizeGrid">
    {choices.map(size=>preview?<div key={size.key} className={"anPdpSizeCard unavailable"+(size.selected?" selected":"")} aria-label={size.label+" design preview"}>
    <strong>{size.label}</strong><span>Design only</span></div>:size.slug?<Link href={"/products/"+size.slug} key={size.key} aria-current={size.selected?"page":undefined}
      className={"anPdpSizeCard"+(size.selected?" selected":"")}>
     <strong>{size.label}</strong><span>{size.pricePaisa===null?"Price on request":money(size.pricePaisa)}</span>
     {size.available===0&&<small>Out of stock</small>}
    </Link>:<div key={size.key} className="anPdpSizeCard unavailable" aria-label={size.label+" not listed"}>
     <strong>{size.label}</strong><span>Not listed</span></div>)}
   </div>
   {!preview&&<p className="anPdpSizeHelp">Size prices are shown only when that specific size is published in the catalogue.</p>}
  </div>:<div className="pd-size-options"><strong>{categoryLabels(product.category).size}</strong><div>{variants.map(v=><Link key={v.id} href={'/products/'+v.slug} aria-current={v.id===product.id?'page':undefined} className={v.id===product.id?'selected':''}><b>{v.size||'Standard'}</b><span>{money(v.pricePaisa)}</span>{v.available===0&&<small>Out of stock</small>}</Link>)}</div></div>}
  {product.details?.sizeGuide&&<details className="pd-guide"><summary>Size guide & measurements</summary><p>{product.details.sizeGuide}</p><small>Compare with your measurements; sizing differs by brand.</small></details>}
  {siblings.length>0&&<details className="pd-guide"><summary>Compare published variants</summary><div className="pd-table-wrap"><table><thead><tr><th>Option</th><th>Price</th><th>Available</th></tr></thead><tbody>{[product,...siblings].map(v=><tr key={v.id}><td><Link href={'/products/'+v.slug}>{[v.color,v.size].filter(Boolean).join(' · ')||v.sku}</Link></td><td>{money(v.pricePaisa)}</td><td>{v.available}</td></tr>)}</tbody></table></div></details>}

  <div className="anPdpPurchaseMeta">
   <div className="anPdpQtyGroup"><label>Quantity</label><div className="anPdpCounter">
    <button type="button" onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={qty<=1||maxQty===0||preview} aria-label="Reduce quantity"><Minus size={16}/></button>
    <span aria-live="polite">{qty}</span>
    <button type="button" onClick={()=>setQty(q=>Math.min(maxQty,q+1))} disabled={qty>=maxQty||preview} aria-label="Increase quantity"><Plus size={16}/></button>
   </div></div>
   <div className={"anPdpAvailability"+(product.available>0&&!preview?" inStock":"")}>
    <span className="anPdpStockDot"/>{preview?"Design preview only":product.available>0?"In stock":"Currently out of stock"}
   </div>
  </div>
  <div className="anPdpButtons">
   {canOrder&&!preview&&product.available>0?<button className="anPdpAdd" onClick={addToCart} type="button"><ShoppingBag size={19}/> Add to Bag <ArrowRight size={17}/></button>:
    <button className="anPdpAdd disabled" disabled type="button"><ShoppingBag size={19}/>{preview?"Add to Cart · Preview only":!canOrder?"Checkout opening soon":"Currently unavailable"}</button>}
   <button className={"anPdpWish"+(favourite?" active":"")} type="button" onClick={toggleFavourite} disabled={preview}
    aria-pressed={favourite}><Heart size={19} fill={favourite?"currentColor":"none"}/>{favourite?"Saved":"Wishlist"}</button>
   <button className="anPdpShare" type="button" onClick={()=>void share()} aria-label="Copy product URL"><Share2 size={18}/></button>
  </div>
  {!preview&&<p className="pd-subtotal">Product subtotal <strong>{money(product.pricePaisa*qty)}</strong><small>Delivery calculated separately.</small></p>}
  <div className="pd-help"><Link href={help}>Ask ANUSMITA about this product →</Link><a href={enquiry} target="_blank" rel="noopener noreferrer">{product.available===0?'Ask about availability on WhatsApp':'Enquire on WhatsApp'} ↗</a></div>
  <details className="pd-guide"><summary>Sending a gift?</summary><label><input type="checkbox" checked={gift} onChange={e=>setGift(e.target.checked)}/> Include a gift request in my WhatsApp enquiry</label>{gift&&<><textarea aria-label="Gift request" placeholder="Gift message or packaging request" value={giftNote} maxLength={250} onChange={e=>setGiftNote(e.target.value)}/><small>Our team will confirm packaging availability and cost. This request is sent only when you send the WhatsApp draft.</small></>}</details>
  <div className="pd-mobile-bar"><div><strong>{product.name}</strong><span>{preview?'Design preview':money(product.pricePaisa)}</span></div>{canOrder&&!preview&&maxQty>0?<button onClick={addToCart}>Add to Bag</button>:<Link href={help}>Ask ANUSMITA</Link>}</div>
  {message&&<p className="anPdpFeedback" role="status">{message}</p>}
  <div className="anPdpPurchaseNotes">
   <p><Check size={15}/> Independently priced sizes</p>
   <p><Check size={15}/> Authentic published stock information</p>
  </div>
  <Link className="anPdpBrowse" href="/#shop">Continue exploring ANUSMITA <ArrowRight size={17}/></Link>
 </div>;
}
