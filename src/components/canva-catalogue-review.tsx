
"use client";
import {useEffect,useMemo,useState} from "react";
type CanvaItem={sourcePage:number;positionOnPage:number;sourceName:string;brandPrinted:string;packSizePrinted:string;reviewNote:string|null};
type SourceResponse={
 source:{designId:string;title:string;pages:number;url:string};
 total:number;products:CanvaItem[];disclaimer:string;
};
export default function CanvaCatalogueReview(){
 const [data,setData]=useState<SourceResponse|null>(null),[query,setQuery]=useState(""),
 [page,setPage]=useState("All"),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{
  const ctl=new AbortController();
  fetch("/api/admin/canva-source",{signal:ctl.signal,cache:"no-store"}).then(async r=>{
   const payload=await r.json();
   if(!r.ok)throw new Error(payload.error||"Canva source unavailable");
   if(!ctl.signal.aborted)setData(payload);
  }).catch(e=>{if(!ctl.signal.aborted)setError(e instanceof Error?e.message:"Cannot load catalogue");})
   .finally(()=>{if(!ctl.signal.aborted)setLoading(false);});
  return()=>ctl.abort();
 },[]);
 const filtered=useMemo(()=>data?.products.filter(row=>{
  const matchesPage=page==="All"||row.sourcePage===Number(page);
  const text=(row.sourceName+" "+row.brandPrinted+" "+row.packSizePrinted).toLowerCase();
  return matchesPage&&text.includes(query.toLowerCase().trim());
 })||[],[data,page,query]);
 return <section className="adminCard">
  <h2>Canva product catalogue — review queue</h2>
  <p className="smallprint">Read-only source extracted from the ANUSMITA six-page Korean skincare catalogue. This is not an imported product or live inventory list; no prices, SKUs, stock or images are automatically assigned.</p>
  {error&&<p className="error" role="alert">{error}</p>}
  {loading&&<p className="muted">Reading Canva source index…</p>}
  {data&&<>
   <p className="notice"><strong>{data.total} products</strong> extracted from pages 2–6 · <a href={data.source.url} target="_blank" rel="noreferrer" style={{textDecoration:"underline"}}>Open original Canva catalogue ↗</a></p>
   <p className="smallprint">{data.disclaimer}</p>
   <div className="filters">
    <a className="button small light" href="/api/admin/canva-source?format=csv" download>Download verification CSV</a>
    <span className="muted">Review SKU, price, cost, inventory and image match before uploading anything.</span>
   </div>
   <div className="formGrid">
    <div className="field"><label htmlFor="canva-search">Find product</label>
     <input id="canva-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="COSRX, Medicube, toner…"/></div>
    <div className="field"><label htmlFor="canva-page">Catalogue page</label>
     <select id="canva-page" value={page} onChange={e=>setPage(e.target.value)}>
      <option value="All">All product pages</option>{[2,3,4,5,6].map(n=><option key={n} value={n}>Page {n}</option>)}
     </select></div>
   </div>
   <div style={{overflowX:"auto"}}><table><thead><tr><th>Page</th><th>Product as printed</th><th>Pack size</th><th>Review status</th></tr></thead>
    <tbody>{filtered.map(x=><tr key={x.sourcePage+"-"+x.positionOnPage}>
     <td>{x.sourcePage}</td><td>{x.sourceName}</td><td>{x.packSizePrinted}</td>
     <td>{x.reviewNote?"Name/size needs correction":"SKU · price · stock · images pending"}</td>
    </tr>)}</tbody></table></div>
   {!filtered.length&&<p className="muted">No product names match the filter.</p>}
  </>}
 </section>;
}
