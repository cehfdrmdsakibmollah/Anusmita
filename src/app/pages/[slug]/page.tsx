import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {ContentPage} from "@/lib/models";
import PublicPolicyReader from "@/components/public-policy-reader";
export const dynamic="force-dynamic";
async function load(slug:string){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)return null;
 await db();
 return ContentPage.findOne({slug,published:true,archived:{$ne:true}})
  .select("title titleBn description descriptionBn seoTitle noIndex blocks updatedAt publishedAt")
  .lean<any>();
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 try{
  const p=await load(slug);
  return p?{title:p.seoTitle||p.title,description:p.description||undefined,alternates:{canonical:"/pages/"+slug},robots:{index:!p.noIndex,follow:!p.noIndex}}:{title:"Page not found",robots:{index:false,follow:false}};
 }catch{return {title:"Unavailable",robots:{index:false,follow:false}};}
}
export default async function ContentPageView({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const p=await load(slug);
 if(!p)notFound();
 const allowed=new Set(["heading","paragraph","callout","bullet","numbered","faq","quote","divider"]);
 const blocks=(Array.isArray(p.blocks)?p.blocks:[]).slice(0,30).filter((b:any)=>typeof b?.text==="string"&&allowed.has(b.type)).map((b:any)=>({
  id:String(b.id||""),type:b.type,text:b.text.slice(0,3000),textBn:typeof b.textBn==="string"?b.textBn.slice(0,3000):"",
  answer:typeof b.answer==="string"?b.answer.slice(0,3000):"",answerBn:typeof b.answerBn==="string"?b.answerBn.slice(0,3000):""
 }));
 return <PublicPolicyReader title={p.title} titleBn={p.titleBn||""} description={p.description||""}
  descriptionBn={p.descriptionBn||""} blocks={blocks} updatedAt={p.publishedAt?.toISOString?.()||p.updatedAt?.toISOString?.()}/>;
}
