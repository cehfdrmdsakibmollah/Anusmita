
import {z} from "zod";
import {authorize,authorizePermission,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {uploadReceiptToken,receiptMatches} from "@/lib/cloudinary-signature";
import {attachManagedAsset} from "@/lib/cloudinary-server";
export const runtime="nodejs";
const schema=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/i),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 publicId:z.string().min(15).max(220),timestamp:z.number().int().positive(),
 uploadToken:z.string().length(64)}).strict();
export async function POST(req:Request){
 try{
  assertOrigin(req);const user=await authorizePermission(["owner","admin","inventory"],"products.edit");
  const data=schema.parse(await req.json());
  const now=Math.floor(Date.now()/1000);
  if(now-data.timestamp>900||data.timestamp>now+30)throw new HttpError(403,"Upload authorization expired");
  const secret=process.env.SESSION_SECRET;
  if(!secret)throw new HttpError(503,"SESSION_SECRET missing");
  const correct=uploadReceiptToken(secret,user.id,data.productId,data.publicId,data.timestamp,data.expectedUpdatedAt);
  if(!receiptMatches(data.uploadToken,correct))throw new HttpError(403,"Invalid upload authorization");
  const result=await attachManagedAsset({...data,actorId:user.id});
  return Response.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
