import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,WarehouseLocation,WarehouseBalance,BranchDamage,StockMovement,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const id=z.string().regex(/^[0-9a-f]{24}$/i);
const input=z.object({
 operationKey:z.string().uuid(),branchId:id,productId:id,
 quantity:z.number().int().min(1).max(100000),
 reason:z.string().trim().min(8).max(300)
}).strict();
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","inventory"],"inventory.view");await db();
  const branchId=new URL(request.url).searchParams.get("branchId")||"";
  if(branchId&&!id.safeParse(branchId).success)throw new HttpError(400,"Invalid branch");
  const records=await BranchDamage.find(branchId?{branchId}:{}).select("branchName sku productName quantity unitCostPaisa reason createdAt").sort({createdAt:-1}).limit(50).lean<any[]>();
  return Response.json({records:records.map(x=>({id:String(x._id),branchName:x.branchName,sku:x.sku,productName:x.productName,quantity:x.quantity,unitCostPaisa:x.unitCostPaisa,reason:x.reason,createdAt:x.createdAt}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);const actor=await authorize(["owner","admin","inventory"],"inventory.edit");
  const data=input.parse(await request.json());await db();
  const session=await mongoose.startSession();let result:{id:string;alreadyApplied:boolean}|null=null;
  try{await session.withTransaction(async()=>{
   const prior=await BranchDamage.findOne({operationKey:data.operationKey}).session(session);
   if(prior){
    if(String(prior.branchId)!==data.branchId||String(prior.productId)!==data.productId||prior.quantity!==data.quantity||prior.reason!==data.reason)
     throw new HttpError(409,"Operation key already used for different damage report");
    result={id:String(prior._id),alreadyApplied:true};return;
   }
   const branch=await WarehouseLocation.findOne({_id:data.branchId,active:true}).select("name").session(session).lean<any>();
   if(!branch)throw new HttpError(409,"Branch inactive or not found");
   const location=await WarehouseBalance.findOneAndUpdate({locationId:data.branchId,productId:data.productId,quantity:{$gte:data.quantity}},{$inc:{quantity:-data.quantity}},{new:true,session});
   if(!location)throw new HttpError(409,"Not enough physical stock at this branch");
   const product=await Product.findOneAndUpdate({_id:data.productId,$expr:{$gte:[{$subtract:["$onHand","$reserved"]},data.quantity]}},{$inc:{onHand:-data.quantity}},{new:true,session});
   if(!product)throw new HttpError(409,"Not enough unreserved global stock. Nothing recorded");
   const [damage]=await BranchDamage.create([{...data,branchName:branch.name,productName:product.name,sku:product.sku,unitCostPaisa:Math.max(0,Number(product.costPaisa||0)),actorId:actor.id}],{session});
   await StockMovement.create([{productId:data.productId,type:"damage",deltaOnHand:-data.quantity,actorId:actor.id,note:"Branch damage "+data.operationKey+": "+data.reason}],{session});
   await Audit.create([{actorId:actor.id,action:"pos.branch.damage.recorded",entity:"BranchDamage",entityId:String(damage._id),details:{branchId:data.branchId,productId:data.productId,quantity:data.quantity}}],{session});
   result={id:String(damage._id),alreadyApplied:false};
  },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});}finally{await session.endSession();}
  return Response.json(result,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e:any){
  if(e?.code===11000)return Response.json({error:"Duplicate or concurrent damage request. Verify the existing register before retrying using the same operation key"},{status:409});
  return apiError(e);
 }
}
