import {z} from "zod";
const image=z.string().regex(/^https:\/\/anusmita-media\.mdsakibmolla545\.workers\.dev\/public\/(?:homepage|cms\/[a-z-]+)\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/);
export const bannerMedia=z.object({
 id:z.string().uuid(),
 revision:z.number().int().nonnegative(),
 title:z.string().trim().min(1).max(120),
 desktopUrl:image,
 mobileUrl:z.union([image,z.literal("")]).default(""),
 alt:z.string().trim().max(160),
 target:z.string().max(400).refine(value=>!value||/^\/(?!\/)[a-zA-Z0-9/?&#=_%+.-]*$/.test(value)),
 cta:z.string().max(60),
 slot:z.enum(["GENERAL_MEDIA","HOME_HERO","PROMO_STRIP"]),
 start:z.union([z.iso.datetime(),z.literal("")]),
 end:z.union([z.iso.datetime(),z.literal("")]),
 focalX:z.number().min(0).max(100),
 focalY:z.number().min(0).max(100),
 scrim:z.number().min(0).max(100),
 status:z.enum(["draft","published","archived"])
}).strict().refine(value=>!value.start||!value.end||value.start<value.end,"End must be after start")
 .refine(value=>value.status!=="published"||!!value.alt.trim(),"Published banners require alt text");
export type BannerMediaData=z.infer<typeof bannerMedia>;

export function bannerSaveUpdate(data:BannerMediaData,currentStatus?:string){
 const revision=data.revision+1;
 if(data.status==="draft"&&currentStatus==="published"){
  return {revision,draftContent:{...data,revision}};
 }
 return {...data,revision,draftContent:null};
}

export function bannerEditorData(record:Record<string,unknown>){
 const draft=record.draftContent;
 const source=draft&&typeof draft==="object"?draft as Record<string,unknown>:record;
 return bannerMedia.parse(Object.fromEntries(Object.keys(bannerMedia.shape).map(key=>[key,key==="revision"?record.revision:source[key]])));
}
