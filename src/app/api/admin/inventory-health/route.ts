import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  await authorizePermission(["owner","admin","inventory","purchasing"],"inventory.view");
  const params=new URL(request.url).searchParams;
  const page=Math.min(1000,Math.max(1,Number.parseInt(params.get("page")||"1",10)||1));
  const filter=params.get("filter")||"low";
  if(!["low","expiry","all"].includes(filter))return Response.json({error:"Invalid filter"},{status:400});
  await db();
  const now=new Date(),cutoff=new Date(now.getTime()+60*24*60*60*1000);
  const low={$expr:{$lte:[{$subtract:["$onHand","$reserved"]},"$reorderLevel"]}};
  const expiry={expiryAt:{$ne:null,$lte:cutoff}};
  const criteria:any={active:true,...(filter==="low"?low:filter==="expiry"?expiry:{})};
  const records=await Product.find(criteria).select("sku name onHand reserved reorderLevel expiryAt batch supplierId active")
   .sort({sku:1}).skip((page-1)*30).limit(30).lean<any[]>();
  return Response.json({page,filter,items:records.map(p=>{
   const available=Math.max(0,Number(p.onHand||0)-Number(p.reserved||0));
   const threshold=Math.max(0,Number(p.reorderLevel||0));
   return {id:String(p._id),sku:String(p.sku),name:String(p.name),onHand:p.onHand,
    reserved:p.reserved,available,reorderLevel:threshold,
    suggestedUnits:Math.max(0,threshold-available),
    expiryAt:p.expiryAt||null,batch:p.batch||"",hasSupplier:Boolean(p.supplierId)};
  }),note:"Suggested units only restore recorded available stock to the configured reorder threshold. No supplier availability or purchase order is asserted."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
