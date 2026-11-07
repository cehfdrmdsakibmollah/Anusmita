"use client";
import {useEffect,useRef,useState} from "react";
import {nativeCmsSelectors,nativeCmsCardSelectors,renderNativeCmsCssRules,type CmsCssRule} from "@/lib/cms-css-rules";
import type {CmsNativeHero,CmsSlotPage} from "@/lib/cms-page-slots";
import {nativeTextTargets} from "@/lib/cms-native-bindings";
type Target=CmsCssRule["target"];
type Props={page:CmsSlotPage;src:string;width:number;revision:number;draft:CmsNativeHero;onPick:(target:Target,slotId?:string)=>void};
/** Same-origin visual inspection of the ACTUAL storefront. Preview mutations are never persisted. */
export default function CmsLiveVisualCanvas({page,src,width,revision,draft,onPick}:Props){
 const frame=useRef<HTMLIFrameElement>(null);
 const originals=useRef(new WeakMap<Element,string>());
 const [loaded,setLoaded]=useState(0);
 const viewport=useRef<HTMLDivElement>(null);
 const [fitWidth,setFitWidth]=useState(680);
 const [problem,setProblem]=useState("");
 const hero=nativeCmsSelectors[page];
 useEffect(()=>{const el=viewport.current;if(!el)return;const observer=new ResizeObserver(entries=>setFitWidth(Math.max(280,entries[0]?.contentRect.width||680)));observer.observe(el);return()=>observer.disconnect();},[]);
 const scale=Math.min(1,fitWidth/width);
 useEffect(()=>{
  const iframe=frame.current;let doc:Document|null=null;
  try{doc=iframe?.contentDocument||null;}catch{setProblem("The storefront did not allow same-origin visual inspection.");return;}
  if(!doc||!doc.body||!loaded)return;
  const root=doc.querySelector(hero) as HTMLElement|null;
  if(!root){setProblem("Native hero selector is not available on this storefront route. Existing published page is still shown.");}
  else setProblem("");
  const remember=(node:Element)=>{if(!originals.current.has(node))originals.current.set(node,node.innerHTML);};
  const write=(node:Element|null,value:string)=>{if(!node)return;remember(node);if(value)node.textContent=value;else node.innerHTML=originals.current.get(node)||"";};
  const h1=root?.querySelector("h1")||null;
  const p=root?.querySelector(".dp-hero-copy p, .gc-hero-copy p, .cs-hero-copy p, p")||null;
  write(h1,draft.title);
  write(p,draft.subtitle);
  const sectionSelectors:Record<string,string>={shop:".anShopHeading h2",deals:"#deals-title",bundles:"#routine-title","gift-cards":"#gc-title","pre-orders":"#po-journey-title","customer-stories":"#cs-gallery-title","routine-quiz":".rq-help h2","track-order":"#to-form-title",cart:".anFlowHero h2",checkout:".anFlowCheckoutIntro h2",wishlist:".sheetEmpty h2"};
  write(doc.querySelector(sectionSelectors[page]||"___cms_no_match"),draft.sectionTitle);
  for(const promo of draft.promoCards){
   const card=doc.querySelector('[data-cms-promo-id="'+promo.id+'"]') as HTMLElement|null;
   if(!card)continue;
   card.style.display=promo.enabled?"":"none";
   const label=card.querySelector("h3");write(label,promo.title);
   const media=card.querySelector(".dp-product-photo, .bp-card-photo") as HTMLElement|null;
   if(media){
    let image=media.querySelector('img[data-cse-promo-image]') as HTMLImageElement|null;
    if(promo.imageUrl){
     if(!image){image=doc.createElement("img");image.dataset.csePromoImage="";image.style.cssText="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:1";media.appendChild(image);}
     image.src=promo.imageUrl;
    }else image?.remove();
   }
  }
  for(const [key,selector] of Object.entries(nativeTextTargets[page])){
   const entry=draft.textBindings.find(x=>x.key===key&&x.enabled);
   write(doc.querySelector(selector),entry?.text||"");
  }
  if(root){
   if(draft.background!=="#fff6f9")root.style.setProperty("background-color",draft.background,"important");
   else root.style.removeProperty("background-color");
   const heading=root.querySelector("h1") as HTMLElement|null;
   if(heading){if(draft.textColor!=="#611b37")heading.style.setProperty("color",draft.textColor,"important");else heading.style.removeProperty("color");}
   if(draft.imageUrl){
    const imageId="cse-local-draft-image";
    let image=root.querySelector<HTMLImageElement>('[data-cse-local-image]');
    if(!image){image=doc.createElement("img");image.dataset.cseLocalImage=imageId;root.appendChild(image);}
    image.src=draft.imageUrl;image.alt="Unpublished CMS hero image";image.style.cssText="position:absolute;z-index:1;right:0;top:0;width:38%;height:100%;object-fit:contain;pointer-events:none;";
    if(getComputedStyle(root).position==="static")root.style.position="relative";
   }else root.querySelector("[data-cse-local-image]")?.remove();
  }
  const cssId="cse-local-draft-style";
  let style=doc.getElementById(cssId) as HTMLStyleElement|null;
  if(!style){style=doc.createElement("style");style.id=cssId;doc.head.appendChild(style);}
  style.textContent=renderNativeCmsCssRules(page,draft.cssRules);
  const outlineId="cse-live-picker-style";
  let picker=doc.getElementById(outlineId) as HTMLStyleElement|null;
  if(!picker){picker=doc.createElement("style");picker.id=outlineId;doc.head.appendChild(picker);}
  picker.textContent="[data-cse-picked]{outline:3px solid #ba1759!important;outline-offset:-3px;cursor:crosshair!important;}body *{cursor:crosshair!important;}";
  const prevent=(event:Event)=>{event.preventDefault();event.stopImmediatePropagation();};
  const choose=(event:MouseEvent)=>{
   const element=event.target as Element|null;
   if(!element||element.nodeType!==1)return;
   prevent(event);
   doc?.querySelectorAll("[data-cse-picked]").forEach(e=>e.removeAttribute("data-cse-picked"));
   const slot=element.closest("[data-cms-slot]");
   if(slot){slot.setAttribute("data-cse-picked","");onPick("hero",slot.getAttribute("data-cms-slot")||undefined);return;}
   const cardSel=nativeCmsCardSelectors[page];
   const card=cardSel?element.closest(cardSel):null;
   const promoId=card?.getAttribute("data-cms-promo-id");
   let target:Target="hero",chosen:Element|null=root;
   // The actual clicked child wins over its enclosing card.
   if(card){
    chosen=card;
    if(element.closest("img,svg,.dp-product-photo,.bp-card-photo"))target="image";
    else if(element.closest("h3"))target="heading";
    else if(element.closest("button,a"))target="button";
    else target="card";
    chosen=element.closest("img,svg,h3,button,a")||card;
   }else if(element.closest("button,a")){target="button";chosen=element.closest("button,a");}
   else if(element.closest("h1,h2,h3")){target="heading";chosen=element.closest("h1,h2,h3");}
   else if(element.closest("img,svg")){target="image";chosen=element.closest("img,svg");}
   else if(root&&root.contains(element)){chosen=root;target="hero";}
   chosen?.setAttribute("data-cse-picked","");
   if(promoId){onPick(target,"promo:"+promoId);return;}
   for(const [key,selector] of Object.entries(nativeTextTargets[page])){
    if(element.closest(selector)){onPick(target,"text:"+key);return;}
   }
   if(root?.querySelector("h1")?.contains(element)){onPick("heading","field:title");return;}
   if(root?.querySelector(".dp-hero-copy p, .gc-hero-copy p, .cs-hero-copy p, p")?.contains(element)){onPick("heading","field:subtitle");return;}
   if(element.closest(sectionSelectors[page]||"___cms_no_match")){onPick("heading","field:sectionTitle");return;}
   if(element.closest(".dp-native-section-image,.bp-native-section-image")){onPick("image","field:sectionImageUrl");return;}
   if(root?.contains(element)&&target==="image"){onPick("image","field:imageUrl");return;}
   onPick(target);
  };
  doc.addEventListener("click",choose,true);
  doc.addEventListener("submit",prevent,true);
  return ()=>{doc?.removeEventListener("click",choose,true);doc?.removeEventListener("submit",prevent,true);};
 },[page,hero,draft,loaded,onPick]);
 return <div className="cse-live-editor" aria-label={"Real "+page+" storefront visual editor"}>
  <div className="cse-real-banner"><strong>Actual storefront canvas</strong><span>Click a real heading, image, card or button to select its available CMS styling controls. Links and form submissions are disabled inside this editing preview only.</span></div>
  {problem&&<p className="cse-notice" role="status">{problem}</p>}
  <div ref={viewport} className="cse-live-fit-viewport" role="region" aria-label="Interactive real page canvas" tabIndex={0}><div className="cse-live-fit-stage" style={{height:Math.max(500,Math.round(1100*scale))}}>
   <iframe ref={frame} key={src+revision} src={src} width={width} className="cse-live-frame" style={{width,maxWidth:"none",height:Math.max(1000,Math.ceil(660/scale)),transform:`scale(${scale})`,transformOrigin:"top left"}} title={"Editable preview of "+page} loading="eager" onLoad={()=>{originals.current=new WeakMap();setLoaded(v=>v+1);}}/>
  </div></div>
 </div>;
}
