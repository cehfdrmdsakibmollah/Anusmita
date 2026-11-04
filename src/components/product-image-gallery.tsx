
"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Expand,ImageOff,X,ZoomIn,ZoomOut,RotateCcw} from "lucide-react";
export default function ProductImageGallery({urls,name,preview=false,altTexts=[]}:{urls:string[];name:string;preview?:boolean;altTexts?:string[]}){
 const safe=urls.filter(Boolean).slice(0,12);
 const [index,setIndex]=useState(0),[broken,setBroken]=useState<string[]>([]),[zoom,setZoom]=useState(false);
 const [scale,setScale]=useState(1),[pan,setPan]=useState({x:0,y:0});
 const drag=useRef<{x:number;y:number;startX:number;startY:number}|null>(null);
 const resetView=()=>{setScale(1);setPan({x:0,y:0});drag.current=null;};
 const closeView=()=>{setZoom(false);resetView();};
 const stepZoom=(delta:number)=>{setScale(prev=>{const next=Math.min(4,Math.max(1,Math.round((prev+delta)*100)/100));if(next===1)setPan({x:0,y:0});return next;});};
 const active=Math.min(index,Math.max(0,safe.length-1));
 const url=safe[active]||"";
 const isBroken=!url||broken.includes(url);
 const advance=(direction:number)=>{resetView();setIndex(n=>(n+direction+safe.length)%Math.max(1,safe.length));};
 useEffect(()=>{
  if(!zoom)return;
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==="Escape")closeView();
   if(e.key==="+"||e.key==="=")stepZoom(.25);
   if(e.key==="-")stepZoom(-.25);
   if(e.key==="0")resetView();
   if(e.key==="ArrowLeft"&&safe.length>1)advance(-1);
   if(e.key==="ArrowRight"&&safe.length>1)advance(1);
  };
  window.addEventListener("keydown",onKey);
  return()=>window.removeEventListener("keydown",onKey);
 },[zoom,safe.length]);
 return <div className={"anPdpGallery"+(preview?" isPreview":"")} aria-label={name+" photos"}>
  {safe.length>0&&<div className="anPdpThumbs" aria-label="Select a product photo">{safe.map((src,i)=>
   <button key={i} type="button" className={i===active?"active":""}
    aria-label={"Show product photo "+(i+1)} aria-pressed={i===active} onClick={()=>{resetView();setIndex(i);}}>
    <img src={src} alt="" loading="lazy" onError={()=>setBroken(old=>old.includes(src)?old:[...old,src])}/>
   </button>)}</div>}
  <div className="anPdpMainImage anPdpStudioFrame">
   {preview&&<span className="anPdpImageTag">DESIGN PREVIEW</span>}
   {isBroken?<div className="anPdpImageFallback"><ImageOff size={38}/><p>Product image is not available yet</p><span>ANUSMITA</span></div>:
    <img src={url} alt={altTexts[active]?.trim()||name+" — image "+(active+1)+" of "+safe.length} loading="eager"
     onError={()=>setBroken(old=>old.includes(url)?old:[...old,url])}/>}
   {safe.length>1&&<>
    <button className="anPdpGalleryPrev" type="button" aria-label="Previous product photo" onClick={()=>advance(-1)}><ArrowLeft size={20}/></button>
    <button className="anPdpGalleryNext" type="button" aria-label="Next product photo" onClick={()=>advance(1)}><ArrowRight size={20}/></button>
   </>}
   {!isBroken&&<button className="anPdpZoom" type="button" aria-label="Expand product photo" onClick={()=>{resetView();setZoom(true);}}><Expand size={19}/></button>}
   <div className="anPdpImageCounter">{safe.length?String(active+1).padStart(2,"0")+" / "+String(safe.length).padStart(2,"0"):"ANUSMITA"}</div>
  </div>
  {zoom&&!isBroken&&<div className="anPdpLightbox" role="dialog" aria-modal="true" aria-label={name+" enlarged photo"}
   onMouseDown={e=>{if(e.target===e.currentTarget)closeView();}}>
   <button type="button" className="anPdpLightboxClose" aria-label="Close enlarged product photo" onClick={closeView} autoFocus><X size={23}/></button>
   <div className="anPdpLightboxViewport"
    onPointerDown={e=>{if(scale<=1)return;drag.current={x:e.clientX,y:e.clientY,startX:pan.x,startY:pan.y};e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{if(!drag.current||scale<=1)return;setPan({x:drag.current.startX+e.clientX-drag.current.x,y:drag.current.startY+e.clientY-drag.current.y});}}
    onPointerUp={e=>{drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
    onPointerCancel={()=>{drag.current=null;}}>
    <img src={url} alt={altTexts[active]?.trim()||name+" — enlarged photo"} draggable={false}
      style={{transform:`translate(${pan.x}px, ${pan.y}px) scale(${scale})`}}/>
   </div>
   <div className="anPdpLightboxZoomControls" aria-label="Image zoom controls">
    <button type="button" onClick={()=>stepZoom(-.25)} disabled={scale<=1} aria-label="Zoom out"><ZoomOut size={19}/></button>
    <span aria-live="polite">{Math.round(scale*100)}%</span>
    <button type="button" onClick={()=>stepZoom(.25)} disabled={scale>=4} aria-label="Zoom in"><ZoomIn size={19}/></button>
    <button type="button" onClick={resetView} aria-label="Reset image zoom"><RotateCcw size={18}/></button>
   </div>
   <div className="anPdpLightboxHelp"><ZoomIn size={15}/> Photo {active+1} / {safe.length} · Zoom +/−, drag to pan · Esc closes</div>
   {safe.length>1&&<div className="anPdpLightboxNav"><button type="button" aria-label="Previous photo" onClick={()=>advance(-1)}><ArrowLeft/></button><button type="button" aria-label="Next photo" onClick={()=>advance(1)}><ArrowRight/></button></div>}
  </div>}
 </div>;
}
