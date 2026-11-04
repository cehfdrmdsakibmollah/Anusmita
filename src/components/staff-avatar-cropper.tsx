"use client";
import {useEffect,useRef,useState} from "react";
import {Camera,CheckCircle2,Minus,Plus,RotateCcw,Save,X,Move} from "lucide-react";
type Props={avatarUrl?:string;name:string;onSaved:(url:string)=>void};
const LIMIT=1024*1024;
export default function AvatarCropper({avatarUrl,name,onSaved}:Props){
 const fileRef=useRef<HTMLInputElement>(null);
 const previewRef=useRef<HTMLCanvasElement>(null);
 const pointerRef=useRef<{id:number;x:number;y:number;pos:{x:number;y:number}}|null>(null);
 const dimsRef=useRef({width:400,height:400});
 const [source,setSource]=useState<string|null>(null);
 const [zoom,setZoom]=useState(1);
 const [pos,setPos]=useState({x:50,y:50});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const displayName=name.trim().split(/\s+/).slice(0,2).map(v=>v.charAt(0)).join("").toUpperCase()||"A";
 useEffect(()=>()=>{if(source)URL.revokeObjectURL(source)},[source]);
 useEffect(()=>{
  if(!source)return;let cancelled=false;
  const img=new Image();
  img.onload=()=>{
   if(cancelled)return;
   dimsRef.current={width:img.naturalWidth,height:img.naturalHeight};
   const canvas=previewRef.current;
   if(!canvas)return;
   canvas.width=400;canvas.height=400;
   const ctx=canvas.getContext("2d");
   if(!ctx)return;
   const side=Math.min(img.naturalWidth,img.naturalHeight)/zoom;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.clearRect(0,0,400,400);
   ctx.drawImage(img,(img.naturalWidth-side)*pos.x/100,(img.naturalHeight-side)*pos.y/100,side,side,0,0,400,400);
  };
  img.src=source;
  return ()=>{cancelled=true};
 },[source,zoom,pos.x,pos.y]);
 useEffect(()=>{
  if(!source)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"&&!busy)setSource(null)};
  window.addEventListener("keydown",onKey);
  return ()=>window.removeEventListener("keydown",onKey);
 },[source,busy]);
 function pick(file?:File){
  if(!file)return;
  setError("");setSuccess("");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Choose a JPG, PNG, or WebP photo.");return}
  if(file.size===0||file.size>8*1024*1024){setError("Choose a nonempty photo under 8 MB.");return}
  setSource(URL.createObjectURL(file));setZoom(1);setPos({x:50,y:50});
 }
 function onPointerDown(e:React.PointerEvent<HTMLCanvasElement>){
  if(busy)return;
  pointerRef.current={id:e.pointerId,x:e.clientX,y:e.clientY,pos:{...pos}};
  e.currentTarget.setPointerCapture(e.pointerId);
 }
 function onPointerMove(e:React.PointerEvent<HTMLCanvasElement>){
  const start=pointerRef.current;
  if(!start||start.id!==e.pointerId)return;
  const width=e.currentTarget.getBoundingClientRect().width;
  const d=dimsRef.current;
  const side=Math.min(d.width,d.height)/zoom;
  const maxX=d.width-side,maxY=d.height-side;
  const dx=(e.clientX-start.x)/Math.max(1,width)*side;
  const dy=(e.clientY-start.y)/Math.max(1,width)*side;
  setPos({x:maxX>0?Math.max(0,Math.min(100,start.pos.x-dx/maxX*100)):50,y:maxY>0?Math.max(0,Math.min(100,start.pos.y-dy/maxY*100)):50});
 }
 function onPointerUp(){pointerRef.current=null}
 async function save(){
  if(!source||busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const image=new Image();
   await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("Cannot decode photo."));image.src=source});
   const canvas=document.createElement("canvas");canvas.width=400;canvas.height=400;
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("Image editor unavailable.");
   const side=Math.min(image.naturalWidth,image.naturalHeight)/zoom;
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,(image.naturalWidth-side)*pos.x/100,(image.naturalHeight-side)*pos.y/100,side,side,0,0,400,400);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",.82));
   if(!blob||blob.size>LIMIT)throw Error("Unable to optimize image below 1 MB.");
   const form=new FormData();form.append("file",new File([blob],"avatar.webp",{type:"image/webp"}));
   const response=await fetch("/api/admin/staff/avatar",{method:"POST",body:form,credentials:"same-origin"});
   const result=await response.json().catch(()=>({error:"Server returned an invalid response."}));
   if(!response.ok)throw Error(result.error||"Upload failed (HTTP "+response.status+")");
   if(typeof result.avatarUrl!=="string"||!result.avatarUrl.startsWith("https://"))throw Error("Image URL missing.");
   const verification=await fetch("/api/admin/staff/profile",{cache:"no-store"});
   const stored=await verification.json();
   if(!verification.ok||stored.profile?.avatarUrl!==result.avatarUrl)throw Error("Avatar upload completed but profile persistence is not verified.");
   onSaved(result.avatarUrl);
   setSource(null);
   setSuccess("Profile picture saved to Cloudflare R2 and verified.");
  }catch(e){setError(e instanceof Error?e.message:"Could not save avatar.");}
  finally{setBusy(false)}
 }
 return <div className="avatarCropper">
  <div className="avatarCropperHead">
   <div className="avatarActual">{avatarUrl?<img src={avatarUrl} alt="Current profile picture"/>:<span>{displayName}</span>}</div>
   <div><strong>Profile photo</strong><p>Add a profile picture. You can crop and position it before saving.</p><button type="button" disabled={busy} onClick={()=>fileRef.current?.click()}><Camera size={16}/> {avatarUrl?"Change Photo":"Upload Photo"}</button></div>
  </div>
  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="avatarHiddenInput" onChange={e=>{pick(e.target.files?.[0]);e.currentTarget.value=""}}/>
  {source&&<div className="fbAvatarOverlay" role="presentation">
   <section className="fbAvatarDialog" role="dialog" aria-modal="true" aria-labelledby="fbAvatarTitle">
    <header className="fbAvatarDialogHeader"><h2 id="fbAvatarTitle">Edit profile picture</h2><button type="button" disabled={busy} onClick={()=>setSource(null)} aria-label="Close editor"><X size={19}/></button></header>
    <div className="fbAvatarDialogBody">
     <p>Drag to reposition your photo. Use the slider to zoom in or out.</p>
     <div className="fbAvatarCircle" aria-label="Circular profile picture preview">
      <canvas ref={previewRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="fbAvatarCanvas" aria-label="Drag image to position your profile photo"/>
     </div>
     <div className="fbAvatarDragHelp"><Move size={14}/> Drag photo to reposition</div>
     <div className="fbAvatarZoom"><button type="button" aria-label="Zoom out" onClick={()=>setZoom(v=>Math.max(1,Math.round((v-.1)*10)/10))} disabled={zoom<=1||busy}><Minus size={17}/></button><input type="range" aria-label="Zoom photo" min="1" max="3" step=".1" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><button type="button" aria-label="Zoom in" onClick={()=>setZoom(v=>Math.min(3,Math.round((v+.1)*10)/10))} disabled={zoom>=3||busy}><Plus size={17}/></button></div>
     <div className="fbAvatarHelperActions"><button type="button" disabled={busy} onClick={()=>fileRef.current?.click()}><Camera size={15}/> Change photo</button><button type="button" disabled={busy} onClick={()=>{setZoom(1);setPos({x:50,y:50})}}><RotateCcw size={15}/> Reset</button></div>
    </div>
    <footer className="fbAvatarFooter"><span>Square 400 × 400 · WebP · R2 storage</span><div><button type="button" disabled={busy} onClick={()=>setSource(null)}>Cancel</button><button type="button" className="fbAvatarSave" disabled={busy} onClick={()=>void save()}><Save size={15}/> {busy?"Saving…":"Save"}</button></div></footer>
   </section>
  </div>}
  {error&&<p className="avatarError" role="alert">{error}</p>}
  {success&&<p className="avatarSuccess" role="status"><CheckCircle2 size={16}/> {success}</p>}
 </div>;
}
