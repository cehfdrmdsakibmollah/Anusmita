import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","sales","support","analyst"],"customers.view");
  const params=new URL(request.url).searchParams;
  const page=Math.min(100,Math.max(1,Number.parseInt(params.get("page")||"1",10)||1));
  await db();
  // Group by recorded normalized Bangladeshi phone; don't create customer accounts or inferred profiles.
  const stages:any[]=[
   {$match:{isTest:false,"customer.phone":{$type:"string", $ne:""}}},
   {$project:{phone:{$trim:{input:"$customer.phone"}},name:"$customer.name",orderStatus:1,totalPaisa:1,createdAt:1}},
   {$match:{phone:{$ne:""}}},
   {$group:{_id:"$phone",name:{$last:"$name"},orderCount:{$sum:1},
    deliveredCount:{$sum:{$cond:[{$eq:["$orderStatus","delivered"]},1,0]}},
    deliveredValuePaisa:{$sum:{$cond:[{$eq:["$orderStatus","delivered"]},"$totalPaisa",0]}},
    lastOrderAt:{$max:"$createdAt"}}},
   {$sort:{lastOrderAt:-1,_id:1}},{$skip:(page-1)*30},{$limit:30}
  ];
  const customers=await Order.aggregate(stages);
  return Response.json({page,customers:customers.map((c:any)=>({
   phone:String(c._id),name:String(c.name||""),orderCount:c.orderCount,
   deliveredCount:c.deliveredCount,deliveredValuePaisa:c.deliveredValuePaisa,lastOrderAt:c.lastOrderAt,
   tier:"Unassigned"
  })),notice:"Unverified customer contacts grouped by exact stored phone. Delivered value is not verified collected revenue. No VIP entitlement is assigned."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
