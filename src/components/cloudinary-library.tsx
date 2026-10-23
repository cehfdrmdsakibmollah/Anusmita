
"use client";
import {useState} from "react";
type Asset={publicId:string;url:string;width:number;height:number;bytes:number;format:string;createdAt:string};
export default function CloudinaryLibrary({onChoose}:{onChoose:(url:string)=>void}){
 const [items,setItems]=useState<Asset[]>([]),[next,setNext]=useState<string|null|undefined>(undefined);
 const [loading,setLoading]=useState(false),[message,setMessage]=useState("");
 async function load(cursor?:string){
  setLoading(true);setMessage("");
  try{
   const response=await fetch("/api/admin/cloudinary/assets"+(cursor?"?cursor="+encodeURIComponent(cursor):""),{cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Unable to load Cloudinary media");
   setItems(old=>cursor?[...old,...data.items]:data.items);
   setNext(data.nextCursor);
   if(!data.items.length&&!cursor)setMessage("No ANUSMITA images were found in the connected Cloudinary environment.");
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:"Media lookup failed"));}
  finally{setLoading(false);}
 }
 return <section className="adminCard"><h3>Browse Cloudinary assets</h3>
  <p className="smallprint">Review existing ANUSMITA-hosted images and select one to paste into the product-link field. Credentials are never sent to this browser.</p>
  <button className="button small light" type="button" disabled={loading} onClick={()=>void load()}>Refresh Cloudinary library</button>
  <div className="mediaEditorGrid">{items.map(asset=><div className="mediaEditorCard" key={asset.publicId}>
   <img src={asset.url} alt={asset.publicId} loading="lazy" />
   <div className="muted" title={asset.publicId} style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{asset.publicId}</div>
   <small>{asset.width}×{asset.height} · {(asset.bytes/1024).toFixed(0)} KB</small>
   <button className="button small light" type="button" onClick={()=>onChoose(asset.url)}>Use this image</button>
  </div>)}</div>
  {next&&<button className="button small light" type="button" disabled={loading} onClick={()=>void load(next)}>Load more Cloudinary images</button>}
  {message&&<p className={message.startsWith("Error")?"error":"notice"} role="status">{message}</p>}
 </section>;
}
