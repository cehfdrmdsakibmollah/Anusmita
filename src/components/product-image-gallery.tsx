
"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,ArrowRight,Expand,ImageOff,X,ZoomIn} from "lucide-react";
export default function ProductImageGallery({urls,name,preview=false}:{urls:string[];name:string;preview?:boolean}){
 const safe=urls.filter(Boolean).slice(0,12);
 const [index,setIndex]=useState(0),[broken,setBroken]=useState<string[]>([]),[zoom,setZoom]=useState(false);
 const active=Math.min(index,Math.max(0,safe.length-1));
 const url=safe[active]||"";
 const isBroken=!url||broken.includes(url);
 const advance=(direction:number)=>setIndex(n=>(n+direction+safe.length)%Math.max(1,safe.length));
 useEffect(()=>{
  if(!zoom)return;
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==="Escape")setZoom(false);
   if(e.key==="ArrowLeft"&&safe.length>1)setIndex(n=>(n-1+safe.length)%safe.length);
   if(e.key==="ArrowRight"&&safe.length>1)setIndex(n=>(n+1)%safe.length);
  };
  window.addEventListener("keydown",onKey);
  return()=>window.removeEventListener("keydown",onKey);
 },[zoom,safe.length]);
 return <div className={"anPdpGallery"+(preview?" isPreview":"")} aria-label={name+" photos"}>
  {safe.length>1&&<div className="anPdpThumbs" aria-label="Select a product photo">{safe.map((src,i)=>
   <button key={i} type="button" className={i===active?"active":""}
    aria-label={"Show product photo "+(i+1)} aria-pressed={i===active} onClick={()=>setIndex(i)}>
    <img src={src} alt="" loading="lazy" onError={()=>setBroken(old=>old.includes(src)?old:[...old,src])}/>
   </button>)}</div>}
  <div className="anPdpMainImage">
   {isBroken?<div className="anPdpImageFallback"><ImageOff size={38}/><p>Product image is not available yet</p><span>ANUSMITA</span></div>:
    <img src={url} alt={name+" — image "+(active+1)+" of "+safe.length} loading="eager"
     onError={()=>setBroken(old=>old.includes(url)?old:[...old,url])}/>}
   {safe.length>1&&<>
    <button className="anPdpGalleryPrev" type="button" aria-label="Previous product photo" onClick={()=>advance(-1)}><ArrowLeft size={20}/></button>
    <button className="anPdpGalleryNext" type="button" aria-label="Next product photo" onClick={()=>advance(1)}><ArrowRight size={20}/></button>
   </>}
   {!isBroken&&<button className="anPdpZoom" type="button" aria-label="Expand product photo" onClick={()=>setZoom(true)}><Expand size={19}/></button>}
   <div className="anPdpImageCounter">{safe.length?String(active+1).padStart(2,"0")+" / "+String(safe.length).padStart(2,"0"):"ANUSMITA"}</div>
  </div>
  {zoom&&!isBroken&&<div className="anPdpLightbox" role="dialog" aria-modal="true" aria-label={name+" enlarged photo"}
   onMouseDown={e=>{if(e.target===e.currentTarget)setZoom(false);}}>
   <button type="button" className="anPdpLightboxClose" aria-label="Close enlarged product photo" onClick={()=>setZoom(false)} autoFocus><X size={23}/></button>
   <img src={url} alt={name+" — enlarged photo"}/>
   <div className="anPdpLightboxHelp"><ZoomIn size={15}/> Photo {active+1} / {safe.length} · Press Esc to close</div>
   {safe.length>1&&<div className="anPdpLightboxNav"><button type="button" aria-label="Previous photo" onClick={()=>advance(-1)}><ArrowLeft/></button><button type="button" aria-label="Next photo" onClick={()=>advance(1)}><ArrowRight/></button></div>}
  </div>}
 </div>;
}
