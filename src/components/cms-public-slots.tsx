import {db} from "@/lib/db";
import {CmsPageSlot} from "@/lib/models";
import {cmsSlots,cmsNativeHeroSchema,type CmsSlotPage,type CmsSlot} from "@/lib/cms-page-slots";
import {shouldRenderCmsIntro} from "@/lib/cms-page-editor-support";
import {nativeCmsSelectors,nativeCmsCardSelectors,renderCmsCssRules} from "@/lib/cms-css-rules";
import "./cms-public-slots.css";
export default async function CmsPublicSlots({page,placement}:{page:CmsSlotPage;placement:"before"|"after"}){
 let slots:CmsSlot[]=[];
 let intro:ReturnType<typeof cmsNativeHeroSchema.parse>|null=null;
 let nativeRules="";
 if(process.env.MONGODB_URI)try{
  await db();
  const data=await CmsPageSlot.findOne({page}).select("published nativePublished").lean<any>();
  const parsed=cmsSlots.safeParse(data?.published||[]);
  if(parsed.success)slots=parsed.data.filter(x=>x.enabled&&x.placement===placement).sort((a,b)=>a.position-b.position);
  if(placement==="before"&&shouldRenderCmsIntro(page,data?.nativePublished))intro=cmsNativeHeroSchema.parse(data.nativePublished);
  if(placement==="before"&&data?.nativePublished){const checked=cmsNativeHeroSchema.safeParse(data.nativePublished);if(checked.success){const hero=nativeCmsSelectors[page];if(hero)nativeRules=renderCmsCssRules(checked.data.cssRules,`body`,{hero,heading:hero+" h1",card:nativeCmsCardSelectors[page]||".anCmsPublicNestedCard",button:hero+" a",image:hero+" img, "+hero+" svg"});}}
 }catch{/* Preserve normal storefront availability even if merchandising database fails. */}
 if(!slots.length&&!intro&&!nativeRules)return null;
 // Style-only native overrides should not create an empty padded CMS section above a storefront.
 if(!slots.length&&!intro&&nativeRules)return <style>{nativeRules}</style>;
 return <div className="anCmsPublicSlots" data-cms-page={page} data-placement={placement}>
  {nativeRules&&<style>{nativeRules}</style>}
  {intro&&<section className="anCmsPageIntro" aria-label={intro.title||page+" introduction"} style={{background:intro.background,color:intro.textColor}}>
    <div className="anCmsPageIntroCopy">{intro.title&&<h1>{intro.title}</h1>}{intro.subtitle&&<p>{intro.subtitle}</p>}</div>
    {intro.imageUrl&&<img src={intro.imageUrl} alt="" loading="lazy"/>}
  </section>}
  {slots.map(slot=><div key={slot.id} className="anCmsStyledSlot" data-cms-slot={slot.id}>
  {slot.cssRules.length>0&&<style>{renderCmsCssRules(slot.cssRules,`[data-cms-slot="${slot.id}"]`,{hero:".anCmsPublicSlot, .anCmsPublicGridSection",heading:"h2",card:".anCmsPublicNestedCard",button:"a",image:"img"})}</style>}
  {slot.kind==="grid"?<section className="anCmsPublicGridSection" aria-label={slot.title} style={{background:slot.style.background,color:slot.style.textColor,borderRadius:slot.style.radius,padding:slot.style.padding}}>
   {slot.badge&&<p className="anCmsPublicEyebrow">{slot.badge}</p>}
   <h2 style={{fontSize:slot.style.fontSize,color:slot.style.textColor,textAlign:slot.style.alignment}}>{slot.title}</h2>
   {slot.subtitle&&<p className="anCmsGridIntro">{slot.subtitle}</p>}
   <div className="anCmsPublicNestedCards">{slot.children.map(card=><article className="anCmsPublicNestedCard" key={card.id}>
    {card.imageUrl&&<img src={card.imageUrl} alt="" loading="lazy"/>}
    <div><h3>{card.title}</h3>{card.subtitle&&<p>{card.subtitle}</p>}{card.cta&&<a href={card.href} style={{backgroundColor:slot.style.accentColor}}>{card.cta} <span aria-hidden="true">→</span></a>}</div>
   </article>)}</div>
  </section>:<section key={slot.id} className={"anCmsPublicSlot anCmsKind-"+slot.kind+" anCmsImage-"+slot.style.imagePosition+" anCmsAlign-"+slot.style.alignment} aria-label={slot.title} style={{background:slot.style.background,color:slot.style.textColor,borderRadius:slot.style.radius,minHeight:slot.kind==="hero"?300:slot.kind==="text"?120:210}}> 
   <div className="anCmsPublicCopy" style={{padding:slot.style.padding,textAlign:slot.style.alignment}}>
    {slot.badge&&<p className="anCmsPublicEyebrow">{slot.badge}</p>}
    <h2 style={{fontSize:slot.style.fontSize,color:slot.style.textColor}}>{slot.title}</h2>
    {slot.subtitle&&<p>{slot.subtitle}</p>}
    {slot.cta&&<a href={slot.href} style={{backgroundColor:slot.style.accentColor,borderRadius:Math.min(slot.style.radius,24)}}>{slot.cta} <span aria-hidden>→</span></a>}
   </div>
   {slot.imageUrl&&<img src={slot.imageUrl} alt="" loading="lazy"/>}
  </section>}</div>)}
 </div>;
}
