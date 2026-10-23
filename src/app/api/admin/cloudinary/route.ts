
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {cloudinaryPublicId} from "@/lib/cloudinary-media";
import {managedAssetId} from "@/lib/cloudinary-signature";
import {attachManagedAsset,assetDetails} from "@/lib/cloudinary-server";
export const runtime="nodejs";
const body=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/i),url:z.url().max(650),
 expectedUpdatedAt:z.iso.datetime({offset:true})}).strict();
export async function POST(req:Request){
 try{
  assertOrigin(req);const user=await authorize(["owner","admin","inventory"]);
  const data=body.parse(await req.json());
  const publicId=cloudinaryPublicId(data.url);
  if(!publicId||!managedAssetId(publicId))throw new HttpError(400,"Only verified, managed ANUSMITA Cloudinary assets are accepted");
  const canonical=await assetDetails(publicId);
  if(!canonical||canonical.url!==data.url)throw new HttpError(409,"Paste the exact verified Cloudinary asset URL");
  const result=await attachManagedAsset({productId:data.productId,expectedUpdatedAt:data.expectedUpdatedAt,publicId,actorId:user.id});
  return Response.json(result);
 }catch(e){return apiError(e);}
}
