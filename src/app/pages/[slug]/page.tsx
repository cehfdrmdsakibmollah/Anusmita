import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {ContentPage} from "@/lib/models";
export const dynamic="force-dynamic";
async function load(slug:string){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)return null;
 await db();return ContentPage.findOne({slug,published:true}).select("title description blocks").lean<any>();
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;try{const p=await load(slug);return p?{title:p.title,description:p.description||undefined,robots:{index:true,follow:true}}:{title:"Page not found",robots:{index:false,follow:false}};}catch{return {title:"Unavailable",robots:{index:false,follow:false}};}
}
export default async function ContentPageView({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const p=await load(slug);if(!p)notFound();
 const blocks=Array.isArray(p.blocks)?p.blocks.slice(0,30):[];
 return <article className="anWide" style={{maxWidth:900,margin:"40px auto 70px",padding:"0 20px",minHeight:"55vh"}}>
 <p style={{fontSize:12,letterSpacing:2,color:"#8b173a"}}>ANUSMITA · INFORMATION</p>
 <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(32px,5vw,52px)",margin:"15px 0 25px"}}>{p.title}</h1>
 {blocks.map((b:any,i:number)=>{if(typeof b?.text!=="string")return null;const t=b.text.slice(0,3000);return <section key={typeof b.id==="string"?b.id:i} style={{whiteSpace:"pre-wrap",lineHeight:1.8,margin:"20px 0",padding:b.type==="callout"?20:0,border:b.type==="callout"?"1px solid #eddadd":undefined,background:b.type==="callout"?"#fff4f5":undefined}}>{b.type==="heading"?<h2 style={{fontFamily:"Georgia,serif",fontSize:27}}>{t}</h2>:<p>{t}</p>}</section>;})}
 </article>;
}
