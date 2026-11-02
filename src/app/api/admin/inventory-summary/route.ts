import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,StockMovement} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(){try{
 await authorize(["owner","admin","inventory","purchasing"],"inventory.view");await db();
 const [summary,movements]=await Promise.all([
 Product.aggregate([{$match:{archived:{$ne:true}}},{$group:{_id:null,physical:{$sum:"$onHand"},reserved:{$sum:"$reserved"},valuationPaisa:{$sum:{$multiply:["$onHand","$costPaisa"]}},skus:{$sum:1},low:{$sum:{$cond:[{$lte:[{$subtract:["$onHand","$reserved"]},"$reorderLevel"]},1,0]}},expiring:{$sum:{$cond:[{$and:[{$ne:["$expiryAt",null]},{$lte:["$expiryAt",new Date(Date.now()+60*86400000)]}]},1,0]}}}}]),
 StockMovement.find().sort({createdAt:-1}).limit(8).select("type deltaOnHand deltaReserved productId note createdAt").lean<any[]>()
 ]);
 const totals=summary[0]||{physical:0,reserved:0,valuationPaisa:0,skus:0,low:0,expiring:0};
 return Response.json({summary:{...totals,available:totals.physical-totals.reserved,valuationMethod:"Recorded unit cost × on hand (not FIFO)"},movements:movements.map(m=>({id:String(m._id),type:m.type,deltaOnHand:m.deltaOnHand,deltaReserved:m.deltaReserved,productId:String(m.productId),createdAt:m.createdAt,note:m.note}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e)}}