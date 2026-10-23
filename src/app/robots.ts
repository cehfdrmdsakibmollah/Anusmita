
import type {MetadataRoute} from "next";
import {checkoutEnabled} from "@/lib/launch-config";
export default function robots():MetadataRoute.Robots{
 if(!checkoutEnabled(process.env))return {rules:{userAgent:"*",disallow:"/"}};
 const base=(process.env.NEXT_PUBLIC_SITE_URL||"").replace(/\/$/,"");
 return {rules:{userAgent:"*",allow:"/",disallow:["/admin/","/api/"]},sitemap:base+"/sitemap.xml"};
}
