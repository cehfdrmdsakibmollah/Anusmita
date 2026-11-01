import "server-only";
import {createCipheriv,randomBytes} from "node:crypto";
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {ProviderConnection,Audit} from "@/lib/models";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.discriminatedUnion("provider",[
 z.object({provider:z.literal("steadfast"),apiKey:z.string().trim().min(10).max(500),secretKey:z.string().trim().min(10).max(500)}).strict(),
 z.object({provider:z.literal("whatsapp"),accessToken:z.string().trim().min(30).max(4096),phoneNumberId:z.string().regex(/^[0-9]{6,30}$/)}).strict()
]);
const removal=z.object({provider:z.enum(["steadfast","whatsapp"])}).strict();
function vaultKey(){const raw=process.env.INTEGRATION_VAULT_KEY;if(!raw)throw new HttpError(503,"Encrypted credential vault not configured: set INTEGRATION_VAULT_KEY on the server.");
 const key=Buffer.from(raw,"base64");if(key.length!==32)throw new HttpError(503,"INTEGRATION_VAULT_KEY must be 32 random bytes encoded in base64.");return key;}
function encrypt(value:object){const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",vaultKey(),iv);const body=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);return {payloadCipher:body.toString("base64"),iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64")};}
async function checkProvider(input:z.infer<typeof schema>):Promise<boolean>{
 const signal=AbortSignal.timeout(8000);
 try{
  if(input.provider==="steadfast"){
   const response=await fetch("https://portal.packzy.com/api/v1/get_balance",{method:"GET",headers:{"Api-Key":input.apiKey,"Secret-Key":input.secretKey,"Accept":"application/json"},redirect:"error",cache:"no-store",signal});
   if(!response.ok)return false;
   const body=await response.json();return Number(body?.status)===200&&Number.isFinite(Number(body?.current_balance));
  }
  const version=/^v\d+\.0$/.test(process.env.META_GRAPH_API_VERSION||"")?process.env.META_GRAPH_API_VERSION:"v24.0";
  const response=await fetch("https://graph.facebook.com/"+version+"/"+encodeURIComponent(input.phoneNumberId)+"?fields=id,display_phone_number,verified_name",{method:"GET",headers:{"Authorization":"Bearer "+input.accessToken,"Accept":"application/json"},redirect:"error",cache:"no-store",signal});
  if(!response.ok)return false;
  const body=await response.json();return String(body?.id)===input.phoneNumberId&&typeof body?.display_phone_number==="string";
 }catch{return false;}
}
export async function GET(){
 try{await authorize(["owner","admin"],"settings.view");await db();
 const rows=await ProviderConnection.find({}).select("provider configurationVerifiedAt enabled lastTestResult updatedAt").lean<any[]>();
 return Response.json({providers:["steadfast","whatsapp"].map(provider=>{const x=rows.find(r=>r.provider===provider);return {provider,configured:Boolean(x),credentialsTested:Boolean(x?.configurationVerifiedAt),lastTestResult:x?.lastTestResult||"not_tested",enabled:false,updatedAt:x?.updatedAt||null};}),vaultReady:Boolean(process.env.INTEGRATION_VAULT_KEY),note:"Credential verification is read-only. Shipment creation, COD synchronization, outbound WhatsApp and webhooks remain disabled until independently implemented and approved."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner"],"settings.edit");const input=schema.parse(await request.json());vaultKey();
 const verified=await checkProvider(input);
 if(!verified)return Response.json({error:"Official provider read-only credential test failed. No credentials saved or activation performed."},{status:422});
 const {payloadCipher,iv,tag}=encrypt(input);
 await db();const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{
  await ProviderConnection.findOneAndUpdate({provider:input.provider},{$set:{payloadCipher,iv,tag,configurationVerifiedAt:new Date(),lastTestResult:"verified",enabled:false,updatedBy:actor.id}},{upsert:true,runValidators:true,session});
  await Audit.create([{actorId:actor.id,action:"integration.credentials.verified",entity:"ProviderConnection",entityId:input.provider,details:{provider:input.provider,enabled:false}}],{session});
 });}finally{await session.endSession();}
 return Response.json({provider:input.provider,credentialsTested:true,operationallyEnabled:false});
 }catch(e){return apiError(e);}
}
export async function DELETE(request:Request){
 try{assertOrigin(request);const actor=await authorize(["owner"],"settings.edit");const input=removal.parse(await request.json());await db();const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{await ProviderConnection.deleteOne({provider:input.provider},{session});await Audit.create([{actorId:actor.id,action:"integration.credentials.revoked",entity:"ProviderConnection",entityId:input.provider,details:{provider:input.provider}}],{session});});}finally{await session.endSession();}
 return Response.json({provider:input.provider,revoked:true});
 }catch(e){return apiError(e);}
}
