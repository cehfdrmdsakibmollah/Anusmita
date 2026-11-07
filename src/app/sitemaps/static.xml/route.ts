import {checkoutEnabled} from "@/lib/launch-config";
import {sitemapBaseUrl,sitemapDocument,sitemapHeaders} from "@/lib/seo-sitemap-xml";
export const dynamic="force-dynamic";
export async function GET(){
 const root=sitemapBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
 const urls=checkoutEnabled(process.env)?[{url:root+"/"},{url:root+"/shop"}]:[];
 return new Response(sitemapDocument(urls),{headers:sitemapHeaders});
}
