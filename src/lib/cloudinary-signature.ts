
import {createHash,createHmac,timingSafeEqual} from "node:crypto";
export function cloudinarySignature(fields:Record<string,string|number|boolean>,secret:string){
 const serialized=Object.entries(fields).filter(([k,v])=>k!=="file"&&k!=="api_key"&&k!=="signature"&&v!==undefined).sort(([a],[b])=>a.localeCompare(b))
 .map(([k,v])=>k+"="+String(v)).join("&");
 return createHash("sha1").update(serialized+secret,"utf8").digest("hex");
}
export function uploadReceiptToken(secret:string,actor:string,product:string,publicId:string,time:number,updated:string){
 return createHmac("sha256",secret).update(JSON.stringify([actor,product,publicId,time,updated])).digest("hex");
}
export function receiptMatches(provided:string,correct:string){
 if(!/^[a-f0-9]{64}$/.test(provided))return false;
 return timingSafeEqual(Buffer.from(provided,"hex"),Buffer.from(correct,"hex"));
}
export const MAX_IMAGE_BYTES=10*1024*1024;
export const LOCAL_IMAGE_TYPES=["image/jpeg","image/png","image/webp"] as const;
export function supportedUpload(type:string,size:number){
 return LOCAL_IMAGE_TYPES.includes(type as typeof LOCAL_IMAGE_TYPES[number])&&Number.isSafeInteger(size)&&size>0&&size<=MAX_IMAGE_BYTES;
}
export function managedAssetId(id:string){
 return /^anusmita\/(?:products\/[a-f0-9]{24}\/[a-f0-9-]{36}|drive\/(?:korea|japan|china)\/drive-[\w-]{12,120})$/.test(id);
}
