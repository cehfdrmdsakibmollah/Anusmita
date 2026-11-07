import {db} from "@/lib/db";
import {CmsPageSlot} from "@/lib/models";
import {cmsSlots,cmsNativeHeroSchema,type CmsSlotPage,type CmsSlot} from "@/lib/cms-page-slots";
import {shouldRenderCmsIntro} from "@/lib/cms-page-editor-support";
import CmsNativeTextBinding from "@/components/cms-native-text-binding";
import {validatePageNativeText,type CmsNativeTextEntry} from "@/lib/cms-native-bindings";
import {renderNativeCmsCssRules,renderCmsCssRules} from "@/lib/cms-css-rules";
import "./cms-public-slots.css";
export default async function CmsPublicSlots({page,placement}:{page:CmsSlotPage;placement:"before"|"after"}){
 let slots:CmsSlot[]=[];
 let intro:ReturnType<typeof cmsNativeHeroSchema.parse>|null=null;
 let nativeRules="";
 let nativeText:CmsNativeTextEntry[]=[];
 if(process.env.MONGODB_URI)try{
  await db();
  const data=await CmsPageSlot.findOne({page}).select("published nativePublished").lean<any>();
  const parsed=cmsSlots.safeParse(data?.published||[]);
  if(parsed.success)slots=parsed.data.filter(x=>x.enabled&&x.placement===placement).sort((a,b)=>a.position-b.position);
  if(placement==="before"&&shouldRenderCmsIntro(page,data?.nativePublished))intro=cmsNativeHeroSchema.parse(data.nativePublished);
  if(placement==="before"&&data?.nativePublished){const checked=cmsNativeHeroSchema.safeParse(data.nativePublished);if(checked.success){if(validatePageNativeText(page,checked.data.textBindings))nativeText=checked.data.textBindings;nativeRules=renderNativeCmsCssRules(page,checked.data.cssRules);}}
 }catch{/* Preserve normal storefront availability even if merchandising database fails. */}
 if(!slots.length&&!intro&&!nativeRules&&!nativeText.length)return null;
 // Style-only native overrides should not create an empty padded CMS section above a storefront.
 if(!slots.length&&!intro&&(nativeRules||nativeText.length))return <>{nativeRules&&<style>{nativeRules}</style>}{nativeText.length>0&&<CmsNativeTextBinding page={page} bindings={nativeText}/>}</>;
 return <div className="anCmsPublicSlots" data-cms-page={page} data-placement={placement}>
  {nativeRules&&<style>{nativeRules}</style>}
  {nativeText.length>0&&<CmsNativeTextBinding page={page} bindings={nativeText}/>}
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
    {card.subcards.length>0&&<div className="anCmsPublicSubcards">{card.subcards.map(leaf=><div className="anCmsPublicSubcard" key={leaf.id}>{leaf.imageUrl&&<img src={leaf.imageUrl} alt="" loading="lazy"/>}<div><h4>{leaf.title}</h4>{leaf.subtitle&&<p>{leaf.subtitle}</p>}{leaf.cta&&<a href={leaf.href}>{leaf.cta}</a>}</div></div>)}</div>}
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
