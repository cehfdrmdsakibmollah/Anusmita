import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {CatalogCategory,Product} from "@/lib/models";
import {categorySeoMetadata,isCategorySeoSlug} from "@/lib/category-seo";
import {checkoutEnabled} from "@/lib/launch-config";
import {safeSeoJsonLd} from "@/lib/product-seo-structured";
import "./category-seo.css";
export const dynamic="force-dynamic";
export const runtime="nodejs";
type Props={params:Promise<{slug:string}>,searchParams:Promise<{page?:string}>};
type Category={name:string;slug:string;seoTitle?:string;seoDescription?:string;description?:string;active:boolean};
async function findCategory(slug:string):Promise<Category|null>{
 if(!isCategorySeoSlug(slug)||!process.env.MONGODB_URI)return null;
 try{await db();return await CatalogCategory.findOne({slug,active:true}).select("name slug seoTitle seoDescription description active -_id").lean<Category|null>();}
 catch{return null;}
}
const published=(name:string)=>({category:name,active:true,archived:{$ne:true}});
export async function generateMetadata({params,searchParams}:Props):Promise<Metadata>{
 const {slug}=await params;const category=await findCategory(slug);
 if(!category)return {title:"Collection unavailable",robots:{index:false,follow:false}};
 let count=0;try{count=await Product.countDocuments(published(category.name));}catch{/* remain noindex */ }
 const query=await searchParams;const page=/^[1-9]\d{0,3}$/.test(query.page||"")?Number(query.page):1;
 const meta=categorySeoMetadata(category);
 const canonical=meta.canonical+(page>1?"?page="+page:"");
 const index=checkoutEnabled(process.env)&&count>0;
 return {title:meta.title,description:meta.description,
  alternates:{canonical},robots:{index,follow:true},
  openGraph:{type:"website",title:meta.title,description:meta.description,url:canonical}};
}
export default async function CategorySeoPage({params,searchParams}:Props){
 const {slug}=await params;const category=await findCategory(slug);
 if(!category)notFound();
 const query=await searchParams;const requested=/^[1-9]\d{0,3}$/.test(query.page||"")?Number(query.page):1;
 const perPage=12;
 let count=0,items:{slug:string;name:string;brand?:string;imageUrls?:string[];pricePaisa:number}[]=[];
 let failed=false;
 try{
  count=await Product.countDocuments(published(category.name));
  const page=Math.min(Math.max(1,requested),Math.max(1,Math.ceil(count/perPage)));
  items=await Product.find(published(category.name)).select("slug name brand imageUrls pricePaisa -_id")
   .sort({createdAt:-1,_id:-1}).skip((page-1)*perPage).limit(perPage).lean<any[]>();
 }catch{failed=true;}
 const pages=Math.max(1,Math.ceil(count/perPage)),page=Math.min(Math.max(1,requested),pages);
 const meta=categorySeoMetadata(category);
 const path=meta.canonical||"/shop";
 const price=(paisa:number)=>new Intl.NumberFormat("en-BD",{style:"currency",currency:"BDT"}).format((paisa||0)/100);
 const root=(process.env.NEXT_PUBLIC_SITE_URL||"https://anusmita.netlify.app").replace(/\/$/,"");
 const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[
  {"@type":"ListItem",position:1,name:"Home",item:root+"/"},
  {"@type":"ListItem",position:2,name:"Shop",item:root+"/shop"},
  {"@type":"ListItem",position:3,name:category.name,item:root+path}
 ]};
 return <div className="anCategorySeo">
  <div className="anCategorySeo-inner">
   <nav aria-label="Breadcrumb" className="anCategorySeo-crumb"><Link href="/">Home</Link><span>›</span><Link href="/shop">Shop</Link><span>›</span><span>{category.name}</span></nav>
   <header className="anCategorySeo-hero"><span>THE ANUSMITA COLLECTIONS</span><h1>{category.name}</h1><p>{category.description?.trim()||meta.description}</p><div>{count} real products in this collection</div></header>
   <div className="anCategorySeo-head"><h2>Discover {category.name}</h2><Link href="/shop">Explore all products →</Link></div>
   {failed?<div className="anCategorySeo-empty" role="status">The collection is temporarily unavailable. Please try again.</div>:items.length?
    <div className="anCategorySeo-grid">{items.map(p=><article className="anCategorySeo-card" key={p.slug}>
     <Link href={"/products/"+encodeURIComponent(p.slug)} aria-label={"View "+p.name}>
      <div className="anCategorySeo-image">{p.imageUrls?.[0]?<img src={p.imageUrls[0]} alt={p.name} loading="lazy"/>:<div className="anCategorySeo-placeholder">ANUSMITA</div>}</div>
      <div className="anCategorySeo-copy"><small>{p.brand||"ANUSMITA"}</small><h3>{p.name}</h3><strong>{price(p.pricePaisa)}</strong><span>View product →</span></div>
     </Link>
    </article>)}</div>:
    <div className="anCategorySeo-empty">No currently published products in this collection. <Link href="/shop">Browse all products</Link>.</div>}
   {pages>1&&<nav className="anCategorySeo-pages" aria-label="Collection pagination">
    {page>1&&<Link href={path+(page>2?"?page="+(page-1):"")}>← Previous</Link>}
    <span>Page {page} of {pages}</span>
    {page<pages&&<Link href={path+"?page="+(page+1)}>Next →</Link>}
   </nav>}
  </div>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeSeoJsonLd(breadcrumb)}}/>
 </div>;
}
