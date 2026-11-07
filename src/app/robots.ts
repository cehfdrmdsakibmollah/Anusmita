import type {MetadataRoute} from "next";
import {checkoutEnabled} from "@/lib/launch-config";
import {privateRobotPaths} from "@/lib/seo-sitemap-policy";
/** robots.txt is crawl guidance, not an access-control mechanism. */
export default function robots():MetadataRoute.Robots{
 if(!checkoutEnabled(process.env))return {rules:{userAgent:"*",disallow:"/"}};
 const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://anusmita.netlify.app").replace(/\/$/,"");
 return {rules:{userAgent:"*",allow:"/",disallow:[...privateRobotPaths]},sitemap:base+"/sitemap.xml"};
}
