import {buildProductSeoGraph,productSeoUrl} from "./product-seo-structured";
export type SeoFacts={name:string;slug:string;brand:string;category:string;description:string;imageUrls:string[];active:boolean;sku:string;pricePaisa?:number;onHand?:number;reserved?:number;barcode?:string;availabilityMode?:string;verifiedReviewCount?:number;verifiedRatingValue?:number};
export type SeoFields={metaTitle:string;metaDescription:string;focusKeyword:string;keywords:string[];imageAltTexts:string[];ogTitle:string;ogDescription:string;robotsIndex:boolean;robotsFollow:boolean;schemaEnabled:boolean};
export type SeoCheck={id:string;label:string;ok:boolean;detail:string};
export const cleanText=(value:string)=>value.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
export function autoSeo(product:SeoFacts){
 const title=(product.name+" | "+(product.brand||"ANUSMITA")).slice(0,70);
 const description=(cleanText(product.description)||"Explore "+product.name+" at ANUSMITA Bangladesh.").slice(0,160);
 return {title,description,focus:product.name.split(/\s+/).slice(0,5).join(" ").slice(0,80)};
}
export const canonical=productSeoUrl;
export function analyzeSeo(p:SeoFacts,s:SeoFields):SeoCheck[]{
 const a=autoSeo(p),title=s.metaTitle.trim()||a.title,desc=s.metaDescription.trim()||a.description;
 const focus=s.focusKeyword.trim().toLowerCase(),body=cleanText(p.description).toLowerCase();
 const words=body.split(/\s+/).filter(Boolean);
 const indexAllowed=p.active&&s.robotsIndex;
 return [
 {id:"title",label:"Meta Title & Description",ok:title.length>=30&&title.length<=70&&desc.length>=70&&desc.length<=160,detail:"Title 30–70 and description 70–160 characters (editorial guidance)"},
 {id:"slug",label:"URL Slug & Canonical",ok:/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug),detail:"Clean public /products/[slug] route"},
 {id:"schema",label:"Product Schema (JSON-LD)",ok:s.schemaEnabled&&!!p.name&&!!p.sku,detail:"Uses factual product data; public page applies launch rules"},
 {id:"breadcrumb",label:"Breadcrumb Hierarchy",ok:!!p.category.trim(),detail:"Category and product navigation available"},
 {id:"stock",label:"Stock Availability",ok:Number.isFinite(p.onHand)&&Number.isFinite(p.reserved),detail:"Stock read from product; never invent availability"},
 {id:"price",label:"Price & Offer Data",ok:Number.isFinite(p.pricePaisa)&&Number(p.pricePaisa)>0,detail:"BDT price from current catalog"},
 {id:"reviews",label:"Verified Customer Reviews",ok:!!p.verifiedReviewCount&&Number(p.verifiedRatingValue)>0,detail:p.verifiedReviewCount?`${p.verifiedReviewCount} verified, approved and consented reviews`:"Only verified and approved reviews may be included; not inferred here"},
 {id:"image",label:"Image Alt & Accessibility",ok:p.imageUrls.length>0&&p.imageUrls.every((_,i)=>(s.imageAltTexts[i]||"").trim().length>=8),detail:"Each real product image has descriptive alt text"},
 {id:"social",label:"Open Graph & Twitter Card",ok:!!(s.ogTitle.trim()||title)&&!!(s.ogDescription.trim()||desc)&&p.imageUrls.length>0,detail:"Product social metadata and real cover photo"},
 {id:"links",label:"Internal Linking",ok:!!p.category.trim()&&!!p.slug,detail:"Product and category navigation"},
 {id:"content",label:"Description Quality",ok:words.length>=120,detail:words.length+" words — 120+ words is an editorial suggestion, not a search requirement"},
 {id:"keyword",label:"Focus Keyword Relevance",ok:!!focus&&(title.toLowerCase().includes(focus)||body.includes(focus)),detail:"Focus keyword occurs naturally in title or content"},
 {id:"robots",label:"Robots Indexing Policy",ok:indexAllowed,detail:indexAllowed?"Requested index; storefront launch restrictions still apply":"Indexing disabled or product unpublished"},
 {id:"technical",label:"Metadata Length Limits",ok:title.length<=70&&desc.length<=160,detail:"Values fit existing validated API field lengths"},
 {id:"schema-test",label:"External Structured Data Test",ok:false,detail:"External Google validation not run; click Test Schema to check live URL"}
 ];
}
export function localScore(checks:SeoCheck[]){return Math.round(checks.filter(x=>x.ok).length/Math.max(checks.length,1)*100);}
export function makeProductSchema(p:SeoFacts,s:SeoFields){
 return buildProductSeoGraph(p,{metaDescription:s.metaDescription,schemaEnabled:s.schemaEnabled})?.product||null;
}
