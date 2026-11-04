import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {CmsPageSlot,Audit} from "@/lib/models";
import {cmsSaveSchema,cmsSlotPages,cmsSlots,defaultCmsNativeHero} from "@/lib/cms-page-slots";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function GET(req:Request){
 try{
  await authorize(["owner","admin"],"settings.view");
  const page=new URL(req.url).searchParams.get("page");
  if(!page||!cmsSlotPages.some(p=>p===page))throw new HttpError(400,"Unsupported CMS page");
  await db();const record=await CmsPageSlot.findOne({page}).lean<any>();
  return Response.json({page,revision:record?.revision||0,publishedRevision:record?.publishedRevision||0,draft:record?.draft||[],published:record?.published||[],publishedAt:record?.publishedAt||null,nativeDraft:record?.nativeDraft||defaultCmsNativeHero,nativePublished:record?.nativePublished||defaultCmsNativeHero},{headers});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);const actor=await authorize(["owner","admin"],"settings.edit");
  if(Number(req.headers.get("content-length")||0)>50000)throw new HttpError(413,"Page content too large");
  const input=cmsSaveSchema.parse(await req.json());await db();
  // CAS revision prevents overwriting another editor. The initial insert is guarded by
  // the unique page index. This operation never touches product or checkout collections.
  const existing=await CmsPageSlot.findOne({page:input.page}).select("revision").lean<any>();
  const revision=Number(existing?.revision||0);
  if(revision!==input.revision)throw new HttpError(409,"Page updated elsewhere; reload before editing");
  let row:any;
  const update:any={$set:{draft:input.slots,nativeDraft:input.nativeHero,lastEditedBy:actor.id},$inc:{revision:1}};
  if(input.action==="publish"){update.$set.published=input.slots;update.$set.nativePublished=input.nativeHero;update.$set.publishedRevision=revision+1;update.$set.publishedAt=new Date();}
  if(existing){
   row=await CmsPageSlot.findOneAndUpdate({page:input.page,revision:input.revision},update,{new:true,runValidators:true});
  }else{
   if(input.revision!==0)throw new HttpError(409,"Invalid first revision");
   try{row=await CmsPageSlot.create({page:input.page,draft:input.slots,published:input.action==="publish"?input.slots:[],nativeDraft:input.nativeHero,nativePublished:input.action==="publish"?input.nativeHero:defaultCmsNativeHero,revision:1,publishedRevision:input.action==="publish"?1:0,publishedAt:input.action==="publish"?new Date():null,lastEditedBy:actor.id});}
   catch(e:any){if(e?.code===11000)throw new HttpError(409,"Concurrent page edit; reload");throw e;}
  }
  if(!row)throw new HttpError(409,"Concurrent page edit; reload");
  await Audit.create({actorId:actor.id,action:"cms.pageSlots."+input.action,entity:"CmsPageSlot",entityId:input.page,details:{revision:row.revision,slotCount:input.slots.length}});
  return Response.json({page:input.page,revision:row.revision,publishedRevision:row.publishedRevision,draft:row.draft,published:row.published,nativeDraft:row.nativeDraft||defaultCmsNativeHero,nativePublished:row.nativePublished||defaultCmsNativeHero,publishedAt:row.publishedAt},{headers});
 }catch(e){return apiError(e);}
}
