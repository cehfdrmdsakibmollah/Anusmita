import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit,AuditReview} from "@/lib/models";
import {safeAuditDetails} from "@/lib/activity-audit";
import {z} from "zod";
export const dynamic="force-dynamic";
const valid=(id:string)=>{if(!/^[a-f0-9]{24}$/i.test(id))throw new HttpError(400,"Invalid event ID");};
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const actor=await authorize(["owner","admin","analyst"],"settings.view");const {id}=await params;valid(id);await db();
 const row=await Audit.findById(id).select("details entity entityId").lean<any>();if(!row)throw new HttpError(404,"Event not found");
 const canInspect=actor.role==="owner"||(actor.role==="admin"&&actor.permissions?.["settings.edit"]!==false);
 const notes=canInspect?await AuditReview.find({eventId:id}).sort({createdAt:-1,_id:-1}).limit(20).select("note reviewerId createdAt").lean():[];
 return Response.json({details:canInspect?safeAuditDetails(row.details):null,canInspect,notes:notes.map((n:any)=>({id:String(n._id),note:n.note,reviewerId:String(n.reviewerId),createdAt:n.createdAt})),correlationId:null,requestMetadata:null},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{
 assertOrigin(request);const actor=await authorize(["owner","admin"],"settings.edit");const {id}=await params;valid(id);
 const input=z.object({note:z.string().trim().min(3).max(1000)}).strict().parse(await request.json());await db();
 if(!await Audit.exists({_id:id}))throw new HttpError(404,"Event not found");
 const note=await AuditReview.create({eventId:id,reviewerId:actor.id,note:input.note});
 return Response.json({id:String(note._id)},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}}
