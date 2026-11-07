import {db} from "@/lib/db";
import {Product} from "@/lib/models";
import {checkoutEnabled} from "@/lib/launch-config";
import {sitemapBaseUrl,sitemapHeaders,sitemapIndexDocument,sitemapSegments} from "@/lib/seo-sitemap-xml";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(){
 if(!checkoutEnabled(process.env))return new Response(sitemapIndexDocument([]),{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"no-store"}});
 try{
  await db();
  const count=await Product.countDocuments({active:true,archived:{$ne:true}});
  const base=sitemapBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const urls=[base+"/sitemaps/static.xml",...sitemapSegments(count).map(i=>base+"/sitemaps/products/"+i+".xml")];
  return new Response(sitemapIndexDocument(urls),{headers:sitemapHeaders});
 }catch{return new Response("Sitemap temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});}
}
