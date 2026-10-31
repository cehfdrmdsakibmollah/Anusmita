import {createHmac,timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
import {SocialInbound} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function active(){return process.env.META_INBOX_ENABLED==="true"&&Boolean(process.env.META_APP_SECRET)&&Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN);}
export async function GET(request:Request){
 if(!active())return new Response("Unavailable",{status:404});
 const q=new URL(request.url).searchParams;
 if(q.get("hub.mode")!=="subscribe"||q.get("hub.verify_token")!==process.env.META_WEBHOOK_VERIFY_TOKEN)return new Response("Unauthorized",{status:403});
 const challenge=q.get("hub.challenge");
 if(!challenge||!/^[0-9]{1,120}$/.test(challenge))return new Response("Bad challenge",{status:400});
 return new Response(challenge,{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 if(!active())return new Response("Unavailable",{status:404});
 if(Number(request.headers.get("content-length")||0)>100000)return new Response("Too large",{status:413});
 const raw=Buffer.from(await request.arrayBuffer());
 if(raw.length>100000)return new Response("Too large",{status:413});
 const signature=request.headers.get("x-hub-signature-256")||"";
 if(!/^sha256=[a-f0-9]{64}$/i.test(signature))return new Response("Unauthorized",{status:403});
 const expected=createHmac("sha256",process.env.META_APP_SECRET!).update(raw).digest("hex");
 const received=signature.slice(7).toLowerCase();
 if(!timingSafeEqual(Buffer.from(expected,"hex"),Buffer.from(received,"hex")))return new Response("Unauthorized",{status:403});
 let payload:any;
 try{payload=JSON.parse(raw.toString("utf8"));}catch{return new Response("Invalid JSON",{status:400});}
 if(!["page","instagram"].includes(payload?.object)||!Array.isArray(payload?.entry))return new Response("Ignored",{status:200});
 const provider=payload.object==="instagram"?"instagram":"messenger";
 const docs:{provider:string;eventId:string;senderId:string;text:string;eventAt:Date|null}[]=[];
 for(const entry of payload.entry.slice(0,30)){
  if(!Array.isArray(entry?.messaging))continue;
  for(const msg of entry.messaging.slice(0,30)){
   if(msg?.message?.is_echo||typeof msg?.message?.mid!=="string"||typeof msg?.sender?.id!=="string"||typeof msg?.message?.text!=="string")continue;
   const text=msg.message.text.trim();
   if(!text)continue;
   docs.push({provider,eventId:msg.message.mid.slice(0,180),senderId:msg.sender.id.slice(0,180),text:text.slice(0,2000),
     eventAt:Number.isFinite(msg.timestamp)?new Date(msg.timestamp):null});
  }
 }
 if(!docs.length)return Response.json({received:true});
 try{
  await db();
  await SocialInbound.bulkWrite(docs.map(d=>({updateOne:{filter:{provider:d.provider,eventId:d.eventId},update:{$setOnInsert:d},upsert:true}})),{ordered:false});
 }catch(e:any){
  // Duplicate webhook deliveries must be accepted; all other persistence failures request provider retry.
  if(!(e?.code===11000||e?.writeErrors?.every?.((w:any)=>w.code===11000)))return new Response("Retry later",{status:503});
 }
 return Response.json({received:true},{headers:{"Cache-Control":"no-store"}});
}
