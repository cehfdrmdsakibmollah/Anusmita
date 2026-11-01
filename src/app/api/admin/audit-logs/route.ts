import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit} from "@/lib/models";
export const dynamic="force-dynamic";
const allowedEntities=["Order","Product","Payment","Supplier","PurchaseOrder","User"] as const;
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","analyst"],"settings.view");
  const params=new URL(request.url).searchParams;
  const page=Math.min(1000,Math.max(1,Number.parseInt(params.get("page")||"1",10)||1));
  const entity=params.get("entity")||"";
  if(entity&&!allowedEntities.includes(entity as typeof allowedEntities[number]))
   return Response.json({error:"Unsupported entity filter"},{status:400});
  await db();
  const filter=entity?{entity}:{};
  const logs=await Audit.find(filter).sort({createdAt:-1,_id:-1})
   .skip((page-1)*30).limit(30)
   .select("actorId action entity entityId createdAt").lean();
  return Response.json({page,logs:logs.map((x:any)=>({
   id:String(x._id),actorId:x.actorId?String(x.actorId):null,
   action:String(x.action||""),entity:String(x.entity||""),
   entityId:String(x.entityId||""),createdAt:x.createdAt
  }))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
