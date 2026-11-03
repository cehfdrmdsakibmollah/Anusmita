import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit,SocialInbound} from "@/lib/models";
export const dynamic="force-dynamic";
export const runtime="nodejs";
/** Internal operational records only, not evidence that a remote provider is healthy. */
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");await db();
  const since=new Date(Date.now()-86400000);
  const [events,actions]=await Promise.all([
   SocialInbound.aggregate([
    {$match:{receivedAt:{$gte:since},provider:{$in:["whatsapp","messenger","instagram"]}}},
    {$group:{_id:"$provider",count:{$sum:1},latest:{$max:"$receivedAt"}}}
   ]),
   Audit.find({$or:[{action:/^integration\./},{action:/^integrations\./}]}).sort({createdAt:-1}).limit(25).select("action entity createdAt").lean<any[]>()
  ]);
  return Response.json({windowHours:24,recordedInbound:events.map((x:any)=>({provider:x._id,count:x.count,lastEventAt:x.latest})),recentActions:actions.map(x=>({action:x.action,entity:x.entity,createdAt:x.createdAt})),note:"Internal received-message records and audit metadata only. Does not verify webhook delivery success rate, API uptime, authentication or latency."},{headers:{"Cache-Control":"private, no-store"}})
 }catch(e){return apiError(e)}
}
