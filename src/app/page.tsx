import {selectCatalogue} from '@/lib/sheet-catalogue';
import {CatalogueCard} from '@/components/sheet-catalogue';
import Link from "next/link";
import HomepageDiscover from "@/components/homepage-discover";

import {ArrowRight,ArrowUpRight,Heart,Package,ShieldCheck,Sparkles,Truck} from "lucide-react";
import {db} from "@/lib/db";
import {Product,HomePage,Order} from "@/lib/models";
import {checkoutEnabled} from "@/lib/launch-config";
import {homeStarterBlocks,homeStarterSections,publicBlocks,type HomeBlock,type HomeSection} from "@/lib/home-content";
import HomepageCarousel from "@/components/homepage-carousel";
import HomepageMotion from "@/components/homepage-motion";
import HomepagePromotion from "@/components/homepage-promotion";
import HomepageFeatured,{type FeaturedShelf,type FeaturedProduct} from "@/components/homepage-featured";
import Storefront from "@/components/storefront";
export const dynamic="force-dynamic";
type ShopProduct=FeaturedProduct&{origin:string};
const format=(p:any):ShopProduct=>({id:String(p._id),name:p.name,slug:p.slug,brand:p.brand||"",
 category:p.category,origin:p.origin||"Other",image:p.imageUrls?.[0]||"",size:p.size||p.variantLabel||"",
 pricePaisa:p.pricePaisa,available:Math.max(0,(p.onHand||0)-(p.reserved||0))});
export default async function Home({searchParams}:{searchParams:Promise<{item?:string}>}){
 const queryItem=(await searchParams).item||"";
 let configured=false,products:ShopProduct[]=[],shelves:FeaturedShelf[]=[];
 let blocks:HomeBlock[]=homeStarterBlocks;
 let sections:HomeSection[]=homeStarterSections;
 if(process.env.MONGODB_URI)try{
  await db();configured=true;
  const [settings,data]=await Promise.all([
   HomePage.findOne({key:"main"}).lean<any>(),
   Product.find({active:true}).select("name slug brand category origin imageUrls size variantLabel pricePaisa onHand reserved")
    .sort({createdAt:-1}).limit(48).lean<any[]>()
  ]);
  if(settings){
   blocks=settings.blocks as HomeBlock[];
   sections=settings.sections as HomeSection[];
  }
  if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(queryItem)&&!data.some(p=>p.slug===queryItem)){
   const item=await Product.findOne({active:true,slug:queryItem}).select("name slug brand category origin imageUrls size variantLabel pricePaisa onHand reserved").lean<any>();
   if(item)data.unshift(item);
  }
  products=data.map(format) as ShopProduct[];
  const allChosen=[...new Set(sections.flatMap(s=>s.productIds||[]))].filter(x=>/^[0-9a-f]{24}$/i.test(x)).slice(0,120);
  const additional=allChosen.length?await Product.find({active:true,_id:{$in:allChosen}})
   .select("name slug brand category origin imageUrls size variantLabel pricePaisa onHand reserved").lean<any[]>():[];
  const lookup=new Map([...data,...additional].map(p=>[String(p._id),format(p)]));
  let actualBestIds:string[]=[];
  if(sections.some(s=>s.enabled&&s.key==="best_sellers"&&s.productIds.length===0)){
   const sold=await Order.aggregate([
    {$match:{orderStatus:"delivered",isTest:{$ne:true}}},
    {$unwind:"$lines"},
    {$group:{_id:"$lines.productId",sold:{$sum:"$lines.quantity"}}},
    {$sort:{sold:-1}},{$limit:16}
   ]);
   actualBestIds=sold.map(x=>String(x._id));
   const missing=actualBestIds.filter(id=>!lookup.has(id));
   if(missing.length){
    const found=await Product.find({active:true,_id:{$in:missing}}).select("name slug brand category origin imageUrls size variantLabel pricePaisa onHand reserved").lean<any[]>();
    found.forEach(p=>lookup.set(String(p._id),format(p)));
   }
  }
  shelves=sections.filter(s=>s.enabled).sort((a,b)=>a.position-b.position).map(s=>{
   const ids=s.productIds?.length?s.productIds:
    s.key==="new_arrivals"?products.map(p=>p.id):
    s.key==="best_sellers"?actualBestIds:[];
   return {key:s.key,title:s.key==="new_arrivals"?"Latest Products":s.title,subtitle:s.subtitle,products:ids.map(id=>lookup.get(id))
    .filter((p):p is ShopProduct=>!!p).slice(0,s.maxItems)};
  }).filter(s=>s.products.length>0);
 }catch{
  configured=false;products=[];shelves=[];
 }
 const snapshot=!process.env.MONGODB_URI;
 const latest=selectCatalogue().slice(0,8);
 const active=publicBlocks(blocks);
 const slides=active.filter(x=>x.kind==="hero");
 const categories=active.filter(x=>x.kind==="category");
 const promos=active.filter(x=>x.kind==="promotion");
 const editorial=active.filter(x=>x.kind==="editorial");
 const announcement=active.find(x=>x.kind==="announcement");
 const canOrder=configured&&checkoutEnabled(process.env);
 return <>
  <HomepageMotion/>
  <HomepageCarousel slides={slides}/>
  <div className="anTrustBar" aria-label="Shopping experience">
   <div><Sparkles size={25}/><span><strong>Thoughtfully curated</strong><small>An edited world of finds</small></span></div>
   <div><Package size={25}/><span><strong>Beauty to lifestyle</strong><small>Everything in one place</small></span></div>
   <div><Heart size={25}/><span><strong>Find what you love</strong><small>Discover your everyday style</small></span></div>
   <div><Truck size={25}/><span><strong>Made for Bangladesh</strong><small>Local shopping, global inspiration</small></span></div>
  </div>
  <section className="anCategories" id="collections" aria-label="Shop by category">
   <div className="anWide">
    <div className="anSectionTitle" data-an-reveal><div><p className="anOverline">DISCOVER YOUR NEXT FAVOURITE <span>✦</span></p>
     <h2>Shop by category</h2></div><a href="/shop" className="anTextLink">Explore collections <ArrowUpRight size={17}/></a></div>
    <div className="anCategoryGrid">
     {categories.map(c=><Link href={c.href} className="anCategoryCard" key={c.id} data-an-reveal>
      <div className="anCategoryImage">{c.imageUrl?<img src={c.imageUrl} alt={c.title} loading="lazy"/>:<div className="anCategoryBlank">ANUSMITA</div>}</div>
      <div className="anCategoryCaption"><strong>{c.title}</strong><span>{c.cta||"Explore"} <ArrowRight size={14}/></span></div>
     </Link>)}
    </div>
   </div>
  </section>
  {promos.map(p=><HomepagePromotion key={p.id} promo={p}/>)}
  <div className="anWide">
   {shelves.length>0&&<HomepageFeatured shelves={shelves}/>}
  </div>

  {snapshot?<section className="anWide homeLatest" id="shop"><div className="anSectionTitle"><div><p className="anOverline">FRESHLY ADDED TO OUR CATALOGUE</p><h2>Latest Products</h2><p>Beautiful bedsheets for your everyday sanctuary.</p></div><Link className="anTextLink" href="/shop">Shop all 60 designs →</Link></div><div className="sheetGrid">{latest.map(p=><CatalogueCard key={p.id} p={p}/>)}</div><div className="homeShopCta"><p>Ready stock · ৳2,500 per design · Delivery included</p><Link href="/shop?category=Bed%20Sheets" className="sheetPrimary">Explore bed sheets →</Link></div></section>:<section className="anWide homeShopCta" id="shop"><h2>Explore the collection</h2><Link className="sheetPrimary" href="/shop">Shop all products →</Link></section>}
  {!shelves.some(s=>s.key==='best_sellers')&&<div className="anWide"><section className="sheetEmpty" aria-label="Best Sellers"><p className="anOverline">LOVED BY OUR CUSTOMERS</p><h2>Best Sellers</h2><p>Our most-loved products will appear here as completed orders come in. In the meantime, discover the latest collection.</p><Link href="/shop">Find your favourite →</Link></section></div>}

  {editorial.length>0?<section className="anCurated">
   <div className="anWide">
    <div className="anSectionTitle anCuratedHeading" data-an-reveal><div><p className="anOverline">THE ANUSMITA WORLD <span>✦</span></p>
     <h2>Curated Collections</h2></div><a href="#collections" className="anTextLink">View All Collections <ArrowUpRight size={16}/></a></div>
    <div className="anCuratedGrid">{editorial.map(item=><a key={item.id} href={item.href}
       className="anCuratedCard" data-an-reveal>
      {item.imageUrl?<img src={item.imageUrl} alt="" loading="lazy"/>:<div className="anCuratedBlank">ANUSMITA</div>}
      <span className="anCuratedFade"/>
      <span className="anCuratedText"><strong>{item.title}</strong>
       <small>{item.subtitle}</small><span>{item.cta||"Explore"} <ArrowUpRight size={14}/></span>
      </span>
     </a>)}</div>
   </div>
  </section>:<section className="anSimpleStory" id="our-story"><div className="anWide">
   <h2>The ANUSMITA world</h2><p>Fashion, jewellery, beauty and everyday discoveries thoughtfully brought together for Bangladesh.</p>
  </div></section>}
  <HomepageDiscover/>
  <div className="anPromise"><span>✦</span><h2>{announcement?.title||"Beautiful discoveries. Thoughtfully yours."}</h2><p>ANUSMITA — Fashion · Jewellery · Beauty · Lifestyle</p></div>
 </>;
}
