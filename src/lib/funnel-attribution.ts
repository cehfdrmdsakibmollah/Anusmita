import "server-only";
import {SignJWT,jwtVerify} from "jose";
import {funnelSlug} from "./funnel-pages";

export const funnelAttributionCookie="anusmita_funnel_attribution";
export const funnelAttributionSeconds=24*60*60;
const purpose="funnel-order-attribution";

function key(){
 const secret=process.env.SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("Attribution signing unavailable");
 return new TextEncoder().encode(secret);
}

export async function signFunnelAttribution(slug:string){
 return new SignJWT({purpose}).setProtectedHeader({alg:"HS256"})
  .setSubject(funnelSlug.parse(slug)).setIssuedAt().setExpirationTime("24h").sign(key());
}

export async function verifyFunnelAttribution(token:string|undefined){
 if(!token||token.length>1024)return undefined;
 try{
  const {payload}=await jwtVerify(token,key(),{algorithms:["HS256"],requiredClaims:["exp","iat","sub"]});
  if(payload.purpose!==purpose)return undefined;
  const slug=funnelSlug.safeParse(payload.sub);
  return slug.success?slug.data:undefined;
 }catch{return undefined;}
}
