
import type {MetadataRoute} from "next";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
export default async function sitemap():Promise<MetadataRoute.Sitemap> {
 const root=(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000").replace(/\/$/,"");
 const entries:MetadataRoute.Sitemap=[{url:root+"/",changeFrequency:"daily",priority:1}];
 // Product detail URLs will be added when those pages exist; never advertise 404s.
 return entries;
}
