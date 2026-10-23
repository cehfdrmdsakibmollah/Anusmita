
import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
import {taka} from "@/lib/money";
import {checkoutEnabled} from "@/lib/launch-config";
import ProductImageGallery from "@/components/product-image-gallery";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
async function loadProduct(slug:string){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120||!process.env.MONGODB_URI)return null;
 try{await db();return await Product.findOne({slug,active:true}).select("name slug brand category origin description imageUrls size variantLabel pricePaisa onHand reserved updatedAt").lean<any>();}
 catch{return null;}
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const p=await loadProduct(slug);
 if(!p)return {title:"Product not available",robots:{index:false,follow:false}};
 const title=[p.name,p.brand].filter(Boolean).join(" | ");
 const description=String(p.description||("Shop "+p.name+" from ANUSMITA Bangladesh")).slice(0,155);
 return {title,description,robots:{index:checkoutEnabled(process.env),follow:checkoutEnabled(process.env)},alternates:{canonical:"/products/"+p.slug},
  openGraph:{title,description,type:"website",images:p.imageUrls?.[0]?[{url:p.imageUrls[0],alt:p.name}]:undefined}};
}
export default async function ProductPage({params}:Props){
 const {slug}=await params,p=await loadProduct(slug);if(!p)notFound();
 const available=Math.max(0,p.onHand-p.reserved);
 const base=(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"");
 const structured={
  "@context":"https://schema.org","@type":"Product",name:p.name,
  description:p.description||p.name,sku:p.sku||undefined,brand:p.brand?{"@type":"Brand",name:p.brand}:undefined,
  image:p.imageUrls||[],offers:{"@type":"Offer",priceCurrency:"BDT",price:(p.pricePaisa/100).toFixed(2),
   availability:available>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",
   url:base+"/products/"+p.slug,priceValidUntil:undefined}
 };
 return <div className="container productDetail">
 <p className="eyebrow"><Link href="/">Home</Link> / {p.category} / {p.name}</p>
 <div className="detailGrid"><ProductImageGallery urls={p.imageUrls||[]} name={p.name}/>
 <div className="detailInfo"><p className="eyebrow">{p.origin}{p.brand?" · "+p.brand:""}</p>
 <h1>{p.name}</h1><div className="detailPrice">{taka(p.pricePaisa)}</div>
 <p className="muted">{p.size||p.variantLabel} · {p.category}</p>
 <p>{p.description||"Please contact ANUSMITA for more product information."}</p>
 <p className="muted">{available>0?"Available for ordering":"Currently out of stock"}</p>
 {available>0&&checkoutEnabled(process.env)?<Link href={"/?item="+encodeURIComponent(p.slug)+"#shop"} className="button gold">View in shop & add to bag →</Link>:<Link className="button light" href="/">{checkoutEnabled(process.env)?"Browse other products":"View collection — checkout coming soon"}</Link>}
 <p className="smallprint">Stock, pricing and delivery charges are revalidated at checkout. Payment is not confirmed when an order is placed.</p>
 </div></div>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/>
 </div>;
}
