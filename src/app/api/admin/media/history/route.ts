
import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorizePermission(["owner","admin","inventory"],"products.view");
  await db();
  const entries=await Audit.find({action:"product.cloudinary_verified_asset","details.replacedDriveId":{$exists:true,$nin:[null,""]}})
   .sort({createdAt:-1}).limit(30).select("createdAt entityId details").lean<any[]>();
  return Response.json({items:entries.map(x=>({id:String(x._id),productId:x.entityId,createdAt:x.createdAt,
   driveFileId:x.details?.replacedDriveId||null,cloudinaryAssetId:x.details?.publicId||null}))},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
