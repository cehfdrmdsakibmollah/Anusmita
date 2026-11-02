import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order,CustomerCRMNote,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const phone=z.string().trim().min(8).max(32);
export async function GET(request:Request){
 try{await authorize(["owner","admin","sales","support","analyst"],"customers.view");
 const p=phone.parse(new URL(request.url).searchParams.get("phone"));await db();
 const notes=await CustomerCRMNote.find({customerPhone:p}).sort({createdAt:-1}).limit(30).select("note tags createdAt").lean<any[]>();
 return Response.json({notes:notes.map(n=>({id:String(n._id),note:n.note,tags:n.tags,createdAt:n.createdAt}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}
}
const body=z.object({phone,note:z.string().trim().min(5).max(1000),tags:z.array(z.string().trim().min(1).max(30)).max(8)}).strict();
export async function POST(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner","admin","sales","support"],"customers.view");
 const data=body.parse(await request.json());await db();
 if(!await Order.exists({"customer.phone":data.phone,isTest:false}))throw new HttpError(404,"No order contact matching phone");
 const note=await CustomerCRMNote.create({customerPhone:data.phone,note:data.note,tags:[...new Set(data.tags)],actorId:actor.id});
 await Audit.create({actorId:actor.id,action:"crm.note.created",entity:"CustomerCRMNote",entityId:String(note._id),details:{customerPhoneMasked:data.phone.slice(-4),tags:note.tags}});
 return Response.json({saved:true,id:String(note._id)},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e)}
}
