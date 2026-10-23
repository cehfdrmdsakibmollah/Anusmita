
"use client";
import {useEffect,useMemo,useState} from "react";
type PublicItem={reference:string;printedName:string;brand:string;size:string;sourceSection:string;sourceUrl:string;priceVisible:boolean;stockVerified:boolean;reviewNote:string};
type SupplierSource={supplier:{name:string;url:string;advertisedTotal:string};observed:number;products:PublicItem[];warning:string};
type Staged={_id:string;sourceRef:string;name:string;brand:string;size:string;quotedCostPaisa:number|null;sourceUrl:string;reviewStatus:string;quoteStatus:string};
type StagePage={products:Staged[];total:number;page:number;pages:number};
type Preview={previewHash:string;total:number;quotedRows:number;unpricedRows:number;samples:{sourceRef:string;name:string;brand:string;size:string;quotedCostPaisa:number|null}[]};
async function checked(response:Response){
 const result=await response.json().catch(()=>({error:"Invalid server response"}));
 if(!response.ok)throw new Error(typeof result.error==="string"?result.error:"Unable to process supplier data");
 return result;
}
export default function HrWholesaleSource({role}:{role:string}){
 const canUpload=["owner","admin","purchasing"].includes(role);
 const [source,setSource]=useState<SupplierSource|null>(null),[staged,setStaged]=useState<StagePage|null>(null),
  [search,setSearch]=useState(""),[brand,setBrand]=useState("All"),[csv,setCsv]=useState(""),
  [fileName,setFileName]=useState(""),[preview,setPreview]=useState<Preview|null>(null),
  [loading,setLoading]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{
  const ctrl=new AbortController();
  fetch("/api/admin/hr-wholesale?mode=public",{signal:ctrl.signal,cache:"no-store"})
   .then(checked).then(result=>{if(!ctrl.signal.aborted)setSource(result);})
   .catch(e=>{if(!ctrl.signal.aborted)setMessage("Unable to load supplier catalogue: "+String(e));});
  return()=>ctrl.abort();
 },[]);
 async function loadStaged(page:number=1){
  setLoading(true);setMessage("");
  try{
   const result:StagePage=await checked(await fetch("/api/admin/hr-wholesale?mode=staged&page="+page,{cache:"no-store"}));
   setStaged(result);
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:"Unable to read staged supplier data"));}
  finally{setLoading(false);}
 }
 async function readFile(file?:File){
  setPreview(null);setCsv("");setFileName(file?.name||"");setMessage("");
  if(!file)return;
  if(file.size>260000){setMessage("Error: Maximum supplier CSV size is 260 KB (400 rows).");return;}
  setCsv(await file.text());
 }
 async function submit(mode:"preview"|"commit"){
  setLoading(true);setMessage("");
  try{
   const result=await checked(await fetch("/api/admin/hr-wholesale",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({mode,csv,...(mode==="commit"?{previewHash:preview?.previewHash}:{})})}));
   if(mode==="preview"){setPreview(result);setMessage("Validated. Review all supplier references, quote amounts and sizes before saving.");}
   else{
    setMessage("Private supplier review queue updated: "+result.staged+" rows. No products were published.");
    setPreview(null);await loadStaged();
   }
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:"Supplier import failed"));}
  finally{setLoading(false);}
 }
 const names=useMemo(()=>["All",...new Set((source?.products||[]).map(x=>x.brand))].sort((a,b)=>a==="All"?-1:b==="All"?1:a.localeCompare(b)),[source]);
 const visible=useMemo(()=>(source?.products||[]).filter(x=>(brand==="All"||x.brand===brand)&&
  (x.printedName+" "+x.brand).toLowerCase().includes(search.trim().toLowerCase())),[source,brand,search]);
 return <section className="adminCard">
  <p className="eyebrow">Korean cosmetics supplier sources</p>
  <h2>HR Wholesale Cosmetics — source review</h2>
  <p className="smallprint">Supplier website: <a href="https://www.hrwholesalecosmetics.com/" target="_blank" rel="noreferrer" style={{textDecoration:"underline"}}>hrwholesalecosmetics.com ↗</a>. Public product names are informational leads, not confirmed offers to ANUSMITA. Site prices require account login.</p>
  <p className="notice">No automatic scraping, supplier login, image copying, live stock import, or product publishing. Verify supplier terms, MOQ, invoice, expiry/batch, authenticity and permission to reuse images before selling.</p>
  {source&&<><p><strong>{source.observed} publicly observed skincare candidates</strong> · Site advertises {source.supplier.advertisedTotal}. That total may include non-Korean items and is not the number imported.</p>
   <div className="filters"><a className="button small light" download href="/api/admin/hr-wholesale?mode=source-csv">Download public candidates CSV</a>
    <a className="button small light" download href="/api/admin/hr-wholesale?mode=template">Download supplier quote CSV template</a></div>
   <div className="formGrid"><div className="field"><label htmlFor="hr-brand">Brand</label>
    <select id="hr-brand" value={brand} onChange={e=>setBrand(e.target.value)}>{names.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
    <div className="field"><label htmlFor="hr-lookup">Find publicly observed product</label>
     <input id="hr-lookup" value={search} onChange={e=>setSearch(e.target.value)} placeholder="COSRX / Medicube / SPF…"/></div></div>
   <div style={{overflowX:"auto",maxHeight:520}}><table><thead><tr><th>Brand</th><th>Printed product name</th><th>Size</th><th>Source</th></tr></thead><tbody>
   {visible.map(item=><tr key={item.reference}><td>{item.brand}</td><td>{item.printedName}</td><td>{item.size||"Confirm size"}</td>
     <td><a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{textDecoration:"underline"}}>{item.sourceSection} ↗</a></td></tr>)}
   </tbody></table></div>
  </>}
  {canUpload&&<div className="adminCard" style={{marginTop:20}}>
   <h3>Import full supplier quote into private review queue</h3>
   <p className="smallprint">After obtaining an approved quote/export from the supplier, upload CSV here. Supports up to 400 rows per file including full 250+ catalogue. Price column is OPTIONAL and any entered amount is an unverified supplier quote—not ANUSMITA retail price or stock. Import does not touch live product records.</p>
   <div className="field"><label htmlFor="hr-csv-upload">Supplier quote CSV (six columns, UTF-8, max 260 KB)</label>
    <input id="hr-csv-upload" type="file" accept=".csv,text/csv" onChange={e=>void readFile(e.target.files?.[0])}/></div>
   {fileName&&<p className="muted">Selected: {fileName}</p>}
   <button type="button" className="button" disabled={loading||!csv} onClick={()=>void submit("preview")}>Validate supplier CSV</button>
   {preview&&<><div className="kpiGrid">
    <div className="kpi"><div className="muted">Candidate rows</div><div className="number">{preview.total}</div></div>
    <div className="kpi"><div className="muted">Quoted cost supplied</div><div className="number">{preview.quotedRows}</div></div>
    <div className="kpi"><div className="muted">Without cost</div><div className="number">{preview.unpricedRows}</div></div>
   </div>
    <p className="smallprint">First 30 rows shown below. The full file is validated for duplicates and supplier URLs; verify the original export before committing.</p>
    <div style={{overflowX:"auto",maxHeight:350}}><table><thead><tr><th>Supplier ref</th><th>Product</th><th>Quoted cost</th></tr></thead><tbody>
     {preview.samples.map(x=><tr key={x.sourceRef}><td>{x.sourceRef}</td><td>{x.name} · {x.size}</td>
       <td>{x.quotedCostPaisa===null?"Not provided":"৳"+(x.quotedCostPaisa/100).toFixed(2)+" (unverified)"}</td></tr>)}
    </tbody></table></div>
    <button type="button" className="button" disabled={loading} onClick={()=>{if(window.confirm("Save "+preview.total+" supplier candidates to PRIVATE review only? No public products or inventory will be affected."))void submit("commit");}}>Save reviewed supplier candidates</button>
   </>}
   <h3 style={{marginTop:20}}>Private staged supplier candidates</h3>
   <button type="button" className="button small light" disabled={loading} onClick={()=>void loadStaged(1)}>Load staged supplier rows</button>
   {staged&&<><p className="muted">{staged.total} supplier candidates, page {staged.page} / {staged.pages||1}</p>
    <div style={{overflowX:"auto",maxHeight:400}}><table><thead><tr><th>Supplier ref</th><th>Product name</th><th>Quoted cost</th><th>Review</th></tr></thead><tbody>
     {staged.products.map(x=><tr key={x._id}><td>{x.sourceRef}</td><td>{x.name} · {x.size}</td>
      <td>{x.quotedCostPaisa===null?"Pending":"৳"+(x.quotedCostPaisa/100).toFixed(2)}</td><td>Needs verification</td></tr>)}
    </tbody></table></div>
    <div className="filters"><button type="button" className="button small light" disabled={loading||staged.page<=1} onClick={()=>void loadStaged(staged.page-1)}>Previous</button>
     <button type="button" className="button small light" disabled={loading||staged.page>=staged.pages} onClick={()=>void loadStaged(staged.page+1)}>Next</button></div>
   </>}
  </div>}
  {message&&<p role="status" className={message.startsWith("Error")?"error":"notice"}>{message}</p>}
 </section>;
}
