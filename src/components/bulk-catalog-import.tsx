
"use client";
import {useState} from "react";
type PreviewItem={line:number;sku:string;action:string;message:string};
type Preview={previewHash:string;total:number;inserted:number;updated:number;skipped:number;errors:number;details:PreviewItem[]};
export default function BulkCatalogImport(){
 const [csv,setCsv]=useState(""),[name,setName]=useState(""),[preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function readFile(file?:File){
  setPreview(null);setMessage("");
  if(!file)return;
  if(file.size>120_000){setMessage("CSV limit: 120 KB / 100 rows. Split large imports.");return;}
  setName(file.name);setCsv(await file.text());
 }
 async function action(mode:"preview"|"commit"){
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/catalog",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,csv,...(mode==="commit"?{previewHash:preview?.previewHash}:{})})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"Import failed");
   if(mode==="preview"){setPreview(result);setMessage("Preview ready. Review every row before saving.");}
   else{setMessage("Import finished: "+result.inserted+" new, "+result.updated+" updated, "+result.skipped+" skipped"+(result.alreadyApplied?" (already processed)":""));setPreview(null);}
  }catch(e){setMessage("Error: "+(e instanceof Error?e.message:"Request failed"));if(mode==="preview")setPreview(null);}
  finally{setBusy(false);}
 }
 return <section className="adminCard">
  <h2>Bulk product import</h2>
  <p>Import up to 100 SKUs per CSV file. <strong>Preview first</strong>; saving requires a matching, unchanged preview. Existing stock is never replaced by CSV.</p>
  <p className="smallprint">Blank values preserve existing data. Every SKU must be unique. New SKUs need name, category, price and cost; products start as drafts unless explicitly marked active.</p>
  <div className="filters"><a className="button small light" download href="/api/admin/catalog?mode=template">Download CSV template</a><a className="button small light" download href="/api/admin/catalog?mode=export&page=1">Export first 500 products</a></div>
  <div className="field"><label htmlFor="csv-file">Choose UTF-8 .csv file (120 KB max)</label><input id="csv-file" type="file" accept=".csv,text/csv" onChange={e=>void readFile(e.target.files?.[0])}/></div>
  {name&&<p className="muted">Selected: {name}</p>}
  <button className="button" type="button" disabled={busy||!csv} onClick={()=>void action("preview")}>{busy?"Working…":"Validate & preview"}</button>
  {message&&<p role="status" className={message.startsWith("Error")?"error":"notice"}>{message}</p>}
  {preview&&<><div className="kpiGrid">
   {([["Rows",preview.total],["New",preview.inserted],["To update",preview.updated],["Errors",preview.errors]] as [string,number][]).map(([label,count])=><div className="kpi" key={label}><div className="muted">{label}</div><div className="number">{count}</div></div>)}
  </div><div style={{maxHeight:350,overflow:"auto"}}><table><thead><tr><th>CSV line</th><th>SKU</th><th>Action</th><th>Details</th></tr></thead><tbody>{preview.details.map(row=><tr key={row.line}><td>{row.line}</td><td>{row.sku}</td><td>{row.action}</td><td>{row.message}</td></tr>)}</tbody></table></div>
   <p className="smallprint">Import is transactional: if any validation or database constraint fails, the whole batch is rolled back.</p>
   <button className="button" disabled={busy||preview.errors>0} onClick={()=>{if(window.confirm("Apply "+preview.total+" reviewed catalogue rows?"))void action("commit");}}>Commit reviewed import</button>
  </>}
 </section>;
}
