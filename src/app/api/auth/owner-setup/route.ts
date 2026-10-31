import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {z} from "zod";
import {db} from "@/lib/db";
import {User} from "@/lib/models";
import {assertOrigin,apiError,HttpError} from "@/lib/auth";
export const runtime="nodejs";
const schema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(14).max(128),confirmPassword:z.string()}).refine(x=>x.password===x.confirmPassword,{message:"Passwords do not match",path:["confirmPassword"]});
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const data=schema.parse(await request.json());
  await db();
  const hash=createHash("sha256").update(data.token).digest("hex");
  const tokens=mongoose.connection.collection("owner_setup_tokens");
  const claim=await tokens.findOneAndDelete({tokenHash:hash,expiresAt:{$gt:Date.now()},used:false});
  if(!claim)throw new HttpError(400,"Setup link is invalid or expired. Request a new secure link.");
  const passwordHash=await bcrypt.hash(data.password,12);
  const updated=await User.updateOne({email:claim.email,role:"owner",active:false},{$set:{passwordHash,active:true,loginFailures:0,lockedUntil:null}});
  if(updated.modifiedCount!==1)throw new HttpError(409,"Owner setup already completed or account unavailable.");
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
