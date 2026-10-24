
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {HomePage,Audit} from "@/lib/models";
import {cmsOperation,homeStarterBlocks,homeStarterSections,uniqueSections} from "@/lib/home-content";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function GET(){
 try{
  await authorize(["owner","admin"]);
  await db();
  const row=await HomePage.findOne({key:"main"}).lean<any>();
  return Response.json({
   revision:row?.revision??0,
   blocks:row?.blocks??homeStarterBlocks,
   sections:row?.sections??homeStarterSections,
   saved:!!row
  },{headers});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin"]);
  if(Number(req.headers.get("content-length")||0)>16000)throw new HttpError(413,"Homepage edit request too large");
  const command=cmsOperation.parse(await req.json());
  await db();
  let outcome:any;
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    // Starter content is persisted on the FIRST edit. Afterwards deleting all
    // cards remains an intentional empty list and never restores the defaults.
    await HomePage.updateOne({key:"main"},{$setOnInsert:{
     key:"main",revision:0,blocks:homeStarterBlocks,sections:homeStarterSections
    }},{upsert:true,session});
    const existing=await HomePage.findOne({key:"main"}).session(session).lean<any>();
    if(!existing)throw new HttpError(500,"Unable to load homepage");
    if(existing.revision!==command.revision)throw new HttpError(409,"Homepage was changed in another session. Refresh and retry.");
    const blocks=[...(existing.blocks||[])];
    let sections=[...(existing.sections||[])];
    if(command.action==="add"){
     if(blocks.length>=90)throw new HttpError(409,"Homepage card limit reached");
     if(blocks.some(b=>b.id===command.block.id))throw new HttpError(409,"This card already exists");
     blocks.push(command.block);
    }else if(command.action==="edit"){
     const idx=blocks.findIndex(b=>b.id===command.block.id);
     if(idx<0)throw new HttpError(404,"Homepage card not found");
     // Type cannot silently change when editing.
     if(blocks[idx].kind!==command.block.kind)throw new HttpError(409,"Card type cannot be changed; create a new card");
     blocks[idx]=command.block;
    }else if(command.action==="delete"){
     const idx=blocks.findIndex(b=>b.id===command.id);
     if(idx<0)throw new HttpError(404,"Homepage card not found");
     blocks.splice(idx,1);
    }else if(command.action==="section"){
     const index=sections.findIndex(s=>s.key===command.section.key);
     if(index<0)sections.push(command.section);
     else sections[index]=command.section;
     if(!uniqueSections(sections))throw new HttpError(409,"Duplicate merchandising section");
    }else if(command.action==="reorder"){
     const same=blocks.filter(b=>b.kind===command.kind);
     if(command.ids.length!==same.length||new Set(command.ids).size!==same.length||
        command.ids.some(id=>!same.some(b=>b.id===id)))
      throw new HttpError(409,"Reordering requires every current card ID of this type exactly once");
     for(const card of blocks)if(card.kind===command.kind)
      card.position=command.ids.indexOf(card.id);
    }
    const result=await HomePage.updateOne({key:"main",revision:command.revision},{
     $set:{blocks,sections,lastEditedBy:actor.id},$inc:{revision:1}
    },{session});
    if(result.modifiedCount!==1)throw new HttpError(409,"Concurrent homepage edit. Refresh and retry.");
    await Audit.create([{actorId:actor.id,action:"homepage."+command.action,
     entity:"HomePage",entityId:"main",details:{
      revision:command.revision+1,
      kind:"block" in command?command.block.kind:"kind" in command?command.kind:null,
      id:"block" in command?command.block.id:"id" in command?command.id:null,
      section:"section" in command?command.section.key:null
     }
    }],{session});
    outcome={revision:command.revision+1,blocks,sections,saved:true};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json(outcome,{headers});
 }catch(e:any){
  if(e?.code===11000)return Response.json({error:"Concurrent initialization; refresh and retry"},{status:409});
  return apiError(e);
 }
}
