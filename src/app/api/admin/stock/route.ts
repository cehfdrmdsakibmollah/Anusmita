
import mongoose from "mongoose";
import { z } from "zod";
import { assertOrigin,authorize,apiError,HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Product,StockMovement,Audit } from "@/lib/models";
const schema=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/i),type:z.enum(["receive","damage","adjust"]),quantity:z.number().int().min(-100000).max(100000),note:z.string().trim().min(5).max(300)}).strict();
export async function POST(req:Request) {
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","inventory"]);
  const data=schema.parse(await req.json());
  if(data.quantity===0 || (data.type==="receive"&&data.quantity<0) || (data.type==="damage"&&data.quantity>0)) throw new HttpError(400,"Quantity sign does not match action");
  await db();
  const session=await mongoose.startSession();let inventory:any;
  try{
   await session.withTransaction(async()=>{
    const filter:any={_id:data.productId};
    if(data.quantity<0) filter.$expr={$gte:[{$subtract:["$onHand","$reserved"]},Math.abs(data.quantity)]};
    inventory=await Product.findOneAndUpdate(filter,{$inc:{onHand:data.quantity}},{new:true,session});
    if(!inventory) throw new HttpError(409,"Insufficient available stock or invalid product");
    await StockMovement.create([{productId:data.productId,type:data.type,deltaOnHand:data.quantity,actorId:actor.id,note:data.note}],{session});
    await Audit.create([{actorId:actor.id,action:"stock."+data.type,entity:"Product",entityId:data.productId,details:{quantity:data.quantity,note:data.note}}],{session});
   });
  }finally{await session.endSession();}
  return Response.json({sku:inventory.sku,onHand:inventory.onHand,reserved:inventory.reserved});
 }catch(e){return apiError(e);}
}
