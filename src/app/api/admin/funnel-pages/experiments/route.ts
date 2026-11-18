import {apiError,assertOrigin,authorize,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {FunnelExposure,FunnelPage,Order} from "@/lib/models";
import {readExperiment,signExperiment} from "@/lib/funnel-experiment";
import {funnelSlug} from "@/lib/funnel-pages";

const headers={"Cache-Control":"private, no-store"};
export async function POST(request:Request){
 try{
  assertOrigin(request);
  await authorize(["owner","admin"],"settings.edit");
  const params=new URL(request.url).searchParams;
  const a=funnelSlug.parse(params.get("a")),b=funnelSlug.parse(params.get("b"));
  if(a===b)throw new HttpError(400,"Select two different campaigns");
  await db();
  const count=await FunnelPage.countDocuments({slug:{$in:[a,b]},published:true,archived:{$ne:true},
   $or:[{endsAt:null},{endsAt:{$gt:new Date()}}]});
  if(count!==2)throw new HttpError(409,"Both campaigns must be published and available");
  return Response.json({token:await signExperiment(a,b)},{status:201,headers});
 }catch(error){return apiError(error);}
}
export async function GET(request:Request){
 try{
  await authorize(["owner","admin"],"settings.view");
  const experiment=await readExperiment(new URL(request.url).searchParams.get("token")??"");
  if(!experiment)throw new HttpError(404,"Experiment link is invalid or expired");
  await db();
  const rows=await FunnelExposure.aggregate<{_id:"a"|"b";assignments:number;converting:number}>([
   {$match:{experiment:experiment.id}},
   {$lookup:{from:Order.collection.name,localField:"assignment",foreignField:"funnelAssignment",
    pipeline:[{$match:{isTest:{$ne:true}}},{$limit:1},{$project:{_id:1}}],as:"orders"}},
   {$group:{_id:"$variant",assignments:{$sum:1},converting:{$sum:{$size:"$orders"}}}}
  ]).option({maxTimeMS:5000});
  const variants=(["a","b"] as const).map(key=>{
   const row=rows.find(item=>item._id===key);
   return {slug:experiment[key],assignments:row?.assignments??0,converting:row?.converting??0};
  });
  return Response.json({variants},{headers});
 }catch(error){return apiError(error);}
}
