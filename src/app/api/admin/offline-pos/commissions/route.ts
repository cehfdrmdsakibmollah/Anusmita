import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {PosCommissionPolicy,WarehouseLocation,User,Audit} from "@/lib/models";
import {commissionPolicyInput} from "@/lib/pos-commission";
import mongoose from "mongoose";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const oid=/^[0-9a-f]{24}$/i;
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","finance"],"finance.view");
  const branchId=new URL(request.url).searchParams.get("branchId")||"";
  if(branchId&&!oid.test(branchId))throw new HttpError(400,"Invalid branch");
  await db();
  const [policies,branches,staff]=await Promise.all([
   PosCommissionPolicy.find(branchId?{branchId}:{}).sort({updatedAt:-1}).limit(300).lean<any[]>(),
   WarehouseLocation.find({active:true}).select("name code").sort({name:1}).lean<any[]>(),
   User.find({active:true,role:{$in:["sales","admin","owner"]}}).select("name role").sort({name:1}).limit(150).lean<any[]>()
  ]);
  return Response.json({
   policies:policies.map(p=>({id:String(p._id),branchId:String(p.branchId),cashierId:String(p.cashierId),rateBps:p.rateBps,active:p.active,reason:p.reason,updatedAt:p.updatedAt})),
   branches:branches.map(b=>({id:String(b._id),name:b.name,code:b.code})),
   staff:staff.map(s=>({id:String(s._id),name:s.name,role:s.role}))
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function PUT(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner","admin"],"finance.edit");
  const input=commissionPolicyInput.parse(await request.json());await db();
  const session=await mongoose.startSession();let output:any=null;
  try{await session.withTransaction(async()=>{
   const [branch,cashier]=await Promise.all([
    WarehouseLocation.findOne({_id:input.branchId,active:true}).select("_id").session(session).lean<any>(),
    User.findOne({_id:input.cashierId,active:true,role:{$in:["sales","admin","owner"]}}).select("_id").session(session).lean<any>()
   ]);
   if(!branch||!cashier)throw new HttpError(409,"Branch or cashier is inactive");
   const policy=await PosCommissionPolicy.findOneAndUpdate({branchId:input.branchId,cashierId:input.cashierId},
    {$set:{rateBps:input.rateBps,active:input.active,reason:input.reason,updatedBy:actor.id}},
    {upsert:true,new:true,runValidators:true,session,setDefaultsOnInsert:true});
   await Audit.create([{actorId:actor.id,action:"pos.commission.policy.updated",entity:"PosCommissionPolicy",entityId:String(policy._id),details:{branchId:input.branchId,cashierId:input.cashierId,rateBps:input.rateBps,active:input.active,reason:input.reason}}],{session});
   output={id:String(policy._id),rateBps:policy.rateBps,active:policy.active};
  },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});}finally{await session.endSession();}
  return Response.json(output,{headers:{"Cache-Control":"no-store"}});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent commission update. Reload and retry."},{status:409});return apiError(e);}
}
