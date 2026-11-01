
import { authorize,authorizePermission,apiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { Order } from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 try{
  await authorizePermission(["owner","admin","sales","finance","support","analyst"],"orders.view");
  await db();
  const params=new URL(request.url).searchParams;
  const page=Math.max(1,Math.min(10000,Number(params.get("page"))||1));
  const status=params.get("status");
  const filter=status&&["placed","confirmed","packed","shipped","delivered","cancelled","returned"].includes(status)?{orderStatus:status}:{};
  const orders=await Order.find(filter).sort({createdAt:-1}).skip((page-1)*30).limit(30).select("-requestHash -idempotencyKey").lean();
  return Response.json({orders,page},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
