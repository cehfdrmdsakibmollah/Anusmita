
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { User } from "@/lib/models";
import { SESSION,signSession,assertOrigin,apiError,HttpError } from "@/lib/auth";
export const runtime="nodejs";
export async function POST(request:Request) {
 try {
  assertOrigin(request);
  // Keep login request validation runtime-portable on Node and Cloudflare.
  // Invalid input must return 400 before any database access or login attempt.
  let payload:unknown;
  try{payload=await request.json();}catch{throw new HttpError(400,"Invalid request");}
  if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new HttpError(400,"Invalid request");
  const data=payload as Record<string,unknown>;
  const email=typeof data.email==="string"?data.email.trim().toLowerCase():"";
  const password=typeof data.password==="string"?data.password:"";
  if(email.length>320||! /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||
     password.length<1||password.length>256)throw new HttpError(400,"Invalid request");
  await db();
  const user=await User.findOne({email:email.toLowerCase()}).select("+passwordHash");
  if(!user?.active) throw new HttpError(401,"Invalid credentials");
  if(user.lockedUntil && new Date(user.lockedUntil).getTime()>Date.now()) throw new HttpError(429,"Account temporarily locked");
  if(!(await bcrypt.compare(password,user.passwordHash))) {
   const failures=(user.loginFailures||0)+1;
   await User.updateOne({_id:user._id},{$set:{loginFailures:failures,lockedUntil:failures>=8?new Date(Date.now()+15*60*1000):null}});
   throw new HttpError(401,"Invalid credentials");
  }
  await User.updateOne({_id:user._id},{$set:{loginFailures:0,lockedUntil:null}});
  const token=await signSession(String(user._id));
  const res=NextResponse.json({ok:true,role:user.role});
  res.cookies.set(SESSION,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:12*60*60});
  return res;
 }catch(e){
  // Staging-only diagnostic category, never raw database errors, URI, or secrets.
  // Production keeps the existing generic error response unchanged.
  if(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://anusmita-store-staging.")&&
     !(e instanceof HttpError)&&e instanceof Error&&!("issues" in e)){
    const msg=e.message;
    const diagnosticCode=msg.startsWith("Refusing MongoDB connection")?"DB_URI_REJECTED":
      msg.includes("database connection unavailable")?"DB_CONNECTION_FAILED":
      msg.includes("SESSION_SECRET")?"SESSION_SECRET_INVALID":"AUTH_RUNTIME_ERROR";
    console.error("Staging login diagnostic category:",diagnosticCode);
    return Response.json({error:"Unable to process request",diagnosticCode},{status:500});
  }
  return apiError(e);
 }
}
