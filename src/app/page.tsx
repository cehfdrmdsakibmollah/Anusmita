
import Link from "next/link";
import {ArrowRight,ArrowUpRight,Heart,Package,ShieldCheck,Sparkles,Truck} from "lucide-react";
import {db} from "@/lib/db";
import {Product,HomePage,Order} from "@/lib/models";
import {checkoutEnabled} from "@/lib/launch-config";
import {homeStarterBlocks,homeStarterSections,publicBlocks,type HomeBlock,type HomeSection} from "@/lib/home-content";
import HomepageCarousel from "@/components/homepage-carousel";
import HomepageCountdown from "@/components/homepage-countdown";
import HomepageFeatured,{type FeaturedShelf,type FeaturedProduct} from "@/components/homepage-featured";
import Storefront from "@/components/storefront";
export const dynamic="force-dynamic";
const format=(p:any):FeaturedProduct=>({id:String(p._id),name:p.name,slug:p.slug,brand:p.brand||"",
 category:p.category,origin:p.origin||"Other",image:p.imageUrls?.[0]||"",size:p.size||p.variantLabel||"",
 pricePaisa:p.pricePaisa,available:Math.max(0,(p.onHand||0)-(p.reserved||0))});
type ShopProduct=FeaturedProduct&{origin:string};
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
   return {key:s.key,title:s.title,subtitle:s.subtitle,products:ids.map(id=>lookup.get(id))
    .filter((p):p is FeaturedProduct=>!!p).slice(0,s.maxItems)};
  }).filter(s=>s.products.length>0);
 }catch{
  configured=false;products=[];shelves=[];
 }
 const active=publicBlocks(blocks);
 const slides=active.filter(x=>x.kind==="hero");
 const categories=active.filter(x=>x.kind==="category");
 const promos=active.filter(x=>x.kind==="promotion");
 const editorial=active.filter(x=>x.kind==="editorial");
 const announcement=active.find(x=>x.kind==="announcement");
 const canOrder=configured&&checkoutEnabled(process.env);
 return <>
  <HomepageCarousel slides={slides}/>
  <div className="anTrustBar" aria-label="Shopping experience">
   <div><Sparkles size={25}/><span><strong>Thoughtfully curated</strong><small>An edited world of finds</small></span></div>
   <div><Package size={25}/><span><strong>Beauty to lifestyle</strong><small>Everything in one place</small></span></div>
   <div><Heart size={25}/><span><strong>Find what you love</strong><small>Discover your everyday style</small></span></div>
   <div><Truck size={25}/><span><strong>Made for Bangladesh</strong><small>Local shopping, global inspiration</small></span></div>
  </div>
  <section className="anCategories" id="collections">
   <div className="anWide">
    <div className="anSectionTitle"><div><p className="anOverline">DISCOVER YOUR NEXT FAVOURITE <span>✦</span></p>
     <h2>Shop by category</h2></div><a href="#shop" className="anTextLink">Explore collections <ArrowUpRight size={17}/></a></div>
    <div className="anCategoryGrid">
     {categories.map(c=><Link href={c.href} className="anCategoryCard" key={c.id}>
      <div className="anCategoryImage">{c.imageUrl?<img src={c.imageUrl} alt={c.title} loading="lazy"/>:<div className="anCategoryBlank">ANUSMITA</div>}</div>
      <div className="anCategoryCaption"><strong>{c.title}</strong><span>{c.cta||"Explore"} <ArrowRight size={14}/></span></div>
     </Link>)}
    </div>
   </div>
  </section>
  {promos.map(p=><section key={p.id} className="anPromoWrap">
   <div className="anWide"><div className="anPromo" style={p.imageUrl?{backgroundImage:"linear-gradient(90deg,rgba(249,229,229,.98),rgba(249,229,229,.94) 42%,rgba(249,229,229,.16) 100%),url('"+p.imageUrl+"')"}:undefined}>
    <div className="anPromoCopy"><p className="anOverline">{p.label||"ANUSMITA EDIT"}</p><h2>{p.title}</h2><p>{p.subtitle}</p>
     <a href={p.href} className="anAction">{p.cta||"Explore offer"} <ArrowUpRight size={16}/></a></div>
    {p.endsAt&&<HomepageCountdown endsAt={p.endsAt}/>}
   </div></div>
  </section>)}
  <div className="anWide">
   {shelves.length>0&&<HomepageFeatured shelves={shelves}/>}
  </div>
  <section id="shop" className="anShop">
   <div className="anWide">
    <div className="anSectionTitle"><div><p className="anOverline">THE ANUSMITA EDIT <span>✦</span></p>
      <h2>Explore the collection</h2><p>Find your favourites across beauty, fashion, jewellery and more.</p></div>
     <span className="anShopContext">PRICES IN BANGLADESHI TAKA</span>
    </div>
    <Storefront products={products} canOrder={canOrder}/>
    {!canOrder&&<p className="anLaunchNotice"><ShieldCheck size={16}/> ANUSMITA is preparing for launch. Online checkout is not accepting orders yet.</p>}
   </div>
  </section>
  {editorial.map((item,i)=><section className={"anEditorial"+(i%2?" reverse":"")} key={item.id} id={i===0?"our-story":undefined}>
   <div className="anEditorialImage">{item.imageUrl?<img src={item.imageUrl} alt={item.title} loading="lazy"/>:<span>ANUSMITA</span>}</div>
   <div className="anEditorialCopy"><p className="anOverline">{item.label||"THE ANUSMITA WORLD"}</p>
    <h2>{item.title}</h2><p>{item.subtitle}</p><a href={item.href} className="anAction">{item.cta||"Discover more"} <ArrowUpRight size={17}/></a>
   </div>
  </section>)}
  {!editorial.length&&<section className="anSimpleStory" id="our-story"><div className="anWide"><h2>The ANUSMITA world</h2><p>Fashion, jewellery, beauty and everyday discoveries thoughtfully brought together for Bangladesh.</p></div></section>}
  <div className="anPromise"><span>✦</span><h2>{announcement?.title||"Beautiful discoveries. Thoughtfully yours."}</h2><p>ANUSMITA — Fashion · Jewellery · Beauty · Lifestyle</p></div>
 </>;
}
