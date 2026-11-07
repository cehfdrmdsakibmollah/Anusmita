import {db} from "@/lib/db";
import {Product,ProductSeo} from "@/lib/models";
import {checkoutEnabled} from "@/lib/launch-config";
import {indexableSitemapProducts} from "@/lib/seo-sitemap-policy";
import {sitemapBaseUrl,sitemapDocument,sitemapHeaders,sitemapSegmentFromPath,SITEMAP_SEGMENT_SIZE} from "@/lib/seo-sitemap-xml";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(_req:Request,context:{params:Promise<{segment:string}>}){
 const {segment}=await context.params;
 const number=sitemapSegmentFromPath(segment);
 if(number===null)return new Response("Invalid sitemap segment",{status:404});
 if(!checkoutEnabled(process.env))return new Response(sitemapDocument([]),{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"no-store"}});
 try{
  await db();
  // Slice active candidates before removing individual product noindex flags:
  // every candidate has exactly one segment, even when filtered from XML.
  const rows=await Product.find({active:true,archived:{$ne:true}})
   .select("_id slug active archived updatedAt").sort({_id:1})
   .skip(number*SITEMAP_SEGMENT_SIZE).limit(SITEMAP_SEGMENT_SIZE).lean<any[]>();
  if(!rows.length)return new Response("Sitemap segment not found",{status:404});
  const optedOut=await ProductSeo.find({productId:{$in:rows.map(p=>p._id)},robotsIndex:false})
   .select("productId -_id").lean<any[]>();
  const banned=new Set(optedOut.map(p=>String(p.productId)));
  const base=sitemapBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const urls=indexableSitemapProducts(rows,banned).map(p=>({url:base+"/products/"+encodeURIComponent(p.slug),lastModified:p.updatedAt}));
  return new Response(sitemapDocument(urls),{headers:sitemapHeaders});
 }catch{return new Response("Sitemap temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});}
}
