
"use client";
import {useEffect,useState} from "react";
type Check={key:string;label:string;ready:boolean;detail:string;required:boolean};
type Report={mode:"catalog"|"live";checkoutEnabled:boolean;checks:Check[];requiredPassed:number;requiredTotal:number;note:string};
export default function LaunchReadiness(){
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
 async function refresh(){
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/admin/readiness",{cache:"no-store"});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||"Readiness check failed");
   setReport(data);
  }catch(e){setError(e instanceof Error?e.message:"Unable to check launch readiness");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 return <section className="adminCard">
  <p className="eyebrow">Deployment safety</p><h2>Launch readiness center</h2>
  <p className="smallprint">This report checks private server configuration without displaying passwords or API keys. Passing checks are not proof of payment gateway, courier, tax or backup compliance.</p>
  <button className="button small light" type="button" disabled={loading} onClick={()=>void refresh()}>{loading?"Checking…":"Refresh readiness"}</button>
  {error&&<p className="error" role="alert">{error}</p>}
  {report&&<><div className="kpiGrid">
   <div className="kpi"><div className="muted">Store mode</div><div className="number">{report.mode==="live"?"Live":"Catalog"}</div></div>
   <div className="kpi"><div className="muted">Required checks</div><div className="number">{report.requiredPassed} / {report.requiredTotal}</div></div>
   <div className="kpi"><div className="muted">API checkout</div><div className="number">{report.checkoutEnabled?"Enabled":"Locked"}</div></div>
  </div>
  <table><thead><tr><th>Status</th><th>Requirement</th><th>Next step</th></tr></thead><tbody>
   {report.checks.map(c=><tr key={c.key}><td>{c.ready?"✓ Ready":"○ Pending"}{!c.required?" · Optional":""}</td><td>{c.label}</td><td>{c.detail}</td></tr>)}
  </tbody></table>
  <p className="notice">{report.note}</p>
  <p>**Activation:** Configure a separate MongoDB database, secure owner account, HTTPS site URL and session secret first. Then set <code>STORE_MODE=live</code> in the hosting environment and redeploy. Do not enable until real checkout testing and commercial hosting terms are reviewed.</p>
  </>}
 </section>;
}
