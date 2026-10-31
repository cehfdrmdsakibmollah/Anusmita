import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {SocialInbound} from "@/lib/models";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  await authorize(["owner","admin","support"]);
  await db();
  const rows=await SocialInbound.find({}).sort({receivedAt:-1}).limit(50).select("provider senderId text eventAt receivedAt").lean<any[]>();
  return Response.json({messages:rows.map(x=>({id:String(x._id),provider:String(x.provider),senderId:String(x.senderId),
   text:String(x.text),eventAt:x.eventAt,receivedAt:x.receivedAt})),enabled:process.env.META_INBOX_ENABLED==="true",
   disclaimer:"Inbound Messenger/Instagram only, when official provider webhook is configured and signed. No automatic replies, WhatsApp sync or chat-to-order automation."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
