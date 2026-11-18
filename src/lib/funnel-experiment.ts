import "server-only";
import {randomUUID} from "node:crypto";
import {SignJWT,jwtVerify} from "jose";
import {z} from "zod";
import {funnelSlug} from "./funnel-pages";

export const funnelExperiment=z.object({id:z.string().uuid(),a:funnelSlug,b:funnelSlug})
 .refine(value=>value.a!==value.b,"Select two different campaigns");

const day=24*60*60*1000;

function key(){
 const secret=process.env.SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("Experiment links unavailable");
 return new TextEncoder().encode(secret);
}
export async function signExperiment(a:string,b:string){
 const experiment=funnelExperiment.parse({id:randomUUID(),a,b});
 return new SignJWT({experiment}).setProtectedHeader({alg:"HS256",typ:"JWT"})
  .setAudience("funnel-experiment").setIssuedAt().setExpirationTime("31d").sign(key());
}
export async function readExperiment(token:string){
 if(token.length>1024)return undefined;
 try{
  const {payload}=await jwtVerify(token,key(),{audience:"funnel-experiment",algorithms:["HS256"],requiredClaims:["exp","iat"]});
  const result=funnelExperiment.safeParse(payload.experiment);
  if(!result.success||typeof payload.iat!=="number")return undefined;
  return {...result.data,endsAt:payload.iat*1000+30*day,resultsEndAt:payload.iat*1000+31*day};
 }catch{return undefined;}
}
