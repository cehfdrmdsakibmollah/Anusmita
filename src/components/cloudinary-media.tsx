
"use client";
import {useEffect,useState} from "react";
type Item={_id:string;sku:string;name:string;updatedAt:string;imageUrls:string[]};
export default function CloudinaryMedia(){
 const [url,setUrl]=useState(""),[query,setQuery]=useState(""),[items,setItems]=useState<Item[]>([]),[selected,setSelected]=useState<Item|null>(null),[result,setResult]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!query.trim()){setItems([]);return;}
  const ctl=new AbortController();
  const t=setTimeout(async()=>{try{
   const r=await fetch("/api/admin/products?q="+encodeURIComponent(query),{signal:ctl.signal,cache:"no-store"});
   if(!r.ok)throw new Error("Product search unavailable");
   const data=await r.json();if(!ctl.signal.aborted)setItems(data.products||[]);
  }catch(e){if(!ctl.signal.aborted)setResult("Product search unavailable");}},250);
  return()=>{clearTimeout(t);ctl.abort();};
 },[query]);
 async function save(){
  if(!selected)return;
  setBusy(true);setResult("");
  try{
   const r=await fetch("/api/admin/cloudinary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:selected._id,url,expectedUpdatedAt:selected.updatedAt})});
   const body=await r.json();if(!r.ok)throw new Error(body.error||"Unable to attach image");
   setSelected({...selected,imageUrls:body.imageUrls,updatedAt:body.updatedAt});
   setResult("Image attached to "+selected.sku+". Verify it on the product page before publishing.");
  }catch(e){setResult(e instanceof Error?e.message:"Error");}
  finally{setBusy(false);}
 }
 return <section className="adminCard"><h2>Cloudinary Image Hosting</h2>
 <p className="smallprint">Upload verified product images through your connected Cloudinary Media Library. Paste its secure delivery URL and link to a known product. No R2 activation needed, and do not paste API credentials here.</p>
 <div className="field"><label htmlFor="cloud-image">Cloudinary HTTPS image URL</label><input id="cloud-image" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://res.cloudinary.com/oseohmxd/image/upload/…"/></div>
 {url.startsWith("https://res.cloudinary.com/oseohmxd/image/upload/")&&<div className="productImage" style={{maxWidth:260,height:220}}><img src={url} alt="Preview of selected Cloudinary product image" loading="lazy" onError={()=>setResult("Image preview unavailable; check the image URL")}/></div>}
 <div className="field"><label htmlFor="cloud-product">Search existing product by name or SKU</label><input id="cloud-product" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);}} placeholder="Search SKU or product name"/></div>
 <div className="filters">{items.slice(0,12).map(p=><button className={selected?._id===p._id?"button small":"button small light"} key={p._id} type="button" onClick={()=>setSelected(p)}>{p.sku} · {p.name}</button>)}</div>
 {selected&&<p className="muted">Selected: <strong>{selected.sku}</strong> — {selected.name}, {selected.imageUrls?.length||0}/12 images</p>}
 <button className="button" disabled={busy||!selected||!url} onClick={()=>void save()}>{busy?"Linking…":"Attach hosted image"}</button>
 {result&&<p role="status" className={result.toLowerCase().includes("unavailable")||result.startsWith("Error")?"error":"notice"}>{result}</p>}
 </section>;
}
