import "server-only";
import {SignJWT,jwtVerify} from "jose";

const key=()=>{
 const secret=process.env.SESSION_SECRET;
 if(!secret||secret.length<32)throw new Error("Review invitation signing unavailable");
 return new TextEncoder().encode(secret);
};
const objectId=(id:unknown):id is string=>typeof id==="string"&&/^[a-f0-9]{24}$/i.test(id);

/** Invites are scoped to one delivered order and one purchased product. */
export async function signReviewInvite(orderId:string,productId:string){
 if(!objectId(orderId)||!objectId(productId))throw new Error("Invalid review invitation target");
 return new SignJWT({purpose:"verified-product-review",productId})
  .setProtectedHeader({alg:"HS256"}).setSubject(orderId).setIssuedAt().setExpirationTime("7d").sign(key());
}
export async function verifyReviewInvite(token:string){
 if(!token||token.length>1800)return null;
 try{
  const {payload}=await jwtVerify(token,key(),{algorithms:["HS256"]});
  if(payload.purpose!=="verified-product-review"||!objectId(payload.sub)||!objectId(payload.productId))return null;
  return {orderId:payload.sub,productId:payload.productId};
 }catch{return null;}
}
