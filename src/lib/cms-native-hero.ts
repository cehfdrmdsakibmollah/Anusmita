import {db} from "@/lib/db";
import {CmsPageSlot} from "@/lib/models";
import {cmsNativeHeroSchema,defaultCmsNativeHero,type CmsNativeHero,type CmsSlotPage} from "@/lib/cms-page-slots";
export async function publishedCmsNativeHero(page:CmsSlotPage):Promise<CmsNativeHero>{
 if(!process.env.MONGODB_URI)return defaultCmsNativeHero;
 try{
  await db();
  const data=await CmsPageSlot.findOne({page}).select("nativePublished").lean<any>();
  const parsed=cmsNativeHeroSchema.safeParse(data?.nativePublished||{});
  return parsed.success?parsed.data:defaultCmsNativeHero;
 }catch{return defaultCmsNativeHero;}
}
