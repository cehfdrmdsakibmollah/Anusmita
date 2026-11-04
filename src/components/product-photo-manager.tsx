
"use client";
import {useState} from "react";
type GalleryProduct={_id:string;sku:string;name:string;updatedAt:string;imageUrls:string[]};
type Action="cover"|"move-left"|"move-right"|"unlink";
export default function ProductPhotoManager({product,onSaved,compact=false}:{product:GalleryProduct,onSaved:(newData:{imageUrls:string[];updatedAt:string})=>void;compact?:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function modify(url:string,action:Action){
  if(action==="unlink"&&!window.confirm("Remove this image from "+product.sku+"? The original file stays safely in R2, Cloudinary or Google Drive."))return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/products/"+product._id+"/images",{method:"PATCH",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({expectedUpdatedAt:product.updatedAt,imageUrl:url,action})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Gallery update was rejected");
   onSaved({imageUrls:data.imageUrls,updatedAt:data.updatedAt});
   setMessage(action==="unlink"?"Image unlinked (source file kept).":action==="cover"?"Cover image updated. New first photo will be visible on the storefront after refresh.":"Gallery order updated.");
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:"Gallery edit failed"));}
  finally{setBusy(false);}
 }
 return <div className={compact?"apInlinePhotoManager":"adminCard"}><h3>Gallery order & cover image</h3>
  <p className="smallprint">The first image is the storefront cover. Select “Set as cover” on another gallery image to make it the first photo. Changes save instantly with an audit log; linked source files are preserved.</p>
  {product.imageUrls?.length ? <div className="mediaEditorGrid">
   {product.imageUrls.map((url,i)=><div className="mediaEditorCard" key={url}>
    <img loading="lazy" src={url} alt={"Product "+product.sku+" photo "+(i+1)} />
    <div className="muted">{i===0?"Cover photo":"Photo "+(i+1)}</div>
    <div className="mediaEditorActions">
     <button className="button small light" type="button" disabled={busy||i===0} onClick={()=>void modify(url,"cover")}>{i===0?"Current cover":"Set as cover"}</button>
     <button className="button small light" type="button" disabled={busy||i===0} aria-label={"Move photo "+(i+1)+" left"} onClick={()=>void modify(url,"move-left")}>←</button>
     <button className="button small light" type="button" disabled={busy||i===product.imageUrls.length-1} aria-label={"Move photo "+(i+1)+" right"} onClick={()=>void modify(url,"move-right")}>→</button>
     <button className="button small light" type="button" disabled={busy} onClick={()=>void modify(url,"unlink")}>Unlink</button>
    </div>
   </div>)}
  </div>:<div className="notice">No product images attached yet.</div>}
  {message&&<p role="status" className={message.startsWith("Error")?"error":"notice"}>{message}</p>}
 </div>;
}
