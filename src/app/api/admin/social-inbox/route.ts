import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {SocialInbound} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin","support"],"support.view");
  await db();
  const rows=await SocialInbound.find({}).sort({receivedAt:-1}).limit(50).select("provider senderId text eventAt receivedAt").lean<any[]>();
  return Response.json({messages:rows.map(x=>({id:String(x._id),provider:String(x.provider),senderId:String(x.senderId),
   text:String(x.text),eventAt:x.eventAt,receivedAt:x.receivedAt})),enabled:process.env.META_INBOX_ENABLED==="true",whatsappConfigured:Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID&&process.env.WHATSAPP_VERIFY_TOKEN&&process.env.META_APP_SECRET),
   disclaimer:"Signed inbound Messenger/Instagram/WhatsApp events only; WhatsApp agent replies require a verified recent inbound message. External connectivity must be tested."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
