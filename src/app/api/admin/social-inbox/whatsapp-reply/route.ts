import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {SocialInbound,SocialOutbound,Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({recipient:z.string().regex(/^\d{8,15}$/),text:z.string().trim().min(1).max(2000),requestId:z.string().uuid()}).strict();
export async function POST(req:Request){
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin","support"],"support.view");
  const {recipient,text,requestId}=schema.parse(await req.json());
  const token=process.env.WHATSAPP_ACCESS_TOKEN,phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID;
  if(!token||!phoneId||!process.env.META_APP_SECRET||!process.env.WHATSAPP_VERIFY_TOKEN)throw new HttpError(503,"WhatsApp Cloud API not configured");
  await db();
  const inbound=await SocialInbound.findOne({provider:"whatsapp",senderId:recipient}).sort({eventAt:-1,receivedAt:-1}).lean<any>();
  const eventTime=inbound?.eventAt?new Date(inbound.eventAt).getTime():0;
  if(!eventTime||eventTime>Date.now()+60000||Date.now()-eventTime>23*3600000)throw new HttpError(409,"No verified recent inbound WhatsApp message. Approved business template is required outside the customer service window.");
  try{await SocialOutbound.create({provider:"whatsapp",inboundEventId:inbound.eventId,recipient,text,requestId,actorId:actor.id})}
  catch(e:any){if(e?.code===11000)throw new HttpError(409,"Duplicate reply request; inspect outbound history before retrying");throw e}
  try{
   const response=await fetch("https://graph.facebook.com/v23.0/"+encodeURIComponent(phoneId)+"/messages",{
    method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify({messaging_product:"whatsapp",recipient_type:"individual",to:recipient,type:"text",text:{preview_url:false,body:text}}),
    signal:AbortSignal.timeout(15000)
   });
   const result=await response.json().catch(()=>null);
   const mid=result?.messages?.[0]?.id;
   if(!response.ok||typeof mid!=="string")throw Error("Provider did not confirm message ID");
   await SocialOutbound.updateOne({requestId,state:"processing"},{$set:{state:"sent",providerMessageId:mid}});
   await Audit.create({actorId:actor.id,action:"social.whatsapp.reply_submitted",entity:"SocialOutbound",entityId:requestId,details:{provider:"whatsapp",providerMessageId:mid}}).catch(()=>{});
   return Response.json({submitted:true,providerMessageId:mid,deliveryConfirmed:false},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch{
   await SocialOutbound.updateOne({requestId,state:"processing"},{$set:{state:"needs_review",error:"provider_confirmation_unavailable"}}).catch(()=>{});
   throw new HttpError(502,"Provider confirmation unavailable; check WhatsApp Manager before any retry. This request is locked against duplicates.");
  }
 }catch(e){return apiError(e)}
}
