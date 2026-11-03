import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {ProviderConnection} from "@/lib/models";
export const dynamic="force-dynamic";
type Integration={id:string;name:string;group:string;configured:boolean;verified:boolean;missing:string[];instructions:string;credentialTested:boolean};
const definitions=[
 {id:"pathao",name:"Pathao",group:"Courier & COD",keys:["PATHAO_CLIENT_ID","PATHAO_CLIENT_SECRET"],instructions:"Official merchant account, verified callback signatures and sandbox shipment required"},
 {id:"steadfast",name:"Steadfast",group:"Courier & COD",keys:["STEADFAST_API_KEY","STEADFAST_SECRET_KEY"],instructions:"Verify API access, idempotency and settlement mapping before activation"},
 {id:"redx",name:"REDX",group:"Courier & COD",keys:["REDX_API_TOKEN"],instructions:"Verify official API permissions and authenticated tracking callbacks"},
 {id:"meta",name:"Meta Pixel / CAPI",group:"Marketing",keys:["META_PIXEL_ID","META_CAPI_ACCESS_TOKEN"],instructions:"Verify test events and deduplication before enabling purchase events"},
 {id:"ga4",name:"GA4",group:"Marketing",keys:["NEXT_PUBLIC_GA_MEASUREMENT_ID"],instructions:"Verify event consent and Realtime DebugView"},
 {id:"whatsapp",name:"WhatsApp Cloud API",group:"Social Inbox",keys:["WHATSAPP_ACCESS_TOKEN","WHATSAPP_PHONE_NUMBER_ID","WHATSAPP_VERIFY_TOKEN","META_APP_SECRET"],instructions:"Signed inbound receiver and guarded agent reply implemented; Meta webhook subscription and live messaging test required"},
 {id:"messenger",name:"Messenger / Instagram inbound",group:"Social Inbox",keys:["META_INBOX_ENABLED","META_APP_SECRET","META_WEBHOOK_VERIFY_TOKEN"],instructions:"Inbound receiver exists; set META_INBOX_ENABLED=true only after Meta app review and signed webhook testing. No reply API connected."},
 {id:"sms",name:"SMS / OTP",group:"Customer messaging",keys:["SMS_PROVIDER_API_KEY"],instructions:"Requires approved provider, verified sender and consent policy"},
 {id:"payment",name:"Payment Gateway",group:"Payment & COD",keys:["PAYMENT_GATEWAY_API_KEY"],instructions:"Requires independent merchant verification, callback signatures and reconciliation testing"},
 {id:"r2",name:"Cloudflare R2 media",group:"Cloud & Storage",keys:["R2_MEDIA_SECRET","R2_MEDIA_URL"],instructions:"Existing image storage; validate upload and access through the media management workflow"},
 {id:"nagad",name:"Nagad",group:"Payment & COD",keys:["NAGAD_MERCHANT_ID"],instructions:"Merchant integration is not enabled; secure credentials and reconciliation required"},
 {id:"bkash",name:"bKash",group:"Payment & COD",keys:["BKASH_APP_KEY"],instructions:"Merchant API is not verified; no automatic charge or capture"},
 {id:"searchconsole",name:"Google Search Console",group:"Marketing",keys:["GOOGLE_SITE_VERIFICATION"],instructions:"Verify domain ownership, property and indexing reports separately"}
] as const;
export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");
  await db();
  const providerRecords=await ProviderConnection.find({provider:{$in:["steadfast","whatsapp"]}}).select("provider configurationVerifiedAt lastTestResult").lean<any[]>();
  const integrations:Integration[]=definitions.map(d=>{
   const missing=d.keys.filter(k=>!process.env[k]||(k==="META_INBOX_ENABLED"&&process.env[k]!=="true"));
   const stored=providerRecords.find(p=>p.provider===d.id);
   const credentialTested=Boolean(stored?.configurationVerifiedAt && stored?.lastTestResult==="verified");
   return {id:d.id,name:d.name,group:d.group,configured:missing.length===0,verified:false,credentialTested,missing,instructions:d.instructions};
  });
  return Response.json({integrations,notes:"Credential presence is not a successful API connection. No credential values are returned. A read-only credential test is not proof of live service health. No service is activated by this page."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
