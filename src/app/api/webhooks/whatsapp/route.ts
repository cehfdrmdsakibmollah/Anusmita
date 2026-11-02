import {createHmac,timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
import {SocialInbound} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const ready=()=>Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID&&process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_VERIFY_TOKEN&&process.env.META_APP_SECRET);
export async function GET(req:Request){
 if(!ready())return new Response("Unavailable",{status:404});
 const q=new URL(req.url).searchParams;
 if(q.get("hub.mode")!=="subscribe"||q.get("hub.verify_token")!==process.env.WHATSAPP_VERIFY_TOKEN)return new Response("Forbidden",{status:403});
 const challenge=q.get("hub.challenge");
 if(!challenge||!/^[0-9]{1,120}$/.test(challenge))return new Response("Invalid challenge",{status:400});
 return new Response(challenge,{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:Request){
 if(!ready())return new Response("Unavailable",{status:404});
 if(Number(req.headers.get("content-length")||0)>100000)return new Response("Too large",{status:413});
 const raw=Buffer.from(await req.arrayBuffer());
 if(raw.length>100000)return new Response("Too large",{status:413});
 const signature=req.headers.get("x-hub-signature-256")||"";
 if(!/^sha256=[a-f0-9]{64}$/i.test(signature))return new Response("Forbidden",{status:403});
 const expected=createHmac("sha256",process.env.META_APP_SECRET!).update(raw).digest();
 if(!timingSafeEqual(expected,Buffer.from(signature.slice(7),"hex")))return new Response("Forbidden",{status:403});
 let data:any;try{data=JSON.parse(raw.toString("utf8"))}catch{return new Response("Invalid JSON",{status:400})}
 if(data?.object!=="whatsapp_business_account"||!Array.isArray(data.entry))return Response.json({received:true});
 const docs:{provider:"whatsapp";eventId:string;senderId:string;text:string;eventAt:Date|null}[]=[];
 for(const entry of data.entry.slice(0,30))for(const change of (Array.isArray(entry.changes)?entry.changes:[]).slice(0,20)){
  if(change?.field!=="messages"||change.value?.metadata?.phone_number_id!==process.env.WHATSAPP_PHONE_NUMBER_ID)continue;
  for(const m of (Array.isArray(change.value?.messages)?change.value.messages:[]).slice(0,30)){
   if(m?.type!=="text"||typeof m.id!=="string"||typeof m.from!=="string"||typeof m.text?.body!=="string")continue;
   if(!/^\d{8,15}$/.test(m.from))continue;
   const text=m.text.body.trim();if(!text)continue;
   const ts=Number(m.timestamp);
   docs.push({provider:"whatsapp",eventId:m.id.slice(0,180),senderId:m.from,text:text.slice(0,2000),eventAt:Number.isFinite(ts)&&ts>0?new Date(ts*1000):null});
  }
 }
 if(!docs.length)return Response.json({received:true});
 try{await db();await SocialInbound.bulkWrite(docs.map(d=>({updateOne:{filter:{provider:d.provider,eventId:d.eventId},update:{$setOnInsert:d},upsert:true}})),{ordered:false})}
 catch(e:any){if(!(e?.code===11000||e?.writeErrors?.every?.((w:any)=>w.code===11000)))return new Response("Retry later",{status:503})}
 return Response.json({received:true},{headers:{"Cache-Control":"no-store"}});
}
