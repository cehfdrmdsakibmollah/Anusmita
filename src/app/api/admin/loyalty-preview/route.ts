import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Order} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin","finance","analyst"],"customers.view");
  await db();
  const records=await Order.aggregate([
   {$match:{isTest:false,orderStatus:"delivered",paymentStatus:"paid","customer.phone":{$type:"string",$ne:""}}},
   {$group:{_id:"$customer.phone",orders:{$sum:1},value:{$sum:"$totalPaisa"}}},
   {$group:{_id:null,
    platinum:{$sum:{$cond:[{$gte:["$value",5000000]},1,0]}},
    gold:{$sum:{$cond:[{$and:[{$gte:["$value",1000000]},{$lt:["$value",5000000]}]},1,0]}},
    silver:{$sum:{$cond:[{$and:[{$gt:["$value",0]},{$lt:["$value",1000000]}]},1,0]}},
    customers:{$sum:1}}}
  ]);
  const count=records[0]||{customers:0,silver:0,gold:0,platinum:0};
  return Response.json({eligibleCustomers:count.customers,preview:{silver:count.silver,gold:count.gold,platinum:count.platinum},
   thresholdsBDT:{silver:"paid delivered order value below 10,000 BDT",gold:"10,000 to below 50,000 BDT",platinum:"50,000 BDT or more"},
   disclaimer:"Illustrative, unapproved tier rules. Based on exact stored phone and paid/delivered status, not proven unique identity, refunds, net customer spend or external settlement. No tier is granted."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
