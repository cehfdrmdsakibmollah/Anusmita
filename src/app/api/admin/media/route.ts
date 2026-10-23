
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,Audit} from "@/lib/models";
import {driveImages,findDriveMedia,driveImageUrl,driveViewUrl} from "@/lib/drive-media";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const attachSchema=z.object({
 productId:z.string().regex(/^[a-f0-9]{24}$/i),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 fileId:z.string().regex(/^[\w-]{12,120}$/),
 operation:z.enum(["add","remove"])
}).strict();

export async function GET(req:Request){
 try {
  await authorize(["owner","admin","inventory"]);
  const params=new URL(req.url).searchParams;
  const q=(params.get("q")||"").toLocaleLowerCase().trim().slice(0,90);
  const origin=params.get("origin")||"All";
  if(!["All","China","Japan","Korea"].includes(origin))throw new HttpError(400,"Invalid origin");
  const page=Math.max(1,Math.min(10000,Number(params.get("page"))||1));
  const limit=24;
  const found=driveImages.filter(x=>(origin==="All"||x.origin===origin)&&(!q||(x.name+" "+x.category+" "+x.origin).toLowerCase().includes(q)));
  const rows=found.slice((page-1)*limit,page*limit).map(x=>({...x,previewUrl:driveImageUrl(x.id,320),viewUrl:driveViewUrl(x.id)}));
  return Response.json({items:rows,total:found.length,page,pages:Math.ceil(found.length/limit),byOrigin:{Korea:268,Japan:176,China:211},warning:"Public Google Drive thumbnails are not a guaranteed CDN; verify each selected file in a logged-out browser."},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","inventory"]);
  const data=attachSchema.parse(await req.json());
  const media=findDriveMedia(data.fileId);
  if(!media)throw new HttpError(404,"This file is not in the reviewed ANUSMITA Drive media index");
  const imageUrl=driveImageUrl(data.fileId);
  await db();
  let result:any;
  const session=await mongoose.startSession();
  try {
   await session.withTransaction(async()=>{
    const product=await Product.findById(data.productId).session(session);
    if(!product)throw new HttpError(404,"Product not found");
    if(new Date(product.updatedAt).getTime()!==new Date(data.expectedUpdatedAt).getTime())
       throw new HttpError(409,"Product changed. Reload it before editing images.");
    const previous=[...(product.imageUrls||[])];
    const current=previous.filter((link:string)=>link!==imageUrl);
    if(data.operation==="add"){
     if(previous.includes(imageUrl)){
      result={productId:String(product._id),imageUrls:previous,updatedAt:product.updatedAt};
      return;
     }
     if(current.length>=12)throw new HttpError(409,"Maximum 12 images per product");
     current.push(imageUrl);
    }
    if(data.operation==="remove" && previous.length===current.length){
     result={productId:String(product._id),imageUrls:previous,updatedAt:product.updatedAt};return;
    }
    product.imageUrls=current;
    await product.save({session});
    await Audit.create([{actorId:actor.id,action:"product.drive_media_"+data.operation,entity:"Product",entityId:String(product._id),details:{fileId:data.fileId,origin:media.origin}}],{session});
    result={productId:String(product._id),imageUrls:current,updatedAt:product.updatedAt};
   });
  }finally{await session.endSession();}
  return Response.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
