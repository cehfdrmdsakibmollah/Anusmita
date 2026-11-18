import {NextResponse,type NextRequest} from "next/server";
import {jwtVerify} from "jose";
import {currentStoreSettings} from "@/lib/store-settings-server";
import {User} from "@/lib/models";
import {maintenanceHtml} from "@/lib/maintenance-access";

export async function GET(request:NextRequest){
 if(!process.env.MONGODB_URI)return new NextResponse(null,{status:204,headers:{"Cache-Control":"no-store"}});
 try{
  const policy=await currentStoreSettings();
  if(!policy.maintenanceEnabled)return new NextResponse(null,{status:204,headers:{"Cache-Control":"no-store"}});
  const token=request.cookies.get("anusmita_session")?.value;
  const secret=process.env.SESSION_SECRET;
  if(token&&secret&&secret.length>=32){
   try{
    const {payload}=await jwtVerify(token,new TextEncoder().encode(secret),{algorithms:["HS256"]});
    if(typeof payload.sub==="string"&&/^[a-f0-9]{24}$/i.test(payload.sub)&&await User.exists({_id:payload.sub,active:true,role:"owner"}))
     return new NextResponse(null,{status:204,headers:{"Cache-Control":"private, no-store"}});
   }catch{/* An invalid session never grants a maintenance bypass. */}
  }
  return new NextResponse(maintenanceHtml(policy.maintenanceMessage),{status:503,headers:{
   "Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","Retry-After":"300","X-Robots-Tag":"noindex"
  }});
 }catch{
  return new NextResponse(maintenanceHtml("The store is temporarily unavailable. Please try again shortly."),{
   status:503,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Retry-After":"300"}
  });
 }
}
export const dynamic="force-dynamic";
export const runtime="nodejs";
