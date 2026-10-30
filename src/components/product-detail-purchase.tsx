
"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ArrowRight,Check,Heart,Minus,Plus,Share2,ShoppingBag} from "lucide-react";
import {isPerfumeCategory,perfumeSizeCards,colourChoices,sizeChoices,type ProductVariant} from "@/lib/product-variants";
import {categoryLabels,unitPrice,assistantHref,productEnquiry,type ProductDetails} from "@/lib/product-experience";
import {emptyShopping,sanitizeShopping,shoppingKey,type ShoppingState} from "@/lib/shopping-storage";
type Props={
 product:ProductVariant&{name:string;category:string;brand:string;description:string;origin:string;size:string;details?:ProductDetails};
 siblings:ProductVariant[];
 canOrder:boolean;
 preview?:boolean;
};
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
export default function ProductDetailPurchase({product,siblings,preview=false}:Props){
 const [qty,setQty]=useState(1),[favourite,setFavourite]=useState(false),[message,setMessage]=useState(""),[gift,setGift]=useState(false),[giftNote,setGiftNote]=useState("");
 const unit=unitPrice(product.pricePaisa,product.size);
 const colours=colourChoices(siblings,product),variants=sizeChoices(siblings,product);
 const help=assistantHref(product.name,preview?undefined:product.slug);
 const enquiry=productEnquiry(product.name,product.slug,product.size,product.color||"",qty,gift?giftNote:"");
 const perfume=isPerfumeCategory(product.category);
 const choices=perfume?perfumeSizeCards(siblings,product):[];
 const maxQty=20;
 const stockText=preview?"Design preview":product.available>0?product.available<=3?`Only ${product.available} confirmed in stock`:"In stock":"Availability to be confirmed";
 function readSelection():ShoppingState {
  try{return sanitizeShopping(JSON.parse(localStorage.getItem(shoppingKey)||"null"))}
  catch{return emptyShopping}
 }
 useEffect(()=>{
  if(preview)return;
  const sync=()=>setFavourite(readSelection().wishlist.includes(product.id));
  sync();
  window.addEventListener("storage",sync);
  window.addEventListener("anusmita-shopping",sync);
  return()=>{window.removeEventListener("storage",sync);window.removeEventListener("anusmita-shopping",sync)};
 },[product.id,preview]);
 function writeSelection(next:ShoppingState){
  const clean=sanitizeShopping(next);
  localStorage.setItem(shoppingKey,JSON.stringify(clean));
  window.dispatchEvent(new Event("anusmita-shopping"));
 }
 function toggleFavourite(){
  if(preview)return;
  try{
   const current=readSelection();
   const saved=current.wishlist.includes(product.id);
   writeSelection({...current,wishlist:saved?current.wishlist.filter(id=>id!==product.id):[...current.wishlist,product.id]});
   setFavourite(!saved);
   setMessage(saved?"Removed from your wishlist":"Added to your wishlist");
  }catch{setMessage("Could not save your wishlist on this device.");}
 }
 function addToCart(){
  if(preview)return;
  try{
   const current=readSelection();
   const old=current.cart.find(l=>l.id===product.id);
   const quantity=Math.min(20,(old?.quantity||0)+qty);
   const next=old?current.cart.map(l=>l.id===product.id?{...l,quantity}:l):[...current.cart,{id:product.id,quantity:qty}];
   writeSelection({...current,cart:next});
   setMessage("Added to bag — availability and final total will be confirmed before ordering.");
  }catch{setMessage("Unable to save your bag. Enable browser storage and try again.");}
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
  </div>:variants.length>0?<div className="pd-size-options"><strong>{categoryLabels(product.category).size}</strong><div>{variants.map(v=><Link key={v.id} href={'/products/'+v.slug} aria-current={v.id===product.id?'page':undefined} className={v.id===product.id?'selected':''}><b>{v.size||'Standard'}</b><span>{money(v.pricePaisa)}</span>{v.available===0&&<small>Out of stock</small>}</Link>)}</div></div>:null}
  {product.details?.sizeGuide&&<details className="pd-guide"><summary>Size guide & measurements</summary><p>{product.details.sizeGuide}</p><small>Compare with your measurements; sizing differs by brand.</small></details>}
  {siblings.length>0&&<details className="pd-guide"><summary>Compare published variants</summary><div className="pd-table-wrap"><table><thead><tr><th>Option</th><th>Price</th><th>Available</th></tr></thead><tbody>{[product,...siblings].map(v=><tr key={v.id}><td><Link href={'/products/'+v.slug}>{[v.color,v.size].filter(Boolean).join(' · ')||v.sku}</Link></td><td>{money(v.pricePaisa)}</td><td>{v.available}</td></tr>)}</tbody></table></div></details>}

  <div className="anPdpPurchaseMeta">
   <div className="anPdpQtyGroup"><label>Quantity</label><div className="anPdpCounter">
    <button type="button" onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={qty<=1||preview} aria-label="Reduce quantity"><Minus size={16}/></button>
    <span aria-live="polite">{qty}</span>
    <button type="button" onClick={()=>setQty(q=>Math.min(maxQty,q+1))} disabled={qty>=maxQty||preview} aria-label="Increase quantity"><Plus size={16}/></button>
   </div></div>
   <div className={"anPdpAvailability"+(product.available>0&&!preview?" inStock":"")}>
    <span className="anPdpStockDot"/>{stockText}
   </div>
  </div>
  <div className="anPdpButtons">
   <button className={"anPdpAdd"+(preview?" disabled":"")} disabled={preview} onClick={addToCart} type="button"><ShoppingBag size={19}/>{preview?"Preview only":"Add to Bag"} <ArrowRight size={17}/></button>
   <button className={"anPdpWish"+(favourite?" active":"")} type="button" onClick={toggleFavourite} disabled={preview} aria-pressed={favourite}><Heart size={19} fill={favourite?"currentColor":"none"}/>{favourite?"Saved":"Wishlist"}</button>
   <button className="anPdpShare" type="button" onClick={()=>void share()} aria-label="Copy product URL"><Share2 size={18}/></button>
  </div>
  {!preview&&<p className="anPdpFeedback" role="status">Catalogue request mode: adding an item does not reserve stock or place an order. <Link href="/cart">Review your bag →</Link></p>}
  {!preview&&<p className="pd-subtotal">Product subtotal <strong>{money(product.pricePaisa*qty)}</strong><small>Delivery calculated separately.</small></p>}
  <div className="pd-help"><Link href={help}>Ask ANUSMITA about this product →</Link><a href={enquiry} target="_blank" rel="noopener noreferrer">Enquire on WhatsApp ↗</a></div>
  <details className="pd-guide"><summary>Sending a gift?</summary><label><input type="checkbox" checked={gift} onChange={e=>setGift(e.target.checked)}/> Include a gift request in my WhatsApp enquiry</label>{gift&&<><textarea aria-label="Gift request" placeholder="Gift message or packaging request" value={giftNote} maxLength={250} onChange={e=>setGiftNote(e.target.value)}/><small>Our team will confirm packaging availability and cost. This request is sent only when you send the WhatsApp draft.</small></>}</details>
  <div className="pd-mobile-bar"><div><strong>{product.name}</strong><span>{preview?'Design preview':money(product.pricePaisa)}</span></div>{!preview?<button onClick={addToCart}>Add to Bag</button>:<Link href={help}>Ask ANUSMITA</Link>}</div>
  {message&&<p className="anPdpFeedback" role="status">{message}</p>}
  <div className="anPdpPurchaseNotes">
   <p><Check size={15}/> Independently priced sizes</p>
   <p><Check size={15}/> Availability checked before order confirmation</p>
  </div>
  <Link className="anPdpBrowse" href="/#shop">Continue exploring ANUSMITA <ArrowRight size={17}/></Link>
 </div>;
}
