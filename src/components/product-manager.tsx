
"use client";
import {useEffect,useState} from "react";
import {detailFields,type ProductDetails} from "@/lib/product-experience";
type Product=ProductDetails&{_id:string;sku:string;name:string;slug:string;category:string;brand:string;size?:string;variantGroup?:string;ingredients?:string;usageInstructions?:string;topNotes?:string;heartNotes?:string;baseNotes?:string;description?:string;pricePaisa:number;costPaisa:number;onHand:number;reserved:number;active:boolean;updatedAt:string};
type Result={products:Product[];page:number;pages:number;total:number};
export default function ProductManager(){
 const [q,setQ]=useState(""),[page,setPage]=useState(1),[result,setResult]=useState<Result|null>(null);
 const [selected,setSelected]=useState<Product|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [version,setVersion]=useState(0);
 useEffect(()=>{let active=true;
  fetch("/api/admin/products?q="+encodeURIComponent(q)+"&page="+page,{cache:"no-store"}).then(r=>r.json()).then(v=>{if(active)setResult(v);}).catch(()=>{if(active)setMessage("Catalogue search unavailable");});
  return()=>{active=false;};
 },[q,page,version]);
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!selected)return;
  const form=new FormData(e.currentTarget);
  setBusy(true);setMessage("");
  try{
   const changes={...Object.fromEntries(detailFields.map(([key])=>[key,String(form.get(key)||"").trim()])),name:String(form.get("name")||"").trim(),slug:String(form.get("slug")||"").trim(),
    brand:String(form.get("brand")||"").trim(),category:String(form.get("category")||"").trim(),
    size:String(form.get("size")||"").trim(),variantGroup:String(form.get("variantGroup")||"").trim().toLowerCase(),
    description:String(form.get("description")||"").trim(),ingredients:String(form.get("ingredients")||"").trim(),
    usageInstructions:String(form.get("usageInstructions")||"").trim(),
    topNotes:String(form.get("topNotes")||"").trim(),heartNotes:String(form.get("heartNotes")||"").trim(),
    baseNotes:String(form.get("baseNotes")||"").trim(),
    pricePaisa:Math.round(Number(form.get("price"))*100),costPaisa:Math.round(Number(form.get("cost"))*100),active:form.get("active")==="on"};
   const res=await fetch("/api/admin/products/"+selected._id,{method:"PATCH",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({expectedUpdatedAt:selected.updatedAt,changes})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Save rejected");
   setMessage("Saved changes for "+selected.sku);setSelected(null);setVersion(v=>v+1);
  }catch(err){setMessage("Error: "+(err instanceof Error?err.message:"Save failed"));}
  finally{setBusy(false);}
 }
 return <section className="adminCard"><h2>Search & edit products</h2>
 <p className="smallprint">Update product information without redeploying. Price edits affect future orders only; existing order snapshots remain unchanged. To change stock, use Inventory adjustments. Every colour/size combination is a separate SKU. Use the same group, category and brand to link variants. Perfume sizes are separate SKUs (2ml spray, 5ml, 10ml, 15ml, 50ml, 100ml). Give matching perfume SKUs the same variant group key, e.g. gucci-flora-gardenia; never create a size without its SKU, price and stock.</p>
 <div className="field"><label htmlFor="catalog-search">Search by product name, SKU or brand</label><input id="catalog-search" placeholder="Type a name or SKU" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/></div>
 {message&&<p className={message.startsWith("Error")?"error":"notice"} role="status">{message}</p>}
 <table><thead><tr><th>SKU</th><th>Product</th><th>Price</th><th>Available</th><th>Status</th><th></th></tr></thead><tbody>
 {result?.products?.map(p=><tr key={p._id}><td>{p.sku}</td><td>{p.name}</td><td>৳{(p.pricePaisa/100).toFixed(2)}</td><td>{p.onHand-p.reserved}</td><td>{p.active?"Published":"Draft"}</td><td><button className="button small light" onClick={()=>setSelected(p)}>Edit</button></td></tr>)}
 </tbody></table>
 {result&&<div className="filters" style={{marginTop:14}}><button className="button small light" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span className="muted">Page {page}/{result.pages||1} · {result.total} SKUs</span><button className="button small light" disabled={page>=result.pages} onClick={()=>setPage(p=>p+1)}>Next</button></div>}
 {selected&&<form key={selected._id} onSubmit={save} style={{borderTop:"1px solid #ddd",marginTop:26,paddingTop:20}} className="adminForm">
  <h3>Edit SKU: {selected.sku}</h3><div className="formGrid">
  {([["name","Product name",selected.name],["slug","SEO slug",selected.slug],["brand","Brand",selected.brand||""],["category","Category",selected.category],
   ["size","Size (e.g. 2ml spray / 5ml / 10ml)",selected.size||""],
   ["variantGroup","Variant group key (same for all sizes)",selected.variantGroup||""],
   ["description","Description",selected.description||""],
   ["ingredients","Ingredients (if verified)",selected.ingredients||""],
   ["usageInstructions","How to use (if verified)",selected.usageInstructions||""],
   ["topNotes","Top fragrance notes (if verified)",selected.topNotes||""],
   ["heartNotes","Heart fragrance notes (if verified)",selected.heartNotes||""],
   ["baseNotes","Base fragrance notes (if verified)",selected.baseNotes||""],["price","Price BDT",(selected.pricePaisa/100).toFixed(2)],["cost","Cost BDT",(selected.costPaisa/100).toFixed(2)]] as [string,string,string][]).map(([key,title,value])=>
   <div className="field" key={key}><label htmlFor={"edit-"+key}>{title}</label><input id={"edit-"+key} name={key} defaultValue={value} required={["name","slug","category","price","cost"].includes(key)} type={key==="price"||key==="cost"?"number":"text"} step={key==="price"||key==="cost"?"0.01":undefined} min={key==="price"?"0.01":key==="cost"?"0":undefined}/></div>)}
  {detailFields.map(([key,title])=><div className="field" key={key}><label htmlFor={'edit-'+key}>{title}</label><textarea id={'edit-'+key} name={key} defaultValue={selected[key]||''} maxLength={key==='colorHex'?7:2000} rows={key==='sizeGuide'?4:2}/></div>)}
  </div><p><label><input type="checkbox" name="active" defaultChecked={selected.active}/> Published (uncheck to archive)</label></p>
  <div className="filters"><button className="button" disabled={busy} type="submit">{busy?"Saving…":"Save product"}</button><button className="button light" onClick={()=>setSelected(null)} type="button">Cancel</button></div>
 </form>}
 </section>;
}
