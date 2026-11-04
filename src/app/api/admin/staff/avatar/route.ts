import {randomUUID} from "node:crypto";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {User,Audit} from "@/lib/models";
import {db} from "@/lib/db";
export const runtime="nodejs";
const MAX=1024*1024;
function config(){
 const base=process.env.R2_MEDIA_URL,secret=process.env.R2_MEDIA_SECRET;
 if(!base||!secret||secret.length<32)throw new HttpError(503,"Profile media storage unavailable");
 const u=new URL(base);
 if(u.origin!=="https://anusmita-media.mdsakibmolla545.workers.dev"||u.pathname!=="/"||u.search||u.hash)throw new HttpError(503,"Media storage misconfigured");
 return {base:u.origin,headers:{Authorization:"Bearer "+secret}};
}
export async function POST(request:Request){
 let uploadedUrl:string|undefined;let c:ReturnType<typeof config>|undefined;
 try{
  assertOrigin(request);
  const actor=await authorize(["owner","admin","sales","finance","inventory","purchasing","support","analyst"]);
  const contentLength=request.headers.get("content-length");
  if(contentLength!==null){const length=Number(contentLength);if(!Number.isFinite(length)||length>MAX+16000)throw new HttpError(413,"Upload an image under 1 MB");}
  const data=await request.formData();
  const file=data.get("file");
  if(!(file instanceof File)||file.size<1||file.size>MAX||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new HttpError(400,"Use JPEG, PNG or WebP under 1 MB");
  const bytes=Buffer.from(await file.arrayBuffer());
  const isJpeg=bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  const isPng=bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const isWebp=bytes.length>=12&&bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
  if(!((file.type==="image/jpeg"&&isJpeg)||(file.type==="image/png"&&isPng)||(file.type==="image/webp"&&isWebp)))throw new HttpError(415,"Image content does not match selected type");
  c=config();
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const key="public/staff-avatars/"+actor.id+"/"+randomUUID()+"."+ext;
  const url=c.base+"/"+key;
  const upload=await fetch(url,{method:"PUT",headers:{...c.headers,"Content-Type":file.type,"Content-Length":String(bytes.length)},body:new Uint8Array(bytes),signal:AbortSignal.timeout(20000)});
  if(!upload.ok){console.error("Staff avatar R2 upload rejected",upload.status);throw new HttpError(502,"Cloudflare R2 rejected avatar upload (HTTP "+upload.status+"). Check Worker deployment and upload secret.");}
  const check=await fetch(url,{method:"HEAD",signal:AbortSignal.timeout(10000)});
  if(!check.ok)throw new HttpError(502,"Avatar was uploaded but image could not be read from Cloudflare R2");
  uploadedUrl=url;
  await db();
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const user=await User.findOne({_id:actor.id,active:true}).session(session);
   if(!user)throw new HttpError(403,"Staff account unavailable");
   const previousUrl=user.avatarUrl||"";
   user.avatarUrl=url;
   await user.save({session});
   await Audit.create([{actorId:actor.id,action:"staff.avatar_updated",entity:"User",entityId:actor.id,details:{previousUrl,newKey:key,bytes:bytes.length}}],{session});
  });uploadedUrl=undefined}finally{await session.endSession()}
  return Response.json({avatarUrl:url},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){if(uploadedUrl&&c)await fetch(uploadedUrl,{method:"DELETE",headers:c.headers,signal:AbortSignal.timeout(10000)}).catch(()=>{});return apiError(e)}
}