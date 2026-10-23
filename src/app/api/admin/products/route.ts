
import mongoose from "mongoose";
import { authorize,assertOrigin,apiError,HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Product,StockMovement,Audit } from "@/lib/models";
import { productSchema } from "@/lib/validation";
export async function POST(request:Request) {
 try {
  assertOrigin(request);
  const actor=await authorize(["owner","admin","inventory"]);
  const data=productSchema.parse(await request.json());
  await db();
  let created:any;const session=await mongoose.startSession();
  try {
   await session.withTransaction(async()=>{
    const [product]=await Product.create([data],{session});
    created=product;
    if(data.onHand) await StockMovement.create([{productId:product._id,type:"receive",deltaOnHand:data.onHand,actorId:actor.id,note:"Opening stock"}],{session});
    await Audit.create([{actorId:actor.id,action:"product.created",entity:"Product",entityId:String(product._id),details:{sku:data.sku}}],{session});
   });
  }finally{await session.endSession();}
  return Response.json({id:String(created._id),sku:created.sku},{status:201});
 }catch(e:any){if(e?.code===11000)return Response.json({error:"SKU or slug already exists"},{status:409});return apiError(e);}
}
