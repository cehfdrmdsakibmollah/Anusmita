import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  await authorize(["owner","admin","sales","support","analyst"],"customers.view");
  const params=new URL(request.url).searchParams;
  const page=Math.min(100,Math.max(1,Number.parseInt(params.get("page")||"1",10)||1));
  const pageSize=params.get("perPage")==="10"?10:30;
  await db();
  // Group by recorded normalized Bangladeshi phone; don't create customer accounts or inferred profiles.
  const stages:any[]=[
   {$match:{isTest:false,"customer.phone":{$type:"string", $ne:""}}},
   {$project:{phone:{$trim:{input:"$customer.phone"}},name:"$customer.name",orderStatus:1,totalPaisa:1,createdAt:1,district:"$customer.district"}},
   {$match:{phone:{$ne:""}}},
   {$group:{_id:"$phone",name:{$last:"$name"},district:{$last:"$district"},orderCount:{$sum:1},
    deliveredCount:{$sum:{$cond:[{$eq:["$orderStatus","delivered"]},1,0]}},
    deliveredValuePaisa:{$sum:{$cond:[{$eq:["$orderStatus","delivered"]},"$totalPaisa",0]}},
    lastOrderAt:{$max:"$createdAt"},lastDeliveredAt:{$max:{$cond:[{$eq:["$orderStatus","delivered"]},"$createdAt",null]}},cancelledCount:{$sum:{$cond:[{$eq:["$orderStatus","cancelled"]},1,0]}},returnedCount:{$sum:{$cond:[{$eq:["$orderStatus","returned"]},1,0]}}}},
   {$sort:{lastOrderAt:-1,_id:1}},{$skip:(page-1)*pageSize},{$limit:pageSize}
  ];
  const customers=await Order.aggregate(stages);
  // Transparent RFM heuristics on recorded deliveries; no VIP benefit or fraud verdict.
  const now=Date.now();
  function rfm(c:any){
   const count=Number(c.deliveredCount||0),amount=Number(c.deliveredValuePaisa||0);
   if(!count)return "No delivery";
   const days=c.lastDeliveredAt?Math.max(0,Math.floor((now-new Date(c.lastDeliveredAt).getTime())/86400000)):9999;
   if(days<=90&&count>=5&&amount>=5000000)return "Champions";
   if(days<=180&&count>=3)return "Loyal";
   if(days<=90)return "Recent";
   if(days>365)return "Dormant";
   return "Needs engagement";
  }
  return Response.json({page,customers:customers.map((c:any)=>({
   phone:String(c._id),name:String(c.name||""),district:String(c.district||""),orderCount:c.orderCount,
   deliveredCount:c.deliveredCount,deliveredValuePaisa:c.deliveredValuePaisa,lastOrderAt:c.lastOrderAt,
   tier:"Unassigned",rfmSegment:rfm(c),cancelledCount:c.cancelledCount||0,returnedCount:c.returnedCount||0,lastDeliveredAt:c.lastDeliveredAt||null
  })),notice:"Unverified customer contacts grouped by exact stored phone. Delivered value is not verified collected revenue. RFM is a descriptive rule-based cohort of recorded deliveries; no VIP entitlement or fraud verdict is assigned."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
