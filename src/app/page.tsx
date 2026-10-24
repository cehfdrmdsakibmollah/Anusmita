
import { db } from "@/lib/db";
import { Product } from "@/lib/models";
import Storefront from "@/components/storefront";
import {checkoutEnabled} from "@/lib/launch-config";
import {ArrowRight, ArrowUpRight, Sparkles} from "lucide-react";
export const dynamic="force-dynamic";
const cloud="https://res.cloudinary.com/oseohmxd/image/upload";
const categories=[
 {title:"Beauty & Skincare",label:"01 / THE RITUAL",slug:"Beauty",
  image:cloud+"/v1792790797/anusmita/drive/korea/drive-1ox6P3J_wfThTQ_UuY2eAfyS0aaZNCCjY.jpg",
  alt:"ANUSMITA Korean beauty collection photography"},
 {title:"Jewellery",label:"02 / LITTLE TREASURES",slug:"Jewellery",
  image:"https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=85",
  alt:"Editorial photograph of delicate jewellery"},
 {title:"Fashion",label:"03 / YOUR EXPRESSION",slug:"Fashion",
  image:"https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
  alt:"Fashion editorial photography"},
 {title:"Accessories",label:"04 / THE DETAILS",slug:"Accessories",
  image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85",
  alt:"Handbag and accessories editorial photography"}
];
export default async function Home({searchParams}:{searchParams:Promise<{item?:string;category?:string}>}){
 const queryItem=(await searchParams).item||"";
 let products:any[]=[];
 let configured=Boolean(process.env.MONGODB_URI);
 if(configured){
  try{
   await db();
   const data=await Product.find({active:true})
    .select("name slug sku brand category origin imageUrls size variantLabel pricePaisa onHand reserved")
    .sort({createdAt:-1}).limit(48).lean();
   if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(queryItem)&&!data.some((p:any)=>p.slug===queryItem)){
    const extra=await Product.findOne({active:true,slug:queryItem})
     .select("name slug sku brand category origin imageUrls size variantLabel pricePaisa onHand reserved").lean<any>();
    if(extra)data.unshift(extra);
   }
   products=data.map((p:any)=>({
    id:String(p._id),name:p.name,slug:p.slug,brand:p.brand||"",
    category:p.category,origin:p.origin,image:p.imageUrls?.[0]||"",
    size:p.size||p.variantLabel||"",pricePaisa:p.pricePaisa,
    available:Math.max(0,p.onHand-p.reserved)
   }));
  }catch{configured=false;}
 }
 const canOrder=configured&&checkoutEnabled(process.env);
 return <>
  <section className="luxHero" aria-label="ANUSMITA fashion jewellery beauty">
   <div className="luxHeroText">
    <div className="luxHeroNumber"><span className="luxRule"/> ANUSMITA / THE CURATED EDIT</div>
    <p className="luxMicroHeading">Fashion <span>✦</span> Jewellery <span>✦</span> Beauty</p>
    <h1>A little<br/><em>luxury,</em><br/>every day.</h1>
    <p className="luxHeroDesc">Find your kind of beautiful. A considered world of skincare, jewellery, fashion and the little things that make it yours.</p>
    <div className="luxHeroActions">
     <a href="#collections" className="luxPrimaryButton">Explore the collection <ArrowUpRight size={17} strokeWidth={1.7}/></a>
     <a href="#our-story" className="luxUnderLink">Our story <ArrowRight size={17}/></a>
    </div>
    <div className="luxHeroFoot"><span>Thoughtfully selected for Bangladesh</span><span className="luxHeroFootLine"/></div>
   </div>
   <div className="luxHeroArt">
    <div className="luxArtBackground"/>
    <img className="luxHeroImage" src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1400&q=88"
     alt="Editorial arrangement of premium skincare products" fetchPriority="high"/>
    <div className="luxHeroArtShade"/>
    <div className="luxArtVertical">ANUSMITA — EST. FOR EVERYDAY BEAUTY</div>
    <div className="luxArtLabel"><span className="luxArtLabelTop">THE ANUSMITA EDIT</span><strong>Beautifully<br/>considered.</strong><span>01 — 04</span></div>
   </div>
  </section>

  <div className="luxMarquee" aria-label="Our collections">
   <span>Beauty rituals</span><i>✦</i><span>Everyday jewellery</span><i>✦</i>
   <span>Style discoveries</span><i>✦</i><span>Thoughtful details</span>
  </div>

  <section className="luxCollectionSection" id="collections">
   <div className="luxContainer">
    <div className="luxSectionIntro">
     <div><p className="luxKicker">DISCOVER ANUSMITA <span> / 01</span></p>
      <h2>Find your <em>beautiful.</em></h2></div>
     <p>Explore the worlds that make ANUSMITA yours. Every collection has its own story.</p>
    </div>
    <div className="luxCategoryGrid">
     {categories.map(category=><a className="luxCategory" key={category.slug} href={"/?category="+encodeURIComponent(category.slug)+"#shop"}
       aria-label={"Explore "+category.title}>
       <div className="luxCategoryVisual"><img src={category.image} alt={category.alt} loading="lazy"/>
        <div className="luxCategoryOverlay"/><span className="luxCategoryArrow"><ArrowUpRight size={21} strokeWidth={1.5}/></span>
       </div>
       <div className="luxCategoryMeta"><small>{category.label}</small><h3>{category.title}</h3></div>
      </a>)}
    </div>
   </div>
  </section>

  <section className="luxEditorialBanner" aria-label="The ANUSMITA edit">
   <div className="luxContainer luxBannerInner">
    <span className="luxBannerSymbol"><Sparkles size={35} strokeWidth={1}/></span>
    <div><p>AN EDIT OF LITTLE LUXURIES</p><h2>Style is personal.<br/><em>Make it yours.</em></h2></div>
    <a href="#shop" className="luxBannerLink">Discover what's next <ArrowUpRight size={18}/></a>
   </div>
  </section>

  <section className="luxShopSection" id="shop">
   <div className="luxContainer">
    <div className="luxSectionIntro luxShopHeading">
     <div><p className="luxKicker">THE CURATED SELECTION <span> / 02</span></p>
      <h2>The latest <em>edit.</em></h2></div>
     <p>Browse the pieces available in the ANUSMITA collection. Prices shown in BDT.</p>
    </div>
    <Storefront products={products} canOrder={canOrder}/>
    {!canOrder&&<p className="luxPreviewNote" role="status">The boutique is preparing for launch. Online checkout is currently closed.</p>}
   </div>
  </section>

  <section className="luxStory" id="our-story">
   <div className="luxStoryVisual">
    <div className="luxStorySeal"><span>ANUSMITA</span><span>FASHION · JEWELLERY · BEAUTY</span></div>
    <img src={cloud+"/v1792790882/anusmita/drive/korea/drive-1qrMzxSBkX2BAxACC8BDlBxZOOU1WZcEq.jpg"}
       alt="Beauty editorial from the ANUSMITA image collection" loading="lazy"/>
   </div>
   <div className="luxStoryCopy">
    <p className="luxKicker">OUR POINT OF VIEW <span> / 03</span></p>
    <h2>More than<br/>a shop.<br/><em>A feeling.</em></h2>
    <p>ANUSMITA is built around the joy of discovering something special. From beauty rituals inspired by Korea and Japan to jewellery, fashion and everyday accessories, we bring together a considered edit for Bangladesh.</p>
    <p>Good taste isn't about having more. It's about finding what feels like you.</p>
    <a className="luxUnderLink" href="#collections">Explore our world <ArrowUpRight size={18}/></a>
   </div>
  </section>

  <section className="luxClosing" aria-label="ANUSMITA brand sign off">
   <p>Thoughtfully selected. Beautifully yours.</p>
   <div>ANUSMITA <span>✦</span></div>
  </section>
 </>;
}
