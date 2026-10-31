"use client";
import Link from "next/link";
import {useState} from "react";
import {ArrowUpRight,ShoppingBag} from "lucide-react";
import {emptyShopping,sanitizeShopping,shoppingKey} from "@/lib/shopping-storage";
export type RecommendedProduct={id:string;slug:string;name:string;brand:string;category:string;image:string|null;pricePaisa:number};
export default function ProductRecommendationCard({product,action}:{product:RecommendedProduct;action:"cart"|"view"}){
 const [message,setMessage]=useState("");
 const href="/products/"+encodeURIComponent(product.slug);
 function add(){
  try{
   const stored=localStorage.getItem(shoppingKey);
   const previous=stored?sanitizeShopping(JSON.parse(stored)):emptyShopping;
   const found=previous.cart.find(item=>item.id===product.id);
   if(found&&found.quantity>=20){setMessage("Maximum 20 per product. Open your bag to adjust.");return;}
   const cart=found?previous.cart.map(item=>item.id===product.id?{...item,quantity:Math.min(20,item.quantity+1)}:item):[...previous.cart,{id:product.id,quantity:1}];
   localStorage.setItem(shoppingKey,JSON.stringify(sanitizeShopping({...previous,cart})));
   window.dispatchEvent(new Event("anusmita-shopping"));
   setMessage("Added to bag");
  }catch{setMessage("Unable to save your bag. Check browser storage settings.");}
 }
 return <article className="anPdpUpsellCard">
  <Link href={href} className="anPdpUpsellImage" aria-label={"View "+product.name}>
   {product.image?<img src={product.image} alt={product.name} loading="lazy"/>:<span>ANUSMITA</span>}
  </Link>
  <div className="anPdpUpsellCopy"><small>{product.brand||product.category||"ANUSMITA"}</small>
   <Link href={href} className="anPdpUpsellName">{product.name}</Link>
   <strong>৳{(product.pricePaisa/100).toLocaleString("en-BD",{minimumFractionDigits:0,maximumFractionDigits:2})}</strong>
   {action==="cart"?<button className="anPdpUpsellButton" type="button" onClick={add}><ShoppingBag size={16}/> Add to Bag</button>:<Link className="anPdpUpsellButton" href={href}>View Product <ArrowUpRight size={16}/></Link>}
   {message&&<p role="status" className="anPdpUpsellNotice">{message}{message==="Added to bag"&&<> · <Link href="/cart">View bag</Link></>}</p>}
  </div>
 </article>;
}
