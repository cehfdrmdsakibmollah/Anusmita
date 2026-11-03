import mongoose from "mongoose";
import {z} from "zod";
import {assertOrigin,authorize,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Supplier,PurchaseOrder,Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const fields=z.object({
 name:z.string().trim().min(2).max(150),
 contact:z.string().trim().max(100).default(""),
 phone:z.string().trim().max(30).default(""),
 email:z.union([z.email(),z.literal("")]).default(""),
 country:z.string().trim().max(80).default(""),
 paymentTerms:z.string().trim().max(200).default(""),
 notes:z.string().trim().max(1000).default(""),
 category:z.string().trim().max(80).default("General"),
 tags:z.array(z.string().trim().min(1).max(40)).max(12).default([]),
 leadTimeDays:z.number().int().min(0).max(365).nullable().default(null),
 riskStatus:z.enum(["normal","watchlist","blocked"]).default("normal")
}).strict();
const patch=fields.extend({id:z.string().regex(/^[0-9a-f]{24}$/i),expectedUpdatedAt:z.string().datetime({offset:true})}).strict();
const idSchema=z.string().regex(/^[0-9a-f]{24}$/i);
const headers={"Cache-Control":"private, no-store"};
export async function GET(req:Request){
 try{
  await authorize(["owner","admin","purchasing","finance"],"purchasing.view");
  const q=new URL(req.url).searchParams;
  const paged=q.get("paged")==="1";
  const page=Math.max(1,Math.min(10000,Number(q.get("page"))||1));
  const size=10;
  const search=paged?(q.get("q")||"").trim().slice(0,100):"";
  const state=paged?(q.get("state")||"active"):"active";
  if(!["all","active","inactive"].includes(state))throw new HttpError(400,"Invalid filter");
  await db();
  const filter:any={archivedAt:null};
  if(state==="active")filter.active=true;
  if(state==="inactive")filter.active=false;
  const region=paged?q.get("region")||"all":"all";
  if(!["all","domestic","international"].includes(region))throw new HttpError(400,"Invalid region");
  if(region==="domestic")filter.country={$regex:/^bangladesh$/i};
  if(region==="international")filter.country={$nin:["","Bangladesh","bangladesh","BANGLADESH"]};
  if(search)filter.$or=[{name:{$regex:escapeRegex(search),$options:"i"}},{contact:{$regex:escapeRegex(search),$options:"i"}},{phone:{$regex:escapeRegex(search),$options:"i"}},{country:{$regex:escapeRegex(search),$options:"i"}}];
  const [rows,total]=await Promise.all([
   Supplier.find(filter).sort({createdAt:-1,_id:-1}).skip(paged?(page-1)*size:0).limit(paged?size:100).lean<any[]>(),
   Supplier.countDocuments(filter)
  ]);
  if(!paged)return Response.json({suppliers:rows},{headers}); // Preserve existing API contract for purchase-order selectors.
  return Response.json({suppliers:rows.map(x=>({...x,_id:String(x._id)})),total,page,pages:Math.max(1,Math.ceil(total/size))},{headers});
 }catch(e){return apiError(e)}
}
function escapeRegex(s:string){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
export async function POST(req:Request){
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin","purchasing"],"purchasing.edit");
  const data=fields.parse(await req.json());await db();
  const supplier=await Supplier.create(data);
  await Audit.create({actorId:actor.id,action:"supplier.created",entity:"Supplier",entityId:String(supplier._id),details:{name:data.name}});
  return Response.json({id:String(supplier._id),name:supplier.name},{status:201,headers});
 }catch(e){return apiError(e)}
}
export async function PATCH(req:Request){
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin","purchasing"],"purchasing.edit");
  const data=patch.parse(await req.json());await db();
  const {id,expectedUpdatedAt,...changes}=data;
  const original=await Supplier.findOne({_id:id,archivedAt:null}).lean<any>();
  if(!original)throw new HttpError(404,"Supplier not found");
  if(new Date(original.updatedAt).getTime()!==new Date(expectedUpdatedAt).getTime())throw new HttpError(409,"Supplier changed since load; refresh before editing");
  if(changes.riskStatus==="blocked" && original.riskStatus!=="blocked"){
   const open=await PurchaseOrder.countDocuments({supplierId:id,status:{$in:["draft","submitted","partially_received"]}});
   if(open)throw new HttpError(409,"Cannot block supplier with open purchase orders");
  }
  const row=await Supplier.findOneAndUpdate({_id:id,updatedAt:original.updatedAt,archivedAt:null},{$set:changes},{new:true,runValidators:true});
  if(!row)throw new HttpError(409,"Supplier was concurrently modified");
  await Audit.create({actorId:actor.id,action:"supplier.updated",entity:"Supplier",entityId:id,details:{fields:Object.keys(changes),riskStatus:changes.riskStatus}});
  return Response.json({supplier:{...row.toObject(),_id:String(row._id)}},{headers});
 }catch(e){return apiError(e)}
}
export async function DELETE(req:Request){
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin"],"purchasing.edit");
  const id=idSchema.parse(new URL(req.url).searchParams.get("id"));await db();
  const supplier=await Supplier.findOne({_id:id,archivedAt:null});
  if(!supplier)throw new HttpError(404,"Supplier not found");
  const referenced=await PurchaseOrder.countDocuments({supplierId:id});
  if(referenced)throw new HttpError(409,"Supplier has purchase order history; archive is prohibited to preserve accounting references");
  supplier.active=false;supplier.archivedAt=new Date();await supplier.save();
  await Audit.create({actorId:actor.id,action:"supplier.archived",entity:"Supplier",entityId:id});
  return Response.json({archived:true},{headers});
 }catch(e){return apiError(e)}
}
