
import mongoose from "mongoose";
import { authorize,authorizePermission,assertOrigin,apiError,HttpError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Product,StockMovement,Audit } from "@/lib/models";
import { productSchema } from "@/lib/validation";
export async function POST(request:Request) {
 try {
  assertOrigin(request);
  const actor=await authorizePermission(["owner","admin","inventory"],"products.edit");
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

export async function GET(req:Request) {
 try {
  await authorizePermission(["owner","admin","inventory","purchasing"],"products.view");
  await db();
  const url=new URL(req.url),page=Math.max(1,Math.min(10000,Number(url.searchParams.get("page"))||1));
  const q=(url.searchParams.get("q")||"").trim().slice(0,80);
  const filter:any=q?{$or:[{sku:{$regex:q.replace(/[^a-zA-Z0-9 _-]/g,""),$options:"i"}},{name:{$regex:q.replace(/[^a-zA-Z0-9 _-]/g,""),$options:"i"}},{brand:{$regex:q.replace(/[^a-zA-Z0-9 _-]/g,""),$options:"i"}}]}:{};
  const [products,total]=await Promise.all([
   Product.find(filter).select("sku name slug brand category origin size color colorHex variantLabel variantGroup ingredients usageInstructions topNotes heartNotes baseNotes pricePaisa costPaisa onHand reserved active updatedAt reorderLevel description imageUrls").sort({updatedAt:-1}).skip((page-1)*30).limit(30).lean<any[]>(),
   Product.countDocuments(filter)
  ]);
  return Response.json({products:products.map(p=>({...p,_id:String(p._id)})),page,pages:Math.ceil(total/30),total},{headers:{"Cache-Control":"no-store"}});
 } catch(e){return apiError(e);}
}
