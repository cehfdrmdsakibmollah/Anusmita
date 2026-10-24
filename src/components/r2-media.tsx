"use client";
import {useEffect,useRef,useState} from "react";
import ProductPhotoManager from "@/components/product-photo-manager";
type Item={_id:string;sku:string;name:string;slug:string;updatedAt:string;imageUrls:string[]};
export default function R2Media(){
 const fileInput=useRef<HTMLInputElement>(null);
 const [query,setQuery]=useState(""),[items,setItems]=useState<Item[]>([]),[selected,setSelected]=useState<Item|null>(null);
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[ready,setReady]=useState(false);
 useEffect(()=>{let active=true;fetch("/api/admin/r2",{cache:"no-store"}).then(async r=>{const d=await r.json();if(active){setReady(r.ok&&d.ready);setMessage(r.ok?"R2 storage connected.":d.error||"Storage unavailable");}}).catch(()=>{if(active)setMessage("Unable to check R2 storage");});return()=>{active=false;};},[]);
 useEffect(()=>{if(!query.trim()){setItems([]);return;}const ctl=new AbortController();const timer=setTimeout(async()=>{try{const r=await fetch("/api/admin/products?q="+encodeURIComponent(query),{signal:ctl.signal,cache:"no-store"});if(r.ok){const d=await r.json();setItems(d.products||[]);}}catch{}},250);return()=>{ctl.abort();clearTimeout(timer);};},[query]);
 function update(data:{imageUrls:string[];updatedAt:string}){if(selected){const p={...selected,...data};setSelected(p);setItems(old=>old.map(i=>i._id===p._id?p:i));}}
 async function upload(){if(!selected||!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>3*1024*1024||!file.size){setMessage("Choose a JPEG, PNG or WebP under 3 MB.");return;}
  setBusy(true);setMessage("Uploading and linking your image…");
  try{const form=new FormData();form.set("productId",selected._id);form.set("expectedUpdatedAt",selected.updatedAt);form.set("file",file);
   const r=await fetch("/api/admin/r2",{method:"POST",body:form});const d=await r.json();if(!r.ok)throw new Error(d.error||"Upload failed");update(d);setFile(null);if(fileInput.current)fileInput.current.value="";setMessage("Image uploaded to R2 and linked to "+selected.sku+".");
  }catch(e){setMessage(e instanceof Error?e.message:"Upload failed");}finally{setBusy(false);}
 }
 return <section className="adminCard"><h2>R2 product images</h2><p className="smallprint">Upload public product photography to ANUSMITA storage. JPEG, PNG and WebP · maximum 3 MB. These images can be viewed by anyone with their URL.</p>
  <div className="field"><label htmlFor="r2-product">Find a product by name or SKU</label><input id="r2-product" value={query} disabled={busy} onChange={e=>{setQuery(e.target.value);setSelected(null);}} placeholder="Product name or SKU"/></div>
  <div className="filters">{items.slice(0,12).map(p=><button key={p._id} disabled={busy} className={selected?._id===p._id?"button small":"button small light"} onClick={()=>setSelected(p)}>{p.sku} · {p.name}</button>)}</div>
  {selected&&<p className="notice">{selected.name} · {selected.imageUrls.length}/12 photos</p>}
  <div className="field"><label htmlFor="r2-file">Choose product photo</label><input ref={fileInput} id="r2-file" disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></div>
  <button className="button" disabled={busy||!ready||!selected||!file} onClick={()=>void upload()}>{busy?"Uploading…":"Upload to R2 & link image"}</button>
  <p role="status" className="notice">{message}</p>
  {selected&&<ProductPhotoManager product={selected} onSaved={update}/>}
  {selected?.slug&&<a href={"/products/"+selected.slug} target="_blank" rel="noreferrer">View product ↗</a>}
 </section>;
}
