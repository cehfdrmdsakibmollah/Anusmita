import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {FunnelPage} from "@/lib/models";
import {funnelContent,funnelSlug} from "@/lib/funnel-pages";
import {FunnelBlocks} from "@/components/funnel-blocks";
export const dynamic="force-dynamic";
async function fetchFunnel(slug:string){
 if(!funnelSlug.safeParse(slug).success)return null;
 await db();
 const doc=await FunnelPage.findOne({slug,published:true,archived:{$ne:true},$or:[{endsAt:null},{endsAt:{$gt:new Date()}}]})
  .select("title description seoTitle noIndex endsAt blocks").lean<any>();
 if(!doc)return null;
 const parsed=funnelContent.safeParse({title:doc.title,description:doc.description||"",seoTitle:doc.seoTitle||"",noIndex:!!doc.noIndex,endsAt:doc.endsAt?doc.endsAt.toISOString():"",blocks:doc.blocks||[]});
 return parsed.success?parsed.data:null;
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 const funnel=await fetchFunnel(slug);
 if(!funnel)return {title:"Funnel not found",robots:{index:false,follow:false}};
 return {title:funnel.seoTitle||funnel.title,description:funnel.description,alternates:{canonical:"/funnel/"+slug},
  robots:{index:!funnel.noIndex,follow:!funnel.noIndex},
  openGraph:{title:funnel.seoTitle||funnel.title,description:funnel.description,type:"website",url:"/funnel/"+slug}};
}
export default async function FunnelPublicPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const funnel=await fetchFunnel(slug);
 if(!funnel)notFound();
 return <main className="anFunnelRoot">
  <header className="anFunnelPublicHeader"><Link className="anFunnelLogo" href="/">ANUSMITA</Link><Link href="/shop">Explore Collection</Link></header>
  <FunnelBlocks blocks={funnel.blocks}/>
  <footer className="anFunnelFooter">ANUSMITA · Fashion · Jewellery · Beauty</footer>
 </main>;
}
