import {db} from "@/lib/db";
import {CmsPageSlot} from "@/lib/models";
import {cmsSlots,type CmsSlotPage,type CmsSlot} from "@/lib/cms-page-slots";
import "./cms-public-slots.css";
export default async function CmsPublicSlots({page,placement}:{page:CmsSlotPage;placement:"before"|"after"}){
 let slots:CmsSlot[]=[];
 if(process.env.MONGODB_URI)try{
  await db();
  const data=await CmsPageSlot.findOne({page}).select("published").lean<any>();
  const parsed=cmsSlots.safeParse(data?.published||[]);
  if(parsed.success)slots=parsed.data.filter(x=>x.enabled&&x.placement===placement).sort((a,b)=>a.position-b.position);
 }catch{/* Preserve normal storefront availability even if merchandising database fails. */}
 if(!slots.length)return null;
 return <div className="anCmsPublicSlots" data-cms-page={page} data-placement={placement}>
  {slots.map(slot=>slot.kind==="grid"?<section key={slot.id} className="anCmsPublicGridSection" aria-label={slot.title} style={{background:slot.style.background,color:slot.style.textColor,borderRadius:slot.style.radius,padding:slot.style.padding}}>
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
  </section>)}
 </div>;
}
