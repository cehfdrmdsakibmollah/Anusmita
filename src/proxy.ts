import {NextResponse,type NextRequest} from "next/server";
import {jwtVerify} from "jose";
import {currentStoreSettings} from "@/lib/store-settings-server";
import {User} from "@/lib/models";
import {maintenanceExemptPath,maintenanceHtml} from "@/lib/maintenance-access";

export async function proxy(request:NextRequest){
 if(!process.env.MONGODB_URI||maintenanceExemptPath(request.nextUrl.pathname))return NextResponse.next();
 try{
  const policy=await currentStoreSettings();
  if(!policy.maintenanceEnabled)return NextResponse.next();
  const token=request.cookies.get("anusmita_session")?.value;
  const secret=process.env.SESSION_SECRET;
  if(token&&secret&&secret.length>=32){
   try{
    const {payload}=await jwtVerify(token,new TextEncoder().encode(secret),{algorithms:["HS256"]});
    if(typeof payload.sub==="string"&&/^[a-f0-9]{24}$/i.test(payload.sub)&&await User.exists({_id:payload.sub,active:true,role:"owner"}))
     return NextResponse.next({headers:{"Cache-Control":"private, no-store"}});
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
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|woff2?|css|js)$).*)"]};
