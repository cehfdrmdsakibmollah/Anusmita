import {NextResponse} from "next/server";
import {apiError,assertOrigin,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {FunnelPage} from "@/lib/models";
import {funnelSlug} from "@/lib/funnel-pages";
import {funnelAttributionCookie,funnelAttributionSeconds,signFunnelAttribution} from "@/lib/funnel-attribution";

const cookie={httpOnly:true,sameSite:"lax",secure:true,path:"/"} as const;
const headers={"Cache-Control":"private, no-store"};
export async function POST(request:Request){
 try{
  assertOrigin(request);
  // The action is initiated by a same-origin storefront control.
  if(!request.headers.has("origin"))throw new HttpError(403,"Origin required");
  const slug=funnelSlug.parse(new URL(request.url).searchParams.get("slug"));
  await db();
  if(!await FunnelPage.exists({slug,published:true,archived:{$ne:true},$or:[{endsAt:null},{endsAt:{$gt:new Date()}}]}))
   throw new HttpError(404,"Published funnel unavailable");
  const response=NextResponse.json({enabled:true},{headers});
  response.cookies.set(funnelAttributionCookie,await signFunnelAttribution(slug),{...cookie,maxAge:funnelAttributionSeconds});
  return response;
 }catch(error){return apiError(error);}
}
export async function DELETE(request:Request){
 try{
  assertOrigin(request);
  if(!request.headers.has("origin"))throw new HttpError(403,"Origin required");
  const response=NextResponse.json({enabled:false},{headers});
  response.cookies.set(funnelAttributionCookie,"",{...cookie,maxAge:0});
  return response;
 }catch(error){return apiError(error);}
}
