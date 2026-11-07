/** Public Product/Breadcrumb JSON-LD. Never synthesize prices, reviews, GTINs or expiry dates. */
export type ProductSeoSource={
 name:string;slug:string;sku?:string;brand?:string;category?:string;description?:string;
 imageUrls?:string[];pricePaisa?:number;onHand?:number;reserved?:number;
 availabilityMode?:string;barcode?:string;active?:boolean;categoryPath?:string;
 verifiedReviewCount?:number;verifiedRatingValue?:number
};
export type ProductSeoOverrides={metaDescription?:string;schemaEnabled?:boolean};
export const PRODUCT_SITE_ORIGIN="https://anusmita.netlify.app";
export const productSeoUrl=(slug:string,origin=PRODUCT_SITE_ORIGIN)=>origin.replace(/\/$/,"")+"/products/"+encodeURIComponent(slug);
export function validProductGtin13(value:string|undefined){
 if(!value||!/^\d{13}$/.test(value))return false;
 const digits=[...value].map(Number);
 const checksum=(10-(digits.slice(0,12).reduce((sum,d,i)=>sum+d*(i%2?3:1),0)%10))%10;
 return checksum===digits[12];
}
export function verifiedRating(input:{verifiedReviewCount?:number;verifiedRatingValue?:number}){
 const count=Number(input.verifiedReviewCount||0),rating=Number(input.verifiedRatingValue||0);
 if(!Number.isInteger(count)||count<=0||!Number.isFinite(rating)||rating<1||rating>5)return undefined;
 return {"@type":"AggregateRating",ratingValue:Number(rating.toFixed(2)),reviewCount:count};
}
export function buildProductSeoGraph(p:ProductSeoSource,seo:ProductSeoOverrides={},origin=PRODUCT_SITE_ORIGIN){
 if(seo.schemaEnabled===false||!p.active)return null;
 const url=productSeoUrl(p.slug,origin);
 const price=Number(p.pricePaisa);
 const available=Math.max(0,Number(p.onHand||0)-Number(p.reserved||0));
 const availability=p.availabilityMode==="preorder"?"https://schema.org/PreOrder":available>0?"https://schema.org/InStock":"https://schema.org/OutOfStock";
 const gtin=validProductGtin13(p.barcode)?{gtin13:p.barcode}: {};
 const product={
  "@context":"https://schema.org","@type":"Product",name:p.name,
  url,sku:p.sku||undefined,...gtin,
  image:(p.imageUrls||[]).filter(Boolean),
  description:(seo.metaDescription||p.description||p.name).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
  brand:p.brand?{"@type":"Brand",name:p.brand}:undefined,
  aggregateRating:verifiedRating(p),
  offers:Number.isFinite(price)&&price>0?{"@type":"Offer",url,priceCurrency:"BDT",price:(price/100).toFixed(2),availability,itemCondition:"https://schema.org/NewCondition"}:undefined
 };
 const crumbs=[
  {"@type":"ListItem",position:1,name:"Home",item:origin+"/"},
  {"@type":"ListItem",position:2,name:"Shop",item:origin+"/shop"},
  ...(p.category?[{"@type":"ListItem",position:3,name:p.category,item:origin+(p.categoryPath&&/^\/collections\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.categoryPath)?p.categoryPath:"/shop?category="+encodeURIComponent(p.category))}]:[]),
  {"@type":"ListItem",position:p.category?4:3,name:p.name,item:url}
 ];
 return {product,breadcrumb:{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:crumbs}};
}
export function safeSeoJsonLd(value:unknown){return JSON.stringify(value).replace(/</g,"\\u003c");}
