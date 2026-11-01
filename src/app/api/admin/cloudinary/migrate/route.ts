
import {z} from "zod";
import {authorize,authorizePermission,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {findDriveMedia} from "@/lib/drive-media";
import {mediaCredentials,mediaDailyQuota,assetDetails,uploadDriveAsset,attachManagedAsset} from "@/lib/cloudinary-server";
export const runtime="nodejs";
export const maxDuration=60;
const schema=z.object({productId:z.string().regex(/^[a-f0-9]{24}$/i),
 expectedUpdatedAt:z.iso.datetime({offset:true}),fileId:z.string().regex(/^[\w-]{12,120}$/),
 confirmed:z.literal(true)}).strict();
export async function POST(req:Request){
 try {
  assertOrigin(req);const actor=await authorize(["owner","admin","inventory"],"products.edit");
  const data=schema.parse(await req.json());
  const source=findDriveMedia(data.fileId);
  if(!source)throw new HttpError(404,"Image is not in the indexed Google Drive collections");
  if(!["image/jpeg","image/png","image/webp"].includes(source.mimeType))
   throw new HttpError(400,"HEIC cannot be migrated automatically: convert to JPEG/WebP first");
  if(source.bytes>10*1024*1024 || source.bytes<=0)throw new HttpError(400,"Source exceeds Cloudinary image size limit");
  mediaCredentials();
  const publicId="anusmita/drive/"+source.origin.toLowerCase()+"/drive-"+source.id;
  let file=await assetDetails(publicId);
  const uploadedNow=!file;
  if(!file){
   await mediaDailyQuota(actor.id);
   file=await uploadDriveAsset(publicId,source.id);
  }
  const result=await attachManagedAsset({actorId:actor.id,productId:data.productId,
    expectedUpdatedAt:data.expectedUpdatedAt,publicId,replaceDriveId:source.id});
  return Response.json({...result,importedToCloudinary:uploadedNow,reusedExisting:!uploadedNow},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
