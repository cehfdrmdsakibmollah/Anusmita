import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,Order} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin","inventory","purchasing","finance","analyst"],"inventory.view");
  await db();
  const [inventory,customerCounts]=await Promise.all([
   Product.aggregate([
    {$group:{_id:null,skuCount:{$sum:1},onHand:{$sum:"$onHand"},reserved:{$sum:"$reserved"},
     stockCostPaisa:{$sum:{$multiply:["$onHand","$costPaisa"]}},
     linkedSuppliers:{$sum:{$cond:[{$ne:["$supplierId",null]},1,0]}}}}
   ]),
   Order.aggregate([
    {$match:{isTest:false,orderStatus:"delivered",paymentStatus:"paid","customer.phone":{$type:"string",$ne:""}}},
    {$group:{_id:"$customer.phone",verifiedPaidOrderCount:{$sum:1},recordedPaidOrderValuePaisa:{$sum:"$totalPaisa"}}},
    {$group:{_id:null,customersWithPaidDeliveredOrders:{$sum:1},paidDeliveredOrders:{$sum:"$verifiedPaidOrderCount"}}}
   ])
  ]);
  return Response.json({
   inventory:inventory[0]||{skuCount:0,onHand:0,reserved:0,stockCostPaisa:0,linkedSuppliers:0},
   customerEligibility:customerCounts[0]||{customersWithPaidDeliveredOrders:0,paidDeliveredOrders:0},
   warehouseStatus:"No independent location-level stock ledger is configured. Figures are product-level totals only.",
   loyaltyStatus:"Eligibility preview only. No tiers, points or rewards have been assigned or issued.",
   integrationsStatus:"No outbound messaging, pixels, social webhooks or automatic transfers activated.",
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
