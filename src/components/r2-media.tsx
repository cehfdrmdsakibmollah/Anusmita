"use client";
import {useEffect,useRef,useState} from "react";
import {Upload,Image as ImageIcon,Monitor,Smartphone,Square,Search,LayoutGrid,List,Copy,Layers,ExternalLink,RefreshCw} from "lucide-react";
import ProductImages from "./r2-product-images";
import "./banner-media.css";

type Asset={key:string;url:string;size:number;uploaded:string|null};
type Preset="desktop"|"mobile"|"square";
const sizes={desktop:[1920,600],mobile:[800,1000],square:[800,800]} as const;

async function optimize(file:File,preset:Preset,webp:boolean){
 if(!["image/png","image/jpeg","image/webp"].includes(file.type)||!file.size||file.size>20*1024*1024)throw Error("Choose a PNG, JPEG or WebP up to 20 MB.");
 if(!webp){if(file.size>3*1024*1024)throw Error("Original image must be under 3 MB.");return file;}
 const bitmap=await createImageBitmap(file);
 try{
  const [width,height]=sizes[preset];
  const canvas=document.createElement("canvas");
  canvas.width=width;canvas.height=height;
  const context=canvas.getContext("2d");
  if(!context)throw Error("Image processing is unavailable in this browser.");
  const scale=Math.max(width/bitmap.width,height/bitmap.height);
  const sw=width/scale,sh=height/scale;
  context.drawImage(bitmap,(bitmap.width-sw)/2,(bitmap.height-sh)/2,sw,sh,0,0,width,height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error("Image conversion failed")),"image/webp",.85));
  if(blob.type!=="image/webp")throw Error("This browser cannot encode WebP. Disable optimization to upload the original.");
  return new File([blob],file.name.replace(/\.[^.]+$/,"")+".webp",{type:blob.type});
 }finally{bitmap.close();}
}

export default function BannerMedia(){
 const input=useRef<HTMLInputElement>(null);
 const [assets,setAssets]=useState<Asset[]>([]),[selected,setSelected]=useState<Asset|null>(null);
 const [scope,setScope]=useState("homepage"),[query,setQuery]=useState(""),[cursor,setCursor]=useState<string|null>(null);
 const [tab,setTab]=useState("library"),[view,setView]=useState("grid"),[preset,setPreset]=useState<Preset>("desktop");
 const [webp,setWebp]=useState(true),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const [progress,setProgress]=useState(""),[focal,setFocal]=useState({x:50,y:50}),[scrim,setScrim]=useState(0);
 const requestId=useRef(0);
 async function load(nextScope=scope,nextCursor?:string){
  const id=++requestId.current;setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/cms-media-library?"+new URLSearchParams({scope:nextScope,limit:"30",...(nextCursor?{cursor:nextCursor}:{})}),{cache:"no-store"});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Unable to load assets");
   if(id!==requestId.current)return;
   setAssets(items=>nextCursor?[...items,...data.items]:data.items);setCursor(data.cursor);
   if(!nextCursor)setSelected(null);
  }catch(error){if(id===requestId.current)setError(error instanceof Error?error.message:"Unable to load assets");}
  finally{if(id===requestId.current)setLoading(false);}
 }
 useEffect(()=>{void load(scope);return()=>{requestId.current++;};},[scope]);
 async function upload(files:File[]){
  if(busy||!files.length)return;
  if(files.length>10){setError("Upload up to 10 images per batch.");return;}
  setBusy(true);setError("");setMessage("");
  let completed=0;
  try{
   for(const file of files){
    setProgress("Processing "+(completed+1)+" / "+files.length+" · "+file.name);
    const processed=await optimize(file,preset,webp);
    const form=new FormData();form.set("file",processed);
    const response=await fetch("/api/admin/homepage/media",{method:"POST",body:form});
    const data=await response.json();if(!response.ok)throw Error(data.error||"Upload failed");
    completed++;
   }
   setScope("homepage");await load("homepage");setMessage(completed+" images uploaded. Select an asset to copy its URL or open Homepage Studio.");
  }catch(error){await load("homepage");setError(completed+" uploads completed. "+(error instanceof Error?error.message:"Upload failed"));}
  finally{setBusy(false);setProgress("");if(input.current)input.current.value="";}
 }
 async function copy(value:string){
  try{await navigator.clipboard.writeText(value);setMessage("Copied to clipboard.");}catch{setError("Clipboard unavailable. Select and copy the URL from the inspector.");}
 }
 const filtered=assets.filter(asset=>asset.key.toLowerCase().includes(query.toLowerCase()));
 return <section className="bm">
  <header className="bmHeader"><div><h1>Banner &amp; Media</h1><p>Manage storefront campaigns and reusable assets.</p></div><button className="bmPrimary" disabled={busy} onClick={()=>input.current?.click()}><Upload size={17}/> Upload Media</button></header>
  <div className="bmLayout"><main>
   <details className="bmCard bmGuide" open><summary><Layers size={17}/> Upload specifications</summary><div className="bmSpecs">
    <div><Monitor/><strong>Desktop Hero</strong><span>1920 × 600 px · target 300 KB</span></div><div><Smartphone/><strong>Mobile Hero</strong><span>800 × 1000 px · target 150 KB</span></div><div><Square/><strong>Square</strong><span>800 × 800 px · target 150 KB</span></div>
    <p>WebP recommended. Keep text in the center 1200 px safe zone. Optimization applies a center crop. Server upload limit 3 MB.</p>
   </div></details>
   <div className="bmCard bmUpload"><button disabled={busy} className="bmDrop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void upload(Array.from(e.dataTransfer.files));}} onClick={()=>input.current?.click()}>
    <ImageIcon size={34}/><strong>Drop images here</strong><span>or click to browse your device</span><span className="bmChoose">Choose Files</span>
   </button><div className="bmOptions"><label>WebP optimization<input type="checkbox" checked={webp} disabled={busy} onChange={e=>setWebp(e.target.checked)}/></label><p>Crop preset</p><div className="bmPresets">{(["desktop","mobile","square"] as const).map(value=><button key={value} disabled={busy} aria-pressed={preset===value} onClick={()=>setPreset(value)}>{value==="desktop"?<Monitor size={14}/>:value==="mobile"?<Smartphone size={14}/>:<Square size={14}/>} {value==="square"?"Square":value==="desktop"?"Desktop Hero":"Mobile Hero"}</button>)}</div></div>
    <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(Array.from(e.target.files??[]))}/>
   </div>
   {busy&&<p role="status">{progress}</p>}{message&&<p role="status" className="bmFeedback">{message}</p>}{error&&<p role="alert" className="bmError">{error}</p>}
   <nav className="bmTabs">{[["library","Asset Library"],["campaigns","Campaigns"],["products","Product Images"]].map(([value,label])=><button key={value} aria-current={tab===value?"page":undefined} onClick={()=>setTab(value)}>{label}</button>)}</nav>
   {tab==="products"?<ProductImages/>:tab==="campaigns"?<div className="bmCard bmEmpty"><h2>Storefront campaigns</h2><p>Manage published homepage content and campaign settings in the existing editors.</p><a href="/admin?tab=Homepage%20Studio">Open Homepage Studio <ExternalLink size={14}/></a><a href="/admin/custom-pages/funnels">Open Funnel Builder <ExternalLink size={14}/></a></div>:<>
    <div className="bmFilters"><label><Search size={16}/><input aria-label="Search assets" placeholder="Search asset keys…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
     <select aria-label="Asset location" value={scope} disabled={busy||loading} onChange={e=>{setScope(e.target.value);setAssets([]);}}>{["homepage","shop","deals","bundles","about","contact","journal"].map(value=><option key={value} value={value}>{value==="homepage"?"Homepage assets":value+" assets"}</option>)}</select>
     <button aria-label="Refresh assets" disabled={loading||busy} onClick={()=>void load()}><RefreshCw size={16}/></button><button aria-label="Grid view" onClick={()=>setView("grid")} aria-pressed={view==="grid"}><LayoutGrid size={16}/></button><button aria-label="List view" onClick={()=>setView("list")} aria-pressed={view==="list"}><List size={16}/></button>
    </div>
    <div className={"bmAssets "+view}>{filtered.map(asset=><article key={asset.key} className={"bmCard bmAsset "+(selected?.key===asset.key?"selected":"")}>
     <button className="bmAssetSelect" onClick={()=>{setSelected(asset);setFocal({x:50,y:50});setScrim(0);}}><strong>{asset.key.split("/").at(-1)}</strong><img src={asset.url} alt="Stored media preview" loading="lazy"/></button>
     <div className="bmMeta"><span>{scope}</span><span>{(asset.size/1024).toFixed(1)} KB</span><span>{asset.uploaded?new Date(asset.uploaded).toLocaleDateString("en-BD"):""}</span></div>
     <div className="bmActions"><button onClick={()=>setSelected(asset)}>Edit preview</button><button onClick={()=>void copy(asset.url)}><Copy size={13}/> Copy URL</button><a href={asset.url} target="_blank" rel="noreferrer">View <ExternalLink size={13}/></a></div>
    </article>)}</div>
    {!filtered.length&&<div className="bmCard bmEmpty">{loading?"Loading media…":"No matching assets in this location."}</div>}
    {cursor&&<button disabled={loading} onClick={()=>void load(scope,cursor)}>Load more assets</button>}
   </>}
  </main><aside><div className="bmCard bmInspector"><h2>Asset settings</h2>{selected?<>
    <p>Image preview · {preset}</p><div className={"bmPreview "+preset} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect();setFocal({x:Math.round((e.clientX-rect.left)/rect.width*100),y:Math.round((e.clientY-rect.top)/rect.height*100)});}}>
     <img src={selected.url} alt="Focal point preview" style={{objectPosition:focal.x+"% "+focal.y+"%"}}/><div style={{background:"linear-gradient(transparent,rgba(0,0,0,"+scrim/100+"))"}}/><span style={{left:focal.x+"%",top:focal.y+"%"}}>+</span>
    </div>
    <label>Public URL<input readOnly value={selected.url}/></label><label>R2 key<input readOnly value={selected.key}/></label>
    <h3>Preview focal point</h3><p>Click the image to adjust alignment.</p><label>Horizontal<input type="range" min="0" max="100" value={focal.x} onChange={e=>setFocal({...focal,x:Number(e.target.value)})}/></label><label>Vertical<input type="range" min="0" max="100" value={focal.y} onChange={e=>setFocal({...focal,y:Number(e.target.value)})}/></label>
    <label>Overlay readability · {scrim}%<input type="range" min="0" max="100" value={scrim} onChange={e=>setScrim(Number(e.target.value))}/></label>
    <button onClick={()=>void copy("object-position: "+focal.x+"% "+focal.y+"%;")}>Copy focal CSS</button><p>Preview adjustments are local. Apply campaign changes in Homepage Studio.</p>
    <a className="bmPrimary" href="/admin?tab=Homepage%20Studio">Open Homepage Studio</a>
   </>:<p>Select an asset to inspect its URL, preview crop and focal point.</p>}</div>
   <div className="bmCard bmInspector"><h2>Usage &amp; publishing</h2><p>Product images retain their existing upload and editing workflow in Product Images.</p><a href="/admin/custom-pages/funnels">Campaign analytics &amp; experiments <ExternalLink size={14}/></a></div>
  </aside></div>
 </section>;
}
