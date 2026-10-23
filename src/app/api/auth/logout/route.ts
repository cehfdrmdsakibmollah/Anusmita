
import { NextResponse } from "next/server";
import { SESSION,assertOrigin,apiError } from "@/lib/auth";
export async function POST(request:Request) {
 try{
  assertOrigin(request);
  const res=NextResponse.json({ok:true});
  res.cookies.set(SESSION,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
  return res;
 }catch(e){return apiError(e);}
}
