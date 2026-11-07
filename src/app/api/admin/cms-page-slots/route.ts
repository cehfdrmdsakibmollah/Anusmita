import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {CmsPageSlot,Audit} from "@/lib/models";
import {cmsSaveSchema,cmsRestoreSchema,cmsRevisionSchema,cmsNativeHeroSchema,cmsSlots,cmsSlotPages,defaultCmsNativeHero} from "@/lib/cms-page-slots";
import {validatePageNativeText} from "@/lib/cms-native-bindings";
import {validateNativePromoIds} from "@/lib/cms-promo-bindings";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function GET(req:Request){
 try{
  await authorize(["owner","admin"],"settings.view");
  const page=new URL(req.url).searchParams.get("page");
  if(!page||!cmsSlotPages.some(p=>p===page))throw new HttpError(400,"Unsupported CMS page");
  await db();const record=await CmsPageSlot.findOne({page}).lean<any>();
  return Response.json({page,revision:record?.revision||0,publishedRevision:record?.publishedRevision||0,draft:record?.draft||[],published:record?.published||[],publishedAt:record?.publishedAt||null,nativeDraft:record?.nativeDraft||defaultCmsNativeHero,nativePublished:record?.nativePublished||defaultCmsNativeHero,history:(record?.history||[]).map((h:any)=>({revision:h.revision,action:h.action,createdAt:h.createdAt,slotCount:Array.isArray(h.slots)?h.slots.length:0})).reverse()},{headers});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin"],"settings.edit");
  if(Number(req.headers.get("content-length")||0)>50000)throw new HttpError(413,"Page content too large");
  const raw=await req.json();
  const input=raw?.action==="restoreDraft"?cmsRestoreSchema.parse(raw):cmsSaveSchema.parse(raw);
  await db();
  // CAS revision prevents overwriting another editor. The initial insert is guarded by
  // the unique page index. This operation never touches product or checkout collections.
  const existing=await CmsPageSlot.findOne({page:input.page}).lean<any>();
  const revision=Number(existing?.revision||0);
  if(revision!==input.revision)throw new HttpError(409,"Page updated elsewhere; reload before editing");
  let row:any;
  let nextSlots:any,nextHero:any;
  if(input.action==="restoreDraft"){
   if(!existing)throw new HttpError(404,"Page has no saved revisions");
   const snapshot=(existing.history||[]).find((h:any)=>h.revision===input.restoreRevision);
   if(!snapshot)throw new HttpError(404,"Revision not found in retained history");
   nextSlots=cmsSlots.parse(snapshot.slots);
   nextHero=cmsNativeHeroSchema.parse(snapshot.nativeHero);
  }else{
   nextSlots=input.slots;
   nextHero=input.nativeHero;
  }
  if(!validatePageNativeText(input.page,nextHero.textBindings||[]))throw new HttpError(400,"Native text binding is not approved for this page");
  if(!validateNativePromoIds(input.page,nextHero.promoCards||[]))throw new HttpError(400,"Unapproved promotional card identifier for this page");
  const snapshot={revision:revision+1,action:input.action,createdAt:new Date(),slots:nextSlots,nativeHero:nextHero};
  const history=[...(existing?.history||[]),snapshot].slice(-20);
  const update:any={$set:{draft:nextSlots,nativeDraft:nextHero,lastEditedBy:actor.id,history},$inc:{revision:1}};
  if(input.action==="publish"){update.$set.published=nextSlots;update.$set.nativePublished=nextHero;update.$set.publishedRevision=revision+1;update.$set.publishedAt=new Date();}
  if(existing){
   row=await CmsPageSlot.findOneAndUpdate({page:input.page,revision:input.revision},update,{new:true,runValidators:true});
  }else{
   if(input.revision!==0)throw new HttpError(409,"Invalid first revision");
   try{row=await CmsPageSlot.create({page:input.page,draft:nextSlots,published:input.action==="publish"?nextSlots:[],nativeDraft:nextHero,nativePublished:input.action==="publish"?nextHero:defaultCmsNativeHero,history,revision:1,publishedRevision:input.action==="publish"?1:0,publishedAt:input.action==="publish"?new Date():null,lastEditedBy:actor.id});}
   catch(e:any){if(e?.code===11000)throw new HttpError(409,"Concurrent page edit; reload");throw e;}
  }
  if(!row)throw new HttpError(409,"Concurrent page edit; reload");
  await Audit.create({actorId:actor.id,action:"cms.pageSlots."+input.action,entity:"CmsPageSlot",entityId:input.page,details:{revision:row.revision,slotCount:nextSlots.length,...(input.action==="restoreDraft"?{restoredFrom:input.restoreRevision}:{})}});
  return Response.json({page:input.page,revision:row.revision,publishedRevision:row.publishedRevision,draft:row.draft,published:row.published,nativeDraft:row.nativeDraft||defaultCmsNativeHero,nativePublished:row.nativePublished||defaultCmsNativeHero,publishedAt:row.publishedAt,history:(row.history||[]).map((h:any)=>({revision:h.revision,action:h.action,createdAt:h.createdAt,slotCount:Array.isArray(h.slots)?h.slots.length:0})).reverse()},{headers});
 }catch(e){return apiError(e);}
}
