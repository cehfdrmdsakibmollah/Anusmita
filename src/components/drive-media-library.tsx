
"use client";
import {useEffect,useState} from "react";
type Media={id:string;name:string;origin:string;category:string;mimeType:string;bytes:number;previewUrl:string;viewUrl:string};
type Product={_id:string;sku:string;name:string;updatedAt:string;imageUrls:string[]};
type Page={items:Media[];total:number;page:number;pages:number;byOrigin:{Korea:number;Japan:number;China:number}};
export default function DriveMediaLibrary(){
 const [country,setCountry]=useState("All"),[query,setQuery]=useState(""),[page,setPage]=useState(1),[data,setData]=useState<Page|null>(null);
 const [productQuery,setProductQuery]=useState(""),[products,setProducts]=useState<Product[]>([]),[selected,setSelected]=useState<Product|null>(null);
 const [chosen,setChosen]=useState<Media|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{const ctl=new AbortController();
  const run=async()=>{try{const r=await fetch("/api/admin/media?origin="+encodeURIComponent(country)+"&q="+encodeURIComponent(query)+"&page="+page,{signal:ctl.signal,cache:"no-store"});if(!r.ok)throw new Error("Unable to load Drive files"); const v=await r.json();if(!ctl.signal.aborted)setData(v);}
  catch(e){if(!ctl.signal.aborted)setMessage(String(e));}};void run();return()=>ctl.abort();
 },[country,query,page]);
 useEffect(()=>{if(!productQuery.trim()){setProducts([]);return;}
  const ctl=new AbortController();const timer=setTimeout(async()=>{try{const r=await fetch("/api/admin/products?q="+encodeURIComponent(productQuery),{signal:ctl.signal});if(r.ok){const d=await r.json();if(!ctl.signal.aborted)setProducts(d.products||[]);}}catch{}},250);
  return()=>{ctl.abort();clearTimeout(timer);};
 },[productQuery]);
 async function attach(item:Media,operation:"add"|"remove"){
  if(!selected)return;setBusy(true);setMessage("");
  try{
   const resp=await fetch("/api/admin/media",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileId:item.id,productId:selected._id,expectedUpdatedAt:selected.updatedAt,operation})});
   const value=await resp.json();if(!resp.ok)throw new Error(value.error||"Unable to update product");
   setSelected({...selected,imageUrls:value.imageUrls,updatedAt:value.updatedAt});
   setProducts(old=>old.map(p=>p._id===selected._id?{...p,imageUrls:value.imageUrls,updatedAt:value.updatedAt}:p));
   setMessage(operation==="add"?"Image linked to "+selected.sku+". Please verify thumbnail visibility before publishing.":"Image removed from "+selected.sku);
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:"Unable to update"));}finally{setBusy(false);}
 }

 async function migrate(item:Media){
  if(!selected)return;
  if(item.mimeType==="image/heic"){setMessage("HEIC cannot be migrated automatically. Convert to JPEG/WebP and upload in Cloudinary tab.");return;}
  if(!window.confirm("Upload this image from Google Drive to Cloudinary and attach it to "+selected.sku+"? This may use Cloudinary credits. The Drive original will remain unchanged."))return;
  setBusy(true);setMessage("Importing one image to Cloudinary…");
  try{
   const r=await fetch("/api/admin/cloudinary/migrate",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({productId:selected._id,expectedUpdatedAt:selected.updatedAt,fileId:item.id,confirmed:true})});
   const result=await r.json();
   if(!r.ok)throw new Error(result.error||"Import failed");
   const next={...selected,imageUrls:result.imageUrls,updatedAt:result.updatedAt};
   setSelected(next);setProducts(old=>old.map(p=>p._id===next._id?next:p));
   setMessage("Cloudinary image verified and linked to "+selected.sku+". Drive original is unchanged.");
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:"Import failed"));}
  finally{setBusy(false);}
 }
 return <section className="adminCard"><h2>Google Drive Media Library</h2>
  <p className="smallprint">Card-free image linking from your existing Drive collection. Images stay in Google Drive; this feature saves only their public thumbnail URLs to MongoDB. No R2 account or Google API keys are needed. An optional one-image Cloudinary migration requires your site Cloudinary credentials and an explicit confirmation.</p>
  <p className="notice">Use images only after checking public visibility in a signed-out browser. Drive may block hotlinking or throttle bandwidth. HEIC originals may not display on every device. Product identity must be verified manually; filenames are not product names.</p>
  <div className="formGrid"><div className="field"><label htmlFor="media-origin">Collection</label><select id="media-origin" value={country} onChange={e=>{setCountry(e.target.value);setPage(1);}}><option>All</option><option>Korea</option><option>Japan</option><option>China</option></select></div>
  <div className="field"><label htmlFor="media-search">Search image filename or category</label><input id="media-search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="Filename / perfume / bag…" /></div></div>
  <p className="muted">{data?data.total+" available images · page "+page+"/"+(data.pages||1):"Loading media library…"}</p>
  <div className="driveMediaGrid">{data?.items.map(item=><button type="button" key={item.id} onClick={()=>setChosen(item)} className={"driveMediaTile "+(chosen?.id===item.id?"selected":"")}>
   <img alt={item.name} src={item.previewUrl} loading="lazy" referrerPolicy="no-referrer"/><span>{item.name}</span><small>{item.category} · {item.mimeType==="image/heic"?"HEIC":"JPG"}</small>
  </button>)}</div>
  <div className="filters" style={{marginTop:18}}><button className="button light small" disabled={page<=1} onClick={()=>setPage(v=>v-1)}>Previous</button><button className="button light small" disabled={!data||page>=data.pages} onClick={()=>setPage(v=>v+1)}>Next</button></div>
  <div className="adminCard"><h3>Attach an image to a product</h3>
   {chosen?<p><strong>Selected:</strong> {chosen.name} · <a href={chosen.viewUrl} target="_blank" rel="noreferrer" style={{textDecoration:"underline"}}>Open original in Drive <span aria-hidden="true">↗</span></a></p>:<p className="muted">First select an image from the gallery.</p>}
   <div className="field"><label htmlFor="link-product">Find the product by name or SKU</label><input id="link-product" value={productQuery} onChange={e=>setProductQuery(e.target.value)} placeholder="Type an existing SKU or product name"/></div>
   <div className="filters">{products.slice(0,12).map(p=><button className={selected?._id===p._id?"button small":"button small light"} key={p._id} onClick={()=>setSelected(p)}>{p.sku} · {p.name}</button>)}</div>
   {selected&&<><p className="muted"><strong>Editing:</strong> {selected.sku} · {selected.name} · {selected.imageUrls?.length||0}/12 pictures attached</p>
    <div className="filters">{selected.imageUrls?.map((url,i)=><div key={i} style={{width:90}}><img src={url} alt={"Linked image "+(i+1)} style={{width:85,height:85,objectFit:"contain"}}/><small>{i+1}</small></div>)}</div>
   </>}
   {message&&<p role="status" className={message.startsWith("Error")?"error":"notice"}>{message}</p>}
   <div className="filters">
    <button className="button" disabled={busy||!selected||!chosen} onClick={()=>chosen&&void attach(chosen,"add")}>Add selected image</button>
    <button className="button light" disabled={busy||!selected||!chosen} onClick={()=>chosen&&void attach(chosen,"remove")}>Remove selected image</button>
    <button className="button light" disabled={busy||!selected||!chosen||chosen.mimeType==="image/heic"} onClick={()=>chosen&&void migrate(chosen)}>Migrate 1 image to Cloudinary</button>
   </div>
  </div>
 </section>;
}
