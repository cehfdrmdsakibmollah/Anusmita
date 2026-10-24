
import {z} from "zod";
export const blockKinds=["hero","category","promotion","editorial","announcement"] as const;
export const blockSchema=z.object({
 id:z.uuid(),kind:z.enum(blockKinds),
 title:z.string().trim().min(2).max(100),
 subtitle:z.string().trim().max(220).default(""),
 label:z.string().trim().max(65).default(""),
 imageUrl:z.string().trim().max(500).default(""),
 href:z.string().trim().max(250).default("#shop"),
 cta:z.string().trim().max(40).default("Explore now"),
 enabled:z.boolean().default(false),
 position:z.number().int().min(0).max(999),
 startsAt:z.iso.datetime({offset:true}).nullable().default(null),
 endsAt:z.iso.datetime({offset:true}).nullable().default(null)
}).strict().superRefine((value,ctx)=>{
 if(value.imageUrl&&!isSafeImage(value.imageUrl))ctx.addIssue({code:"custom",path:["imageUrl"],message:"Use approved HTTPS Cloudinary or Unsplash image links"});
 if(!isSafeLink(value.href))ctx.addIssue({code:"custom",path:["href"],message:"Link must start with / or #"});
 if(value.startsAt&&value.endsAt&&Date.parse(value.startsAt)>=Date.parse(value.endsAt))
  ctx.addIssue({code:"custom",path:["endsAt"],message:"End time must be later than start time"});
});
export const sectionKeys=["new_arrivals","best_sellers","trending","popular","recommended"] as const;
export const sectionSchema=z.object({
 key:z.enum(sectionKeys),title:z.string().trim().min(2).max(75),
 subtitle:z.string().trim().max(150).default(""),
 enabled:z.boolean(),position:z.number().int().min(0).max(999),
 productIds:z.array(z.string().regex(/^[0-9a-f]{24}$/i)).max(24).default([]),
 maxItems:z.number().int().min(1).max(16).default(8)
}).strict();
export type HomeBlock=z.infer<typeof blockSchema>;
export type HomeSection=z.infer<typeof sectionSchema>;
export function isSafeLink(value:string){
 return (/^\/(?!\/)[a-zA-Z0-9/?#&=_%.+-]*$/.test(value)||/^#[a-zA-Z][\w-]*$/.test(value))&&!/[\s\\]/.test(value);
}
export function isSafeImage(value:string){
 if(/^\/brand\/(?:categories\/)?[a-z0-9-]+\.webp$/.test(value))return true;
 try{
  const u=new URL(value);
  return u.protocol==="https:"&&!u.username&&!u.password&&
   (u.hostname==="res.cloudinary.com"&&u.pathname.startsWith("/oseohmxd/image/")||
    u.hostname==="images.unsplash.com"&&/^\/photo-[a-z0-9-]+$/.test(u.pathname));
 }catch{return false;}
}
const image=(photo:string,w=1000)=>"https://images.unsplash.com/"+photo+"?auto=format&fit=crop&w="+w+"&q=85";
export const homeStarterBlocks:HomeBlock[]=[
 {id:"00000000-0000-4000-8000-000000000001",kind:"hero",title:"Your Everyday Beauty, A More Beautiful You",subtitle:"Premium fashion, jewellery, beauty and lifestyle essentials for a brighter, more confident you.",label:"BEAUTY · FASHION · LIFESTYLE",imageUrl:"/brand/hero-reference.webp",href:"#shop",cta:"Shop Now",enabled:true,position:0,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000002",kind:"hero",title:"Confidence Looks Beautiful On You",subtitle:"Discover ANUSMITA's edit of premium beauty, fashion, bags, perfumes, watches and everyday essentials.",label:"THE ANUSMITA EDIT",imageUrl:"/brand/hero-reference.webp",href:"#collections",cta:"Explore Collection",enabled:true,position:1,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000003",kind:"category",title:"Skincare",subtitle:"The daily glow ritual",label:"BEAUTY",imageUrl:"/brand/categories/skincare.webp",href:"/?category=Skincare#shop",cta:"Shop skincare",enabled:true,position:0,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000004",kind:"category",title:"Beauty",subtitle:"Makeup & more",label:"MAKEUP",imageUrl:"/brand/categories/beauty.webp",href:"/?category=Beauty#shop",cta:"Shop beauty",enabled:true,position:1,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000005",kind:"category",title:"Fashion",subtitle:"Wear your story",label:"STYLE",imageUrl:"/brand/categories/fashion.webp",href:"/?category=Fashion#shop",cta:"Explore fashion",enabled:true,position:2,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000006",kind:"category",title:"Watches",subtitle:"Timeless details",label:"TIMEPIECES",imageUrl:"/brand/categories/watches.webp",href:"/?category=Watches#shop",cta:"Shop watches",enabled:true,position:3,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000007",kind:"category",title:"Mobile Accessories",subtitle:"Everyday technology",label:"TECH",imageUrl:"/brand/categories/mobile-accessories.webp",href:"/?category=Mobile%20Accessories#shop",cta:"Explore tech",enabled:true,position:4,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000008",kind:"category",title:"Bed Sheets",subtitle:"The art of comfort",label:"HOME",imageUrl:"/brand/categories/bed-sheets.webp",href:"/?category=Bed%20Sheets#shop",cta:"Shop bedding",enabled:true,position:5,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000009",kind:"category",title:"Perfumes",subtitle:"Find your signature",label:"FRAGRANCE",imageUrl:"/brand/categories/perfumes.webp",href:"/?category=Perfumes#shop",cta:"Explore scents",enabled:true,position:6,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000010",kind:"category",title:"Bags",subtitle:"Carry your style",label:"ACCESSORIES",imageUrl:"/brand/categories/bags.webp",href:"/?category=Bags#shop",cta:"Shop bags",enabled:true,position:7,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000011",kind:"editorial",title:"Beauty Essentials",subtitle:"For your natural glow",label:"OUR EDIT",imageUrl:"/brand/categories/skincare.webp",href:"/?category=Skincare#shop",cta:"Shop Now",enabled:true,position:0,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000013",kind:"editorial",title:"Fashion Collection",subtitle:"Trend. Style. You.",label:"OUR EDIT",imageUrl:"/brand/categories/fashion.webp",href:"/?category=Fashion#shop",cta:"Shop Now",enabled:true,position:1,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000014",kind:"editorial",title:"Fragrance Collection",subtitle:"Scents that stay with you",label:"OUR EDIT",imageUrl:"/brand/categories/perfumes.webp",href:"/?category=Perfumes#shop",cta:"Shop Now",enabled:true,position:2,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000015",kind:"editorial",title:"Home Comforts",subtitle:"Beautiful spaces, happier days",label:"OUR EDIT",imageUrl:"/brand/categories/bed-sheets.webp",href:"/?category=Bed%20Sheets#shop",cta:"Shop Now",enabled:true,position:3,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000016",kind:"promotion",title:"Beauty & Fragrance Essentials",subtitle:"Explore the ANUSMITA edit of skincare and signature scents.",label:"THE BEAUTY EDIT",imageUrl:"/brand/promo-reference.webp",href:"/?category=Beauty#shop",cta:"Explore Collection",enabled:true,position:0,startsAt:null,endsAt:null},
 {id:"00000000-0000-4000-8000-000000000012",kind:"announcement",title:"Thoughtfully curated for Bangladesh",subtitle:"",label:"",imageUrl:"",href:"#collections",cta:"",enabled:true,position:0,startsAt:null,endsAt:null}
];
export const homeStarterSections:HomeSection[]=[
 {key:"new_arrivals",title:"Just landed",subtitle:"The newest additions to the ANUSMITA collection.",enabled:true,position:0,productIds:[],maxItems:8},
 {key:"best_sellers",title:"Best sellers",subtitle:"A popular edit, backed by actual sales or selected by our team.",enabled:true,position:1,productIds:[],maxItems:8},
 {key:"trending",title:"Trending now",subtitle:"The pieces we are spotlighting.",enabled:true,position:2,productIds:[],maxItems:8},
 {key:"popular",title:"In the spotlight",subtitle:"A curated selection from our collection.",enabled:true,position:3,productIds:[],maxItems:8},
 {key:"recommended",title:"Picked for you",subtitle:"Discover something you might love.",enabled:true,position:4,productIds:[],maxItems:8}
];
export function publicBlocks(blocks:HomeBlock[],at=new Date()){
 const now=at.getTime();
 return blocks.filter(b=>b.enabled&&
  (!b.startsAt||Date.parse(b.startsAt)<=now)&&(!b.endsAt||Date.parse(b.endsAt)>now))
  .sort((a,b)=>a.position-b.position);
}
export function uniqueSections(sections:HomeSection[]){return new Set(sections.map(x=>x.key)).size===sections.length;}
export const cmsOperation=z.discriminatedUnion("action",[
 z.object({action:z.literal("add"),revision:z.number().int().min(0),block:blockSchema}).strict(),
 z.object({action:z.literal("edit"),revision:z.number().int().min(0),block:blockSchema}).strict(),
 z.object({action:z.literal("delete"),revision:z.number().int().min(0),id:z.uuid()}).strict(),
 z.object({action:z.literal("section"),revision:z.number().int().min(0),section:sectionSchema}).strict(),
 z.object({action:z.literal("reorder"),revision:z.number().int().min(0),kind:z.enum(blockKinds),
  ids:z.array(z.uuid()).min(1).max(60)}).strict()
]);
