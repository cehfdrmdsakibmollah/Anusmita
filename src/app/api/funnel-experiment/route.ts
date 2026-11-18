import {randomInt,randomUUID} from "node:crypto";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {apiError,assertOrigin,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {FunnelExposure,FunnelPage} from "@/lib/models";
import {readExperiment} from "@/lib/funnel-experiment";
import {funnelAttributionCookie,funnelAttributionSeconds,readFunnelAttribution,signFunnelAttribution} from "@/lib/funnel-attribution";

export async function POST(request:Request){
 try{
  assertOrigin(request);
  if(!request.headers.has("origin"))throw new HttpError(403,"Origin required");
  const params=new URL(request.url).searchParams;
  const experiment=await readExperiment(params.get("token")??"");
  if(!experiment||Date.now()>=experiment.endsAt)throw new HttpError(404,"Experiment unavailable");
  const allow=params.get("allow")==="yes";
  await db();
  const active=await FunnelPage.countDocuments({slug:{$in:[experiment.a,experiment.b]},published:true,archived:{$ne:true},
   $or:[{endsAt:null},{endsAt:{$gt:new Date()}}]});
  if(active!==2)throw new HttpError(409,"Both experiment campaigns must be available");
  const attribution=allow?await readFunnelAttribution((await cookies()).get(funnelAttributionCookie)?.value):undefined;
  const previous=attribution?.assignment?await FunnelExposure.findOne({experiment:experiment.id,assignment:attribution.assignment}).lean<{variant:"a"|"b"}>():null;
  const variant=previous?.variant??(randomInt(2)===0?"a":"b");
  const slug=experiment[variant];
  const response=NextResponse.json({url:"/funnel/"+slug},{headers:{"Cache-Control":"private, no-store"}});
  if(allow&&!previous){
   const assignment=randomUUID();
   const token=await signFunnelAttribution(slug,assignment);
   await FunnelExposure.create({experiment:experiment.id,variant,assignment,expiresAt:new Date(experiment.resultsEndAt)});
   response.cookies.set(funnelAttributionCookie,token,{httpOnly:true,sameSite:"lax",secure:true,path:"/",maxAge:funnelAttributionSeconds});
  }
  if(!allow)response.cookies.set(funnelAttributionCookie,"",{httpOnly:true,sameSite:"lax",secure:true,path:"/",maxAge:0});
  return response;
 }catch(error){return apiError(error);}
}
