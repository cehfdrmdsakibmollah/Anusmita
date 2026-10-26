import mongoose from 'mongoose';
import {z} from 'zod';
import {authorize,assertOrigin,apiError,HttpError} from '@/lib/auth';
import {db} from '@/lib/db';
import {Audit} from '@/lib/models';
import {ChatbotSettings} from '@/lib/chatbot-model';
import {answersSchema} from '@/lib/chatbot';
import {boundedJson} from '@/lib/chatbot-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){try{await authorize(['owner','admin']);await db();const r=await ChatbotSettings.findOne({key:'main'}).lean<any>();return Response.json({revision:r?.revision||0,answers:r?.answers||[]},{headers});}catch(e){return apiError(e);}}
export async function PUT(req:Request){try{
 assertOrigin(req);const actor=await authorize(['owner','admin']);const data=z.object({revision:z.number().int().nonnegative(),answers:answersSchema}).strict().parse(await boundedJson(req,200000));await db();
 const session=await mongoose.startSession();try{await session.withTransaction(async()=>{
 await ChatbotSettings.updateOne({key:'main'},{$setOnInsert:{key:'main',revision:0,answers:[]}},{upsert:true,session});
 const result=await ChatbotSettings.updateOne({key:'main',revision:data.revision},{$set:{answers:data.answers,editedBy:actor.id},$inc:{revision:1}},{session});
 if(result.modifiedCount!==1)throw new HttpError(409,'Replies changed in another session. Reload before saving.');
 await Audit.create([{actorId:actor.id,action:'chatbot.replies.update',entity:'ChatbotSettings',entityId:'main',details:{revision:data.revision+1,count:data.answers.length}}],{session});
 });}finally{await session.endSession();}
 return Response.json({revision:data.revision+1,answers:data.answers},{headers});
 }catch(e){return apiError(e);}}
