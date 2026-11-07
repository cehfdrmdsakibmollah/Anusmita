import type {MetadataRoute} from "next";
import {db} from "@/lib/db";
import {Product,ProductSeo} from "@/lib/models";
import {checkoutEnabled} from "@/lib/launch-config";
import {indexableSitemapProducts} from "@/lib/seo-sitemap-policy";
/** Production sitemap: only URLs that can be indexed; no fictional category/blog routes. */
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(!checkoutEnabled(process.env))return [];
 const root=(process.env.NEXT_PUBLIC_SITE_URL||"https://anusmita.netlify.app").replace(/\/$/,"");
 const entries:MetadataRoute.Sitemap=[
  {url:root+"/",changeFrequency:"daily",priority:1},
  {url:root+"/shop",changeFrequency:"daily",priority:0.9}
 ];
 if(!process.env.MONGODB_URI)return entries;
 try{
  await db();
  const products=await Product.find({active:true,archived:{$ne:true}})
   .select("_id slug active archived updatedAt").sort({updatedAt:-1}).limit(10000).lean<any[]>();
  const optedOut=await ProductSeo.find({productId:{$in:products.map(x=>x._id)},robotsIndex:false})
   .select("productId -_id").lean<any[]>();
  const noindex=new Set(optedOut.map(x=>String(x.productId)));
  for(const p of indexableSitemapProducts(products,noindex))
   entries.push({url:root+"/products/"+encodeURIComponent(p.slug),lastModified:p.updatedAt||undefined,changeFrequency:"weekly",priority:0.75});
 }catch{/* Degrade to known public routes when the database is unavailable. */}
 return entries;
}
