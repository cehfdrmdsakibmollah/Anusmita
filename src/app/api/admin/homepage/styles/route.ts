import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {HomePageStyle,Audit} from "@/lib/models";
import {homeStyleSchema,defaultHomeStyle,sanitizeHomeCss} from "@/lib/homepage-styles";
import {z} from "zod";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
const command=homeStyleSchema.extend({revision:z.number().int().min(0)});
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");
  await db();
  const row=await HomePageStyle.findOne({key:"main"}).lean<any>();
  const current=row?Object.fromEntries(Object.keys(defaultHomeStyle).map(k=>[k,row[k]??(defaultHomeStyle as any)[k]])):defaultHomeStyle;
  return Response.json({styles:current,revision:row?.revision??0},{headers});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin"],"settings.edit");
  if(Number(req.headers.get("content-length")||0)>6000)throw new HttpError(413,"Style payload too large");
  const parsed=command.parse(await req.json());
  try{sanitizeHomeCss(parsed.customCss);}catch(e){throw new HttpError(400,e instanceof Error?e.message:"Invalid CSS");}
  await db();
  const session=await mongoose.startSession();
  let revision=0;
  try{
   await session.withTransaction(async()=>{
    const existing=await HomePageStyle.findOne({key:"main"}).session(session).lean<any>();
    if((existing?.revision??0)!==parsed.revision)throw new HttpError(409,"Styles changed in another session. Reload and retry.");
    const {revision:_,...data}=parsed;
    const change=existing?
     await HomePageStyle.updateOne({key:"main",revision:parsed.revision},{$set:{...data,lastEditedBy:actor.id},$inc:{revision:1}},{session}):
     await HomePageStyle.create([{key:"main",...data,revision:1,lastEditedBy:actor.id}],{session});
    if(existing&&"modifiedCount" in change&&change.modifiedCount!==1)throw new HttpError(409,"Concurrent style update");
    revision=parsed.revision+1;
    await Audit.create([{actorId:actor.id,action:"homepage.styles.update",entity:"HomePageStyle",entityId:"main",details:{revision,customCssEnabled:!!data.customCss}}],{session});
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json({styles:homeStyleSchema.parse(parsed),revision},{headers});
 }catch(e:any){
  if(e?.code===11000)return Response.json({error:"Styles were created by another session. Reload."},{status:409,headers});
  return apiError(e);
 }
}
