
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {cloudinaryPublicId} from "@/lib/cloudinary-media";
import {managedAssetId} from "@/lib/cloudinary-signature";
import {attachManagedAsset} from "@/lib/cloudinary-server";
export const runtime="nodejs";
const body=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/i),url:z.url().max(650),
 expectedUpdatedAt:z.iso.datetime({offset:true})}).strict();
export async function POST(req:Request){
 try{
  assertOrigin(req);const user=await authorize(["owner","admin","inventory"]);
  const data=body.parse(await req.json());
  const publicId=cloudinaryPublicId(data.url);
  if(!publicId||!managedAssetId(publicId))throw new HttpError(400,"Only verified, managed ANUSMITA Cloudinary assets are accepted");
  const result=await attachManagedAsset({productId:data.productId,expectedUpdatedAt:data.expectedUpdatedAt,publicId,actorId:user.id});
  if(data.url!==result.secureUrl)throw new HttpError(409,"Cloudinary canonical URL differs from the pasted link. Use the verified original URL.");
  return Response.json(result);
 }catch(e){return apiError(e);}
}
