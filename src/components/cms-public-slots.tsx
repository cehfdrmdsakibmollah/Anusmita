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
  {slots.map(slot=><section key={slot.id} className={"anCmsPublicSlot anCmsKind-"+slot.kind+" anCmsImage-"+slot.style.imagePosition+" anCmsAlign-"+slot.style.alignment} aria-label={slot.title} style={{background:slot.style.background,color:slot.style.textColor,borderRadius:slot.style.radius,minHeight:slot.kind==="hero"?300:slot.kind==="text"?120:210}}> 
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
