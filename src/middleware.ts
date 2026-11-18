import {NextResponse,type NextRequest} from "next/server";
import {maintenanceExemptPath,maintenanceHtml} from "@/lib/maintenance-access";

export async function middleware(request:NextRequest){
 if(maintenanceExemptPath(request.nextUrl.pathname))return NextResponse.next();
 try{
  const response=await fetch(new URL("/api/store-maintenance",request.url),{
   headers:{cookie:request.headers.get("cookie")??""},cache:"no-store",signal:AbortSignal.timeout(12000)
  });
  if(response.status===204)return NextResponse.next({headers:{"Cache-Control":"private, no-store"}});
  if(response.status===503)return new NextResponse(await response.text(),{status:503,headers:{
   "Content-Type":"text/html; charset=utf-8","Retry-After":"300","Cache-Control":"private, no-store","X-Robots-Tag":"noindex"
  }});
 }catch{/* A failed status check must not bypass the configured storefront gate. */}
 return new NextResponse(maintenanceHtml("The store is temporarily unavailable. Please try again shortly."),{
  status:503,headers:{"Content-Type":"text/html; charset=utf-8","Retry-After":"300","Cache-Control":"no-store"}
 });
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|woff2?|css|js)$).*)"]};
