import {db} from "@/lib/db";
import {CatalogCategory,Product} from "@/lib/models";
import {checkoutEnabled} from "@/lib/launch-config";
import {categoriesWithPublishedProducts} from "@/lib/category-seo";
import {sitemapBaseUrl,sitemapDocument,sitemapHeaders} from "@/lib/seo-sitemap-xml";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(){
 if(!checkoutEnabled(process.env))return new Response(sitemapDocument([]),{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"no-store"}});
 try{
  await db();
  const [categories,productNames]=await Promise.all([
   CatalogCategory.find({active:true}).select("name slug active updatedAt -_id").sort({position:1}).limit(5000).lean<any[]>(),
   Product.distinct("category",{active:true,archived:{$ne:true}})
  ]);
  const root=sitemapBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const rows=categoriesWithPublishedProducts(categories,new Set(productNames.map(String)))
   .map(category=>({url:root+"/collections/"+encodeURIComponent(category.slug),lastModified:category.updatedAt}));
  return new Response(sitemapDocument(rows),{headers:sitemapHeaders});
 }catch{return new Response("Category sitemap temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});}
}
