import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin","purchasing"]);
  await db();
  const products=await Product.find({active:true,supplierId:{$ne:null},$expr:{$lt:[{$subtract:["$onHand","$reserved"]},"$reorderLevel"]}})
   .select("sku name costPaisa onHand reserved reorderLevel supplierId").sort({sku:1}).limit(100).lean<any[]>();
  return Response.json({suggestions:products.map(p=>{
   const available=Math.max(0,Number(p.onHand||0)-Number(p.reserved||0));
   const target=Math.max(0,Number(p.reorderLevel||0));
   return {id:String(p._id),sku:String(p.sku),name:String(p.name),costPaisa:Number(p.costPaisa||0),
    onHand:Number(p.onHand||0),reserved:Number(p.reserved||0),supplierId:String(p.supplierId),
    suggestedQuantity:Math.min(100000,Math.max(0,target-available))};
  }),limitedTo:100,note:"Planning suggestions only; costs and supplier availability require independent verification."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
