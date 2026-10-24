
import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowRight,ArrowUpRight,Heart,Package,ShieldCheck,Sparkles,Truck} from "lucide-react";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
import {checkoutEnabled} from "@/lib/launch-config";
import {isPerfumeCategory,shouldListGroup,type ProductVariant} from "@/lib/product-variants";
import ProductImageGallery from "@/components/product-image-gallery";
import ProductDetailPurchase from "@/components/product-detail-purchase";
import ProductDetailsAccordion from "@/components/product-details-accordion";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
type DbProduct={
 _id:any;name:string;slug:string;sku:string;brand:string;category:string;origin:string;
 description:string;imageUrls:string[];size:string;variantLabel:string;variantGroup:string;
 pricePaisa:number;onHand:number;reserved:number;ingredients:string;usageInstructions:string;
 topNotes:string;heartNotes:string;baseNotes:string
};
const projection="name slug sku brand category origin description imageUrls size variantLabel variantGroup pricePaisa onHand reserved ingredients usageInstructions topNotes heartNotes baseNotes";
const previewProduct:DbProduct={
 _id:"preview",name:"Radiance Eau de Parfum — Design Preview",slug:"design-preview",
 sku:"",brand:"ANUSMITA",category:"Perfumes",origin:"Other",description:"An illustration of the ANUSMITA perfume product page design. This is not a published product or an offer for sale.",
 imageUrls:["/brand/categories/perfumes.webp","/brand/hero-reference.webp"],
 size:"100ml",variantLabel:"100ml",variantGroup:"",pricePaisa:0,onHand:0,reserved:0,
 ingredients:"",usageInstructions:"",topNotes:"",heartNotes:"",baseNotes:""
};
const shortSlug=(slug:string)=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=120;
async function getProduct(slug:string):Promise<DbProduct|null>{
 if(!shortSlug(slug))return null;
 if(slug==="design-preview")return previewProduct;
 if(!process.env.MONGODB_URI)return null;
 try{
  await db();
  return await Product.findOne({slug,active:true}).select(projection).lean<DbProduct>();
 }catch{return null;}
}
const variant=(p:DbProduct):ProductVariant=>({
 id:String(p._id),slug:p.slug,sku:p.sku||"",size:p.size||p.variantLabel||"",
 pricePaisa:p.pricePaisa,available:Math.max(0,(p.onHand||0)-(p.reserved||0))
});
async function supporting(p:DbProduct){
 if(p.slug==="design-preview")return {variants:[] as ProductVariant[],related:[] as DbProduct[]};
 try{
  const category=String(p.category);
  const linked=shouldListGroup(p.variantGroup)&&isPerfumeCategory(category);
  const [siblings,related]=await Promise.all([
   linked?Product.find({
    active:true,variantGroup:p.variantGroup,brand:p.brand,category,
    _id:{$ne:p._id}
   }).select(projection).limit(30).lean<DbProduct[]>():Promise.resolve([] as DbProduct[]),
   Product.find({
    active:true,category,
    _id:{$ne:p._id},
    ...(linked?{variantGroup:{$ne:p.variantGroup}}:{})
   }).select(projection).sort({createdAt:-1}).limit(6).lean<DbProduct[]>()
  ]);
  return {variants:siblings.map(variant),related};
 }catch{return {variants:[] as ProductVariant[],related:[] as DbProduct[]};}
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const p=await getProduct(slug);
 if(!p)return {title:"Product not available",robots:{index:false,follow:false}};
 const isPreview=slug==="design-preview";
 const title=isPreview?"Product details design preview":p.name;
 const description=String(p.description||("Discover "+p.name+" at ANUSMITA Bangladesh")).slice(0,155);
 return {title,description,robots:{
  index:!isPreview&&checkoutEnabled(process.env),
  follow:!isPreview&&checkoutEnabled(process.env)
 },alternates:{canonical:"/products/"+slug},
  openGraph:{title,description,type:"website",
   images:!isPreview&&p.imageUrls?.[0]?[{url:p.imageUrls[0],alt:p.name}]:undefined}};
}
const money=(n:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format(n/100);
const sampleCollections=[
 {title:"Skincare",image:"/brand/categories/skincare.webp",href:"/?category=Skincare#shop"},
 {title:"Beauty",image:"/brand/categories/beauty.webp",href:"/?category=Beauty#shop"},
 {title:"Watches",image:"/brand/categories/watches.webp",href:"/?category=Watches#shop"},
 {title:"Bags",image:"/brand/categories/bags.webp",href:"/?category=Bags#shop"}
];
export default async function ProductPage({params}:Props){
 const {slug}=await params,p=await getProduct(slug);
 if(!p)notFound();
 const preview=slug==="design-preview";
 const {variants,related}=await supporting(p);
 const stock=Math.max(0,(p.onHand||0)-(p.reserved||0));
 const canOrder=!preview&&checkoutEnabled(process.env);
 const url=(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"")+"/products/"+p.slug;
 const structured=preview?null:{
  "@context":"https://schema.org","@type":"Product",name:p.name,
  sku:p.sku||undefined,description:p.description||p.name,
  brand:p.brand?{"@type":"Brand",name:p.brand}:undefined,
  image:p.imageUrls||[],offers:{
   "@type":"Offer",priceCurrency:"BDT",price:(p.pricePaisa/100).toFixed(2),
   availability:stock>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",url
  }
 };
 return <div className="anPdp">
  <div className="anWide">
   {preview&&<div className="anPdpPreviewAlert" role="status"><Sparkles size={19}/>
    <span><strong>Design preview:</strong> This page demonstrates the layout using editorial artwork. No real product, price, inventory or orders are displayed.</span>
   </div>}
   <nav aria-label="Breadcrumb" className="anPdpBreadcrumb">
    <Link href="/">Home</Link><span>›</span><Link href="/#collections">Shop</Link><span>›</span>
    <Link href={"/?category="+encodeURIComponent(p.category)+"#shop"}>{p.category}</Link><span>›</span><strong>{p.name}</strong>
   </nav>
   <div className="anPdpMain">
    <ProductImageGallery urls={p.imageUrls||[]} name={p.name}/>
    <ProductDetailPurchase key={p.slug} product={{
     ...variant(p),name:p.name,category:p.category,brand:p.brand,description:p.description,origin:p.origin
    }} siblings={variants} canOrder={canOrder} preview={preview}/>
   </div>
   <div className="anPdpTrust" aria-label="What to know before ordering">
    <div><Sparkles size={25}/><span><strong>Thoughtfully selected</strong><small>The ANUSMITA edit</small></span></div>
    <div><Package size={25}/><span><strong>Size-specific SKUs</strong><small>Actual price per size</small></span></div>
    <div><ShieldCheck size={25}/><span><strong>Stock transparency</strong><small>Availability checked</small></span></div>
    <div><Truck size={25}/><span><strong>Bangladesh</strong><small>Delivery details at checkout</small></span></div>
   </div>
   <ProductDetailsAccordion product={{
    description:p.description,ingredients:p.ingredients,usageInstructions:p.usageInstructions,
    topNotes:p.topNotes,heartNotes:p.heartNotes,baseNotes:p.baseNotes,
    brand:p.brand,origin:p.origin,size:p.size||p.variantLabel,category:p.category,sku:p.sku
   }}/>
   {(related.length>0||preview)&&<section className="anPdpRelated" aria-label="Explore related collections">
    <div className="anPdpRelatedTitle"><div><span className="anPdpOverline">MORE TO EXPLORE</span>
      <h2>{preview?"Discover more ANUSMITA collections":"You may also like"}</h2></div>
     <Link href="/#shop">Explore all <ArrowRight size={18}/></Link></div>
    <div className="anPdpRelatedGrid">
     {preview?sampleCollections.map(item=><Link href={item.href} className="anPdpRelatedCard" key={item.title}>
      <div className="anPdpRelatedImage"><img src={item.image} alt="" loading="lazy"/><span className="anPdpRelatedArrow"><ArrowUpRight size={19}/></span></div>
      <div className="anPdpRelatedCopy"><small>ANUSMITA COLLECTION</small><h3>{item.title}</h3><span>Explore category</span></div>
     </Link>):related.map(item=><Link key={String(item._id)} href={"/products/"+item.slug} className="anPdpRelatedCard">
      <div className="anPdpRelatedImage">{item.imageUrls?.[0]?<img src={item.imageUrls[0]} alt={item.name} loading="lazy"/>:<div className="anPdpRelatedBlank">ANUSMITA</div>}
       <span className="anPdpRelatedArrow"><ArrowUpRight size={19}/></span>
      </div>
      <div className="anPdpRelatedCopy"><small>{item.brand||item.category}</small><h3>{item.name}</h3>
       <strong>{money(item.pricePaisa)}</strong></div>
     </Link>)}
    </div>
   </section>}
  </div>
  <section className="anPdpBrandBanner">
   <div className="anWide anPdpBrandBannerInner">
    <div><span>BEAUTY · FASHION · LIFESTYLE</span><h2>Turn everyday moments<br/>into <em>beautiful memories.</em></h2>
     <Link href="/#collections" className="anPdpBrandButton">Explore ANUSMITA <ArrowUpRight size={16}/></Link></div>
    <div className="anPdpBrandArt"><img src="/brand/hero-reference.webp" alt="ANUSMITA curated collections" loading="lazy"/></div>
   </div>
  </section>
  <section className="anPdpPromise"><Heart size={20}/><span><strong>The ANUSMITA Promise</strong><small>Thoughtful choices, beautiful discoveries, made for you.</small></span></section>
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{
   __html:JSON.stringify(structured).replace(/</g,"\\u003c")
  }}/>}
 </div>;
}
