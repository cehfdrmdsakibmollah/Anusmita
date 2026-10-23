
import type {MetadataRoute} from "next";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const root=(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"");
 const entries:MetadataRoute.Sitemap=[{url:root+"/",changeFrequency:"daily",priority:1}];
 if(!process.env.MONGODB_URI)return entries;
 try{
  await db();
  const products=await Product.find({active:true}).select("slug updatedAt").sort({updatedAt:-1}).limit(10000).lean<any[]>();
  for(const p of products)entries.push({url:root+"/products/"+encodeURIComponent(p.slug),lastModified:p.updatedAt,changeFrequency:"weekly",priority:0.75});
 }catch{/* Do not fabricate products when database is unavailable. */}
 return entries;
}
