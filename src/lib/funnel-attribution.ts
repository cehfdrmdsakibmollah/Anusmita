import "server-only";
import {SignJWT,jwtVerify} from "jose";
import {z} from "zod";
import {funnelSlug} from "./funnel-pages";

export const funnelAttributionCookie="anusmita_funnel_attribution";
export const funnelAttributionSeconds=24*60*60;
const purpose="funnel-order-attribution";

function key(){
 const secret=process.env.SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("Attribution signing unavailable");
 return new TextEncoder().encode(secret);
}

const assignmentId=z.string().uuid();
export async function signFunnelAttribution(slug:string,assignment?:string){
 return new SignJWT({purpose,assignment:assignment?assignmentId.parse(assignment):undefined}).setProtectedHeader({alg:"HS256"})
  .setSubject(funnelSlug.parse(slug)).setIssuedAt().setExpirationTime("24h").sign(key());
}

export async function readFunnelAttribution(token:string|undefined){
 if(!token||token.length>1024)return undefined;
 try{
  const {payload}=await jwtVerify(token,key(),{algorithms:["HS256"],requiredClaims:["exp","iat","sub"]});
  if(payload.purpose!==purpose)return undefined;
  const slug=funnelSlug.safeParse(payload.sub);
  const assignment=assignmentId.safeParse(payload.assignment);
  return slug.success?{slug:slug.data,assignment:assignment.success?assignment.data:undefined}:undefined;
 }catch{return undefined;}
}

export async function verifyFunnelAttribution(token:string|undefined){
 return (await readFunnelAttribution(token))?.slug;
}
