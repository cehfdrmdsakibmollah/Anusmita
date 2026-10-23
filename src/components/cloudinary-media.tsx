
"use client";
import {useEffect,useState} from "react";
type Item={_id:string;sku:string;name:string;updatedAt:string;imageUrls:string[];slug:string};
type Signature={apiKey:string;cloudName:string;publicId:string;timestamp:number;signature:string;uploadUrl:string;uploadToken:string};
const MAX=10*1024*1024;
export default function CloudinaryMedia(){
 const [file,setFile]=useState<File|null>(null),[url,setUrl]=useState(""),[query,setQuery]=useState(""),[items,setItems]=useState<Item[]>([]);
 const [selected,setSelected]=useState<Item|null>(null),[result,setResult]=useState(""),[busy,setBusy]=useState(false),[stage,setStage]=useState("");
 useEffect(()=>{
  if(!query.trim()){setItems([]);return;}
  const ctl=new AbortController();
  const timer=setTimeout(async()=>{try{
   const r=await fetch("/api/admin/products?q="+encodeURIComponent(query),{signal:ctl.signal,cache:"no-store"});
   if(r.ok){const d=await r.json();if(!ctl.signal.aborted)setItems(d.products||[]);}
  }catch{}},250);
  return()=>{ctl.abort();clearTimeout(timer);};
 },[query]);
 const updateSelected=(result:any)=>{
  if(!selected)return;
  const updated={...selected,imageUrls:result.imageUrls,updatedAt:result.updatedAt};
  setSelected(updated);setItems(old=>old.map(p=>p._id===updated._id?updated:p));
 };
 async function responseOrThrow(response:Response){
  const data=await response.json().catch(()=>({error:"Service did not return JSON"}));
  if(!response.ok)throw new Error(data.error?.message||data.error||"Upload request failed");
  return data;
 }
 async function upload(){
  if(!selected||!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>MAX||!file.size){
   setResult("Choose JPEG, PNG or WebP under 10 MB. Convert HEIC first.");return;
  }
  setBusy(true);setResult("");
  try{
   setStage("1 / 3 — Authorizing secure upload");
   const signed:Signature=await responseOrThrow(await fetch("/api/admin/cloudinary/sign",{method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({productId:selected._id,expectedUpdatedAt:selected.updatedAt,fileSize:file.size,contentType:file.type})}));
   setStage("2 / 3 — Uploading directly to Cloudinary");
   const form=new FormData();form.set("file",file);form.set("api_key",signed.apiKey);
   form.set("public_id",signed.publicId);form.set("timestamp",String(signed.timestamp));form.set("signature",signed.signature);
   const uploaded=await responseOrThrow(await fetch(signed.uploadUrl,{method:"POST",body:form}));
   if(uploaded.public_id!==signed.publicId)throw new Error("Cloudinary returned an unexpected asset identifier");
   setStage("3 / 3 — Verifying & linking to product");
   const complete=await responseOrThrow(await fetch("/api/admin/cloudinary/complete",{method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({productId:selected._id,expectedUpdatedAt:selected.updatedAt,publicId:signed.publicId,timestamp:signed.timestamp,uploadToken:signed.uploadToken})}));
   updateSelected(complete);setUrl(complete.secureUrl);setFile(null);
   setResult("Upload verified and added to "+selected.sku+". Verify appearance on the storefront before publishing.");
  }catch(e){setResult("Error: "+(e instanceof Error?e.message:"Upload failed"));}
  finally{setBusy(false);setStage("");}
 }
 async function attach(){
  if(!selected||!url)return;
  setBusy(true);setResult("");
  try{
   const result=await responseOrThrow(await fetch("/api/admin/cloudinary",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({productId:selected._id,url,expectedUpdatedAt:selected.updatedAt})}));
   updateSelected(result);
   setResult("Verified hosted image linked to "+selected.sku);
  }catch(e){setResult("Error: "+(e instanceof Error?e.message:"Link failed"));}
  finally{setBusy(false);}
 }
 return <section className="adminCard"><h2>Cloudinary product images</h2>
  <p className="smallprint">Signed direct uploads do not pass image bytes through the ANUSMITA server. The API secret stays server-side. The connected Cloudinary plugin and production website use separate authentication, so configure server environment variables before using the website upload.</p>
  <div className="field"><label htmlFor="cl-product">Choose an existing product by name or SKU</label>
   <input id="cl-product" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);}} placeholder="Type product name or SKU"/></div>
  <div className="filters">{items.slice(0,12).map(p=><button key={p._id} type="button" className={selected?._id===p._id?"button small":"button small light"} onClick={()=>setSelected(p)}>{p.sku} · {p.name}</button>)}</div>
  {selected&&<p className="notice"><strong>{selected.sku}</strong> — {selected.name} · {selected.imageUrls?.length||0}/12 product photos</p>}
  <div className="field"><label htmlFor="upload-cloud">Upload a new image directly (JPEG, PNG, WebP · max 10 MB)</label>
   <input id="upload-cloud" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)} /></div>
  {file&&<p className="muted">Selected: {file.name} · {(file.size/1024/1024).toFixed(2)} MB</p>}
  <button className="button" disabled={busy||!selected||!file} onClick={()=>void upload()}>Upload & link selected image</button>
  {stage&&<p role="status" className="notice">{stage}</p>}
  <hr style={{border:"none",borderTop:"1px solid #ddd",margin:"25px 0"}}/>
  <h3>Or link an existing ANUSMITA Cloudinary asset</h3>
  <p className="smallprint">For assets transferred using the connected Cloudinary plugin. Only verified assets in the managed ANUSMITA folders are accepted.</p>
  <div className="field"><label htmlFor="cl-url">Cloudinary HTTPS image URL</label>
   <input id="cl-url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://res.cloudinary.com/oseohmxd/image/upload/v…/anusmita/…"/></div>
  {url.startsWith("https://res.cloudinary.com/")&&<div className="productImage" style={{maxWidth:230,height:200}}><img src={url} alt="Selected Cloudinary image preview" loading="lazy"/></div>}
  <button className="button light" disabled={busy||!selected||!url} onClick={()=>void attach()}>Verify & attach URL</button>
  {result&&<p role="status" className={result.startsWith("Error")?"error":"notice"}>{result}</p>}
  {selected?.slug&&<p className="smallprint"><a href={"/products/"+selected.slug} target="_blank" rel="noreferrer" style={{textDecoration:"underline"}}>View product detail page ↗</a></p>}
 </section>;
}
