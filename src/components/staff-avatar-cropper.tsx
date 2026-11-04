"use client";
import {useEffect,useRef,useState} from "react";
import {Camera,CheckCircle2,Crop,RotateCcw,Save,X} from "lucide-react";
type Props={avatarUrl?:string;name:string;onSaved:(url:string)=>void};
const format=(bytes:number)=>(bytes/1024).toFixed(0)+" KB";
export default function AvatarCropper({avatarUrl,name,onSaved}:Props){
 const fileRef=useRef<HTMLInputElement>(null);const previewRef=useRef<HTMLCanvasElement>(null);
 const [source,setSource]=useState<string|null>(null),[zoom,setZoom]=useState(1),[pos,setPos]=useState({x:50,y:50});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 useEffect(()=>()=>{if(source)URL.revokeObjectURL(source)},[source]);
 useEffect(()=>{if(!source)return;let cancelled=false;const im=new Image();im.onload=()=>{if(cancelled)return;const canvas=previewRef.current;if(!canvas)return;canvas.width=400;canvas.height=400;const ctx=canvas.getContext("2d");if(!ctx)return;const side=Math.min(im.naturalWidth,im.naturalHeight)/zoom;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.clearRect(0,0,400,400);ctx.drawImage(im,(im.naturalWidth-side)*(pos.x/100),(im.naturalHeight-side)*(pos.y/100),side,side,0,0,400,400)};im.src=source;return()=>{cancelled=true}},[source,zoom,pos.x,pos.y]);
 
 function pick(file?:File){
  if(!file)return;
  setError("");setSuccess("");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Only JPG, PNG or WebP images are supported.");return}
  if(file.size>8*1024*1024){setError("Source image must be under 8 MB.");return}
  if(file.size===0){setError("Selected image is empty.");return}
  setSource(URL.createObjectURL(file));setZoom(1);setPos({x:50,y:50});
 }
 async function save(){
  if(!source)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const image=new Image();image.decoding="async";
   await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("Unable to decode image. Choose another picture."));image.src=source});
   const canvas=document.createElement("canvas");canvas.width=400;canvas.height=400;
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("Your browser cannot create the crop preview.");
   const shorter=Math.min(image.naturalWidth,image.naturalHeight);
   const size=shorter/zoom;
   const maxX=image.naturalWidth-size,maxY=image.naturalHeight-size;
   const x=maxX*(pos.x/100),y=maxY*(pos.y/100);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
   ctx.drawImage(image,x,y,size,size,0,0,400,400);
   let quality=.86;
   let blob:Blob|null=null;
   while(quality>=.5){blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",quality));if(blob&&blob.size<=1024*1024)break;quality-=.1}
   if(!blob||blob.size>1024*1024)throw Error("Unable to compress the photo below 1 MB.");
   const data=new FormData();data.append("file",new File([blob],"staff-avatar.webp",{type:"image/webp"}));
   const response=await fetch("/api/admin/staff/avatar",{method:"POST",credentials:"same-origin",body:data});
   const body=await response.json().catch(()=>({error:"Upload endpoint did not return JSON"}));
   if(!response.ok)throw Error(body.error||"Upload failed (HTTP "+response.status+")");
   if(typeof body.avatarUrl!=="string"||!body.avatarUrl.startsWith("https://"))throw Error("Upload did not return a valid image URL");
   const check=await fetch("/api/admin/staff/profile",{cache:"no-store"});
   const verified=await check.json();
   if(!check.ok||verified.profile?.avatarUrl!==body.avatarUrl)throw Error("Image uploaded, but profile save could not be verified. Refresh and try again.");
   onSaved(body.avatarUrl);
   setSuccess("Photo uploaded to R2 and saved in your staff profile ("+format(blob.size)+").");
   setSource(null);
  }catch(err){setError(err instanceof Error?err.message:"Avatar upload failed");}
  finally{setBusy(false)}
 }

 return <div className="avatarCropper"><div className="avatarCropperHead"><div className="avatarActual">{avatarUrl?<img src={avatarUrl} alt="Current profile avatar"/>:<span>{name.trim().split(/\\s+/).slice(0,2).map(v=>v.charAt(0)).join("").toUpperCase()}</span>}</div><div><strong>Profile picture</strong><p>Automatic square crop · 400×400 WebP · Cloudflare R2</p><button type="button" disabled={busy} onClick={()=>fileRef.current?.click()}><Camera size={15}/> Choose Image</button></div></div><input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" className="avatarHiddenInput" onChange={e=>{pick(e.target.files?.[0]);e.target.value=""}}/>
 {source&&<div className="avatarCropControls"><div className="avatarCropTitle"><Crop size={17}/> Adjust crop <button type="button" onClick={()=>setSource(null)} aria-label="Cancel image crop"><X size={16}/></button></div><div className="avatarCropStage"><canvas ref={previewRef} className="avatarCropWindow" aria-label="Live 400 by 400 square crop preview"/></div><div className="avatarSlider"><label htmlFor="avatarZoom">Zoom: {zoom.toFixed(1)}×</label><input id="avatarZoom" type="range" min={1} max={3} step={0.1} value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></div><div className="avatarSlider"><label htmlFor="avatarHorizontal">Horizontal position</label><input id="avatarHorizontal" type="range" min={0} max={100} value={pos.x} onChange={e=>setPos(p=>({...p,x:Number(e.target.value)}))}/></div><div className="avatarSlider"><label htmlFor="avatarVertical">Vertical position</label><input id="avatarVertical" type="range" min={0} max={100} value={pos.y} onChange={e=>setPos(p=>({...p,y:Number(e.target.value)}))}/></div><div className="avatarCropActions"><button type="button" disabled={busy} onClick={()=>{setZoom(1);setPos({x:50,y:50})}}><RotateCcw size={15}/> Reset</button><button type="button" disabled={busy} onClick={()=>void save()} className="avatarSave"><Save size={15}/>{busy?"Uploading and saving…":"Save Avatar"}</button></div></div>}
 {error&&<p className="avatarError" role="alert">{error}</p>}{success&&<p className="avatarSuccess" role="status"><CheckCircle2 size={16}/> {success}</p>}
 </div>
}
