
"use client";
import {useState} from "react";
export default function CloudinaryMedia(){
 const [url,setUrl]=useState(""),[id,setId]=useState(""),[stamp,setStamp]=useState(""),[result,setResult]=useState("");
 async function save(){
  setResult("");
  try{
   const r=await fetch("/api/admin/cloudinary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:id,url,expectedUpdatedAt:stamp})});
   const body=await r.json();if(!r.ok)throw new Error(body.error||"Unable to attach image");
   setResult("Image attached successfully. Refresh the product before attaching another image.");
  }catch(e){setResult(e instanceof Error?e.message:"Error");}
 }
 return <section className="adminCard"><h2>Cloudinary Image Hosting</h2>
 <p className="smallprint">Use the connected Cloudinary Media Library to upload images first, then paste the HTTPS delivery URL. No card or R2 activation is required. Never paste Cloudinary API secrets here.</p>
 <div className="field"><label>Cloudinary secure image URL</label><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://res.cloudinary.com/oseohmxd/image/upload/…"/></div>
 <div className="field"><label>Existing product database ID</label><input value={id} onChange={e=>setId(e.target.value)} placeholder="24-character product ID"/></div>
 <div className="field"><label>Product updatedAt timestamp (from catalogue API)</label><input value={stamp} onChange={e=>setStamp(e.target.value)} placeholder="2026-10-24T00:00:00.000Z"/></div>
 <button className="button" onClick={()=>void save()}>Attach hosted image</button>
 {result&&<p role="status" className="notice">{result}</p>}
 </section>;
}
