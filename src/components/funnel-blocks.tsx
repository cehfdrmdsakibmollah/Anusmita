import type {CSSProperties} from "react";
import Link from "next/link";
import FunnelCountdown from "./funnel-countdown";
import FunnelSlides from "./funnel-slides";
import {funnelDeviceStyleVariables,funnelResponsiveFields,safeFunnelStyle,safeFunnelUrl,type FunnelDevice,type funnelBlock} from "@/lib/funnel-pages";
import type {z} from "zod";
import "./funnel-public.css";
type Block=z.infer<typeof funnelBlock>;
function Button({url,label}:{url:string;label:string}){
 const href=safeFunnelUrl(url);
 if(!href)return null;
 if(href.startsWith("/"))return <Link className="anFunnelCta" href={href}>{label||"Shop Now"}</Link>;
 return <a className="anFunnelCta" href={href} rel="noopener noreferrer" target="_blank">{label||"Shop Now"}</a>;
}
export function FunnelBlocks({blocks,selected,selectedSlide,onPick,onPickSlide,preview}:{preview?:FunnelDevice;blocks:Block[];selected?:string|null;selectedSlide?:string|null;onPick?:(id:string)=>void;onPickSlide?:(blockId:string,slideId:string)=>void}){
 function renderBlock(block:Block,nested=false){
  const base=safeFunnelStyle(block.style);
  const style:CSSProperties={...base};
  if(nested){
   for(const key of Object.keys(funnelResponsiveFields)){
    for(const scope of ["base","tablet","mobile"])Object.assign(style,{["--funnel-"+scope+"-"+key]:"initial"});
   }
  }
  Object.assign(style,funnelDeviceStyleVariables(block.responsiveStyle,preview));
  if(block.kind==="group"){
   delete style.display;
   delete style.gridTemplateColumns;
   delete style.gap;
  }
  if(block.responsiveStyle){
   const responsiveProperties=["width","minHeight","margin","padding","fontSize"] as const;
   for(const key of responsiveProperties){
    if(base[key]!==undefined){
     Object.assign(style,{["--funnel-base-"+key]:base[key]});
     delete style[key];
    }
   }
  }
  const image=safeFunnelUrl(block.imageUrl,true);
  const headingStyle:CSSProperties={color:style.color,fontFamily:style.fontFamily,fontSize:block.responsiveStyle&&base.fontSize?"var(--funnel-active-fontSize, var(--funnel-base-fontSize))":style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,textAlign:style.textAlign};
  const content=<>
   {block.kind==="group"?<>
    {block.title&&<h2 style={headingStyle}>{block.title}</h2>}
    {block.body&&<p>{block.body}</p>}
    <div className="anFunnelGroupGrid" style={{"--funnel-group-columns":block.style.gridColumns??"2",gap:base.gap} as CSSProperties}>
     {block.children?.map(child=>renderBlock(child,true))}
    </div>
    {!!onPick&&!block.children?.length&&<p>Add blocks from the Elements panel.</p>}
   </>:block.kind==="divider"?<hr/>:
   block.kind==="slider"||block.kind==="carousel"?<FunnelSlides slides={block.slides} mode={block.kind} autoplay={block.autoplay} intervalMs={block.intervalMs} showArrows={block.showArrows} showDots={block.showDots} editing={!!onPick} selectedSlide={selected===block.id?selectedSlide:undefined} onPickSlide={onPickSlide?slideId=>onPickSlide(block.id,slideId):undefined}/>:
   block.kind==="banner"?<div className="anFunnelHeroGrid anFunnelBanner"><div><h2 style={headingStyle}>{block.title}</h2><p>{block.body}</p>{block.buttonLabel&&<Button url={block.buttonUrl} label={block.buttonLabel}/>}</div>{image?<img src={image} alt={block.title||"Campaign banner"}/>:<div className="anFunnelImagePlaceholder">Add banner image</div>}</div>:
   block.kind==="image"?<figure className="anFunnelEditableImage">
    {image?<img loading="lazy" src={image} alt={block.title||"Campaign image"}/>:<div className="anFunnelImagePlaceholder">Add a campaign image</div>}
    {(block.body||block.buttonLabel||(block.title&&block.title!=="New image"))&&<figcaption>
     {block.title&&block.title!=="New image"&&<h2 style={headingStyle}>{block.title}</h2>}
     {block.body&&<p>{block.body}</p>}
     {block.buttonLabel&&<Button url={block.buttonUrl} label={block.buttonLabel}/>}
    </figcaption>}
   </figure>:
   block.kind==="hero"?<div className="anFunnelHeroGrid"><div><span className="anFunnelEyebrow">ANUSMITA · DISCOVER YOUR GLOW</span><h1 style={headingStyle}>{block.title}</h1><p>{block.body}</p>{block.buttonLabel&&<Button url={block.buttonUrl} label={block.buttonLabel}/>}</div>{image&&<img loading="eager" src={image} alt={block.title}/>}</div>:
   block.kind==="heading"?<h2 style={headingStyle}>{block.title}</h2>:
   block.kind==="paragraph"?<p>{block.body}</p>:
   block.kind==="button"?<Button url={block.buttonUrl} label={block.buttonLabel}/>:
   block.kind==="countdown"?<div className="anFunnelCountdown"><h2>{block.title||"Limited time offer"}</h2><FunnelCountdown expiresAt={block.expiresAt}/><p>{block.body}</p></div>:
   block.kind==="faq"?<><h2>{block.title}</h2><div className="anFunnelFaq">{block.items.map((item,i)=><details key={i}><summary>{item.title}</summary><p>{item.body}</p></details>)}</div></>:
   block.kind==="features"||block.kind==="trust"?<><h2>{block.title}</h2><div className="anFunnelFeatureGrid">{block.items.map((item,i)=><article key={i}><strong>{item.title}</strong><p>{item.body}</p></article>)}</div></>:
   block.kind==="coupon"?<div className="anFunnelCoupon"><h2>{block.title}</h2><p>{block.body}</p><code>{block.buttonLabel}</code></div>:null}
  </>;
  return onPick?
   <div key={block.id} data-funnel-group={block.kind==="group"?"":undefined} data-responsive={block.responsiveStyle?"":undefined} className={"anFunnelBlock anFunnelEditable"+(selected===block.id?" selected":"")} style={style} onClick={event=>{event.preventDefault();event.stopPropagation();onPick(block.id)}} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"&&e.target===e.currentTarget){e.stopPropagation();onPick(block.id)}}}>{content}</div>:
   <section key={block.id} data-funnel-group={block.kind==="group"?"":undefined} data-responsive={block.responsiveStyle?"":undefined} className="anFunnelBlock" style={style}>{content}</section>;
 }
 return <div className="anFunnelBody" data-funnel-preview={preview}>{blocks.map(block=>renderBlock(block))}</div>;
}
