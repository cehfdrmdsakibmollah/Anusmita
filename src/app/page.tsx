
import { db } from "@/lib/db";
import { Product } from "@/lib/models";
import Storefront from "@/components/storefront";
import {checkoutEnabled} from "@/lib/launch-config";
export const dynamic="force-dynamic";
export default async function Home({searchParams}:{searchParams:Promise<{item?:string}>}){
 const queryItem=(await searchParams).item||"";
 let products:any[]=[];
 let configured=Boolean(process.env.MONGODB_URI);
 if(configured) {
  try{
   await db();
   const data=await Product.find({active:true}).select("name slug sku brand category origin imageUrls size variantLabel pricePaisa onHand reserved").sort({createdAt:-1}).limit(48).lean();
   if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(queryItem) && !data.some((p:any)=>p.slug===queryItem)) {
    const additional=await Product.findOne({active:true,slug:queryItem}).select("name slug sku brand category origin imageUrls size variantLabel pricePaisa onHand reserved").lean<any>();
    if(additional)data.unshift(additional);
   }
   products=data.map((p:any)=>({id:String(p._id),name:p.name,slug:p.slug,brand:p.brand,category:p.category,origin:p.origin,image:p.imageUrls[0]||"",size:p.size,pricePaisa:p.pricePaisa,available:Math.max(0,p.onHand-p.reserved)}));
  }catch{configured=false;}
 }
 return <>
 <section className="hero"><div><p className="eyebrow">The ANUSMITA Edit · Bangladesh</p><h1>Everyday<br/>made <i>beautiful.</i></h1>
 <p>Explore a thoughtful curation of fashion, jewellery and beauty essentials — inspired by discoveries from Japan, Korea, China and beyond.</p>
 <a className="button" href="#shop">Explore the collection →</a></div><div className="heroVisual" aria-hidden="true"><div className="decor">✧</div><div className="decorText">ANUSMITA COLLECTION</div></div></section>
 <div className="container"><div className="sectionHead" id="collections"><div><p className="eyebrow">Selected with care</p><h2>Shop by collection</h2></div></div>
 <div className="categoryGrid"><a className="categoryCard" href="#shop"><span>✧</span><span>Beauty</span></a><a className="categoryCard" href="#shop"><span>◇</span><span>Jewellery</span></a><a className="categoryCard" href="#shop"><span>✿</span><span>Fashion</span></a><a className="categoryCard" href="#shop"><span>✦</span><span>Accessories</span></a></div>
 <div className="sectionHead" id="shop"><div><p className="eyebrow">Our latest selection</p><h2>Discover the products</h2></div><p>Prices in Bangladeshi Taka</p></div>
 {!configured&&<div className="notice">The store is being configured. The product catalogue will appear after MongoDB setup and owner approval.</div>}
 {!checkoutEnabled(process.env)&&<div className="notice"><strong>Catalog preview:</strong> ANUSMITA is preparing for launch. Checkout is not accepting orders yet.</div>}
 <Storefront products={products} canOrder={configured&&checkoutEnabled(process.env)}/>
 <section className="story" id="our-story"><h2>Thoughtfully curated.<br/>Made for you.</h2><p>ANUSMITA brings together fashion, jewellery and beauty collections in one destination for Bangladesh. Every published item includes its real price and available stock; orders are subject to confirmation and delivery arrangements.</p></section></div>
 </>;
}
