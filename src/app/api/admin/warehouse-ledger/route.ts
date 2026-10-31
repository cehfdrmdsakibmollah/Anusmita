import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,WarehouseLocation,WarehouseBalance,WarehouseEvent,Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const id=z.string().regex(/^[a-f\d]{24}$/i);
const input=z.object({
 operationKey:z.string().uuid(),kind:z.enum(["allocate","transfer"]),
 productId:id,fromLocationId:id.optional(),toLocationId:id,
 quantity:z.number().int().min(1).max(100000),
 note:z.string().trim().min(8).max(300)
}).strict();
export async function GET(){
 try{
  await authorize(["owner","admin","inventory","purchasing"]);
  await db();
  const [balances,events]=await Promise.all([
   WarehouseBalance.find({quantity:{$gt:0}}).populate("productId","sku name onHand reserved").populate("locationId","code name").limit(100).lean<any[]>(),
   WarehouseEvent.find({}).select("kind quantity productId fromLocationId toLocationId createdAt").sort({createdAt:-1}).limit(50).lean<any[]>()
  ]);
  return Response.json({balances:balances.map(b=>({id:String(b._id),quantity:b.quantity,sku:b.productId?.sku||"",name:b.productId?.name||"",location:b.locationId?.code||"",productId:String(b.productId?._id||""),locationId:String(b.locationId?._id||"")})),
    events:events.map(e=>({id:String(e._id),kind:e.kind,quantity:e.quantity,createdAt:e.createdAt,productId:String(e.productId),fromLocationId:e.fromLocationId?String(e.fromLocationId):null,toLocationId:String(e.toLocationId)})),
    note:"Warehouse allocations are location bookkeeping only, never additional physical inventory. Unallocated global stock is not assigned to a location."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","inventory"]);
  const data=input.parse(await request.json());
  if(data.kind==="transfer"&&(!data.fromLocationId||data.fromLocationId===data.toLocationId))throw new HttpError(400,"A transfer needs two different locations");
  if(data.kind==="allocate"&&data.fromLocationId)throw new HttpError(400,"Allocation must not have a source location");
  await db();
  const session=await mongoose.startSession();let result:{id:string;alreadyApplied:boolean}|null=null;
  try{await session.withTransaction(async()=>{
   const previous=await WarehouseEvent.findOne({operationKey:data.operationKey}).session(session);
   if(previous){if(String(previous.productId)!==data.productId||previous.kind!==data.kind||previous.quantity!==data.quantity||String(previous.toLocationId)!==data.toLocationId||String(previous.fromLocationId||"")!==(data.fromLocationId||"")||previous.note!==data.note)throw new HttpError(409,"Idempotency key already used for different data");result={id:String(previous._id),alreadyApplied:true};return;}
   const product=await Product.findById(data.productId).session(session);
   if(!product)throw new HttpError(404,"Product missing");
   const locations=[data.toLocationId,...(data.fromLocationId?[data.fromLocationId]:[])];
   const found=await WarehouseLocation.countDocuments({_id:{$in:locations},active:true}).session(session);
   if(found!==locations.length)throw new HttpError(409,"Source or destination is not active");
   // Serialize concurrent allocations for the same SKU without changing onHand/reserved.
   await Product.updateOne({_id:data.productId},{$inc:{warehouseAllocationRevision:1}},{session});
   if(data.kind==="allocate"){
    const balances=await WarehouseBalance.find({productId:data.productId}).select("quantity").session(session).lean<any[]>();
    const allocated=balances.reduce((n,b)=>n+Number(b.quantity||0),0);
    const available=Math.max(0,Number(product.onHand||0)-Number(product.reserved||0));
    if(allocated+data.quantity>available)throw new HttpError(409,"Cannot allocate more than available recorded physical stock");
   }else{
    const source=await WarehouseBalance.findOneAndUpdate({productId:data.productId,locationId:data.fromLocationId,quantity:{$gte:data.quantity}},{$inc:{quantity:-data.quantity}},{new:true,session});
    if(!source)throw new HttpError(409,"Insufficient location balance; nothing transferred");
   }
   await WarehouseBalance.findOneAndUpdate({productId:data.productId,locationId:data.toLocationId},{$inc:{quantity:data.quantity}}, {upsert:true,new:true,session,setDefaultsOnInsert:true});
   const [event]=await WarehouseEvent.create([{...data,actorId:actor.id}],{session});
   await Audit.create([{actorId:actor.id,action:"warehouse."+data.kind,entity:"WarehouseEvent",entityId:String(event._id),details:{productId:data.productId,quantity:data.quantity}}],{session});
   result={id:String(event._id),alreadyApplied:false};
  },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});}finally{await session.endSession();}
  return Response.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"Concurrent operation or duplicate key. Refresh and retry the same operation key."},{status:409});return apiError(e);}
}
