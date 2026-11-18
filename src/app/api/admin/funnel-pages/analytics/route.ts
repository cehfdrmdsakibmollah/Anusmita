import {apiError,authorize,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {FunnelPage,Order} from "@/lib/models";
import {funnelSlug} from "@/lib/funnel-pages";

export async function GET(request:Request){
 try{
  await authorize(["owner","admin"],"settings.view");
  const params=new URL(request.url).searchParams;
  const slug=funnelSlug.parse(params.get("slug"));
  const days=params.get("days")??"30";
  if(days!=="7"&&days!=="30")throw new HttpError(400,"Select 7 or 30 days");
  await db();
  if(!await FunnelPage.exists({slug}))throw new HttpError(404,"Campaign unavailable");
  const since=new Date(Date.now()-Number(days)*86400000);
  const [totals]=await Order.aggregate<{orders:number;delivered:number;cancelledOrReturned:number}>([
   {$match:{funnelSlug:slug,createdAt:{$gte:since},isTest:{$ne:true}}},
   {$group:{_id:null,orders:{$sum:1},
    delivered:{$sum:{$cond:[{$eq:["$orderStatus","delivered"]},1,0]}},
    cancelledOrReturned:{$sum:{$cond:[{$in:["$orderStatus",["cancelled","returned"]]},1,0]}}
   }}
  ]).option({maxTimeMS:5000});
  return Response.json({orders:totals?.orders??0,delivered:totals?.delivered??0,cancelledOrReturned:totals?.cancelledOrReturned??0},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
