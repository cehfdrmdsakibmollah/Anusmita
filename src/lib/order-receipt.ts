import "server-only";
import {SignJWT,jwtVerify} from "jose";
const key=()=>{const value=process.env.SESSION_SECRET;if(!value||value.length<32)throw new Error("Receipt signing unavailable");return new TextEncoder().encode(value);};
export async function signOrderReceipt(orderId:string){return new SignJWT({purpose:"order-receipt"}).setProtectedHeader({alg:"HS256"}).setSubject(orderId).setIssuedAt().setExpirationTime("24h").sign(key());}
export async function verifyOrderReceipt(token:string){try{const {payload}=await jwtVerify(token,key(),{algorithms:["HS256"]});if(payload.purpose!=="order-receipt"||typeof payload.sub!=="string"||!/^[0-9a-f]{24}$/i.test(payload.sub))return null;return payload.sub;}catch{return null;}}
