"use client";
import {useEffect,useState} from "react";
type Status={provider:"steadfast"|"whatsapp";configured:boolean;credentialsTested:boolean;lastTestResult:string;enabled:boolean;updatedAt:string|null};
export default function ProviderConnect(){
 const [statuses,setStatuses]=useState<Status[]>([]),[vaultReady,setVaultReady]=useState(false),[provider,setProvider]=useState<"steadfast"|"whatsapp">("steadfast");
 const [apiKey,setApiKey]=useState(""),[secretKey,setSecretKey]=useState(""),[accessToken,setAccessToken]=useState(""),[phoneNumberId,setPhoneNumberId]=useState("");
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function load(){try{const r=await fetch("/api/admin/provider-connections",{cache:"no-store"}),d=await r.json();if(!r.ok)throw Error(d.error||"Unable to read connections");setStatuses(d.providers||[]);setVaultReady(Boolean(d.vaultReady));}catch(e){setNotice(String(e));}}
 useEffect(()=>{void load();},[]);
 function clearSecrets(){setApiKey("");setSecretKey("");setAccessToken("");setPhoneNumberId("");}
 async function connect(e:React.FormEvent){e.preventDefault();if(!vaultReady)return;setBusy(true);setNotice("Testing official provider credentials…");try{
  const body=provider==="steadfast"?{provider,apiKey,secretKey}:{provider,accessToken,phoneNumberId};
  const r=await fetch("/api/admin/provider-connections",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||"Credential verification failed");
  clearSecrets();setNotice("Credentials verified through a read-only provider request and stored encrypted. No messaging or shipments enabled.");await load();
 }catch(e){setNotice(String(e));}finally{setBusy(false);}}
 async function revoke(p:"steadfast"|"whatsapp"){if(!window.confirm("Revoke stored credentials for "+p+"?"))return;setBusy(true);try{
  const r=await fetch("/api/admin/provider-connections",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:p})});const d=await r.json();if(!r.ok)throw Error(d.error||"Revocation failed");setNotice("Encrypted credentials revoked.");await load();
 }catch(e){setNotice(String(e));}finally{setBusy(false);}}
 return <section className="adminCard"><h3>Secure Provider Setup & Test Connection</h3>
 <p className="smallprint">Owner-only credential submission. Steadfast uses official read-only balance verification; WhatsApp verifies a Meta phone-number resource. Tests never create shipments or send messages. No secret values are returned to your browser after saving.</p>
 {!vaultReady&&<p role="alert" className="notice">Credential vault is not ready. Configure a fresh 32-byte base64 INTEGRATION_VAULT_KEY in Netlify server environment before submitting credentials.</p>}
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>{statuses.map(s=><article className="kpi" key={s.provider}><strong>{s.provider==="steadfast"?"Steadfast Courier":"WhatsApp Cloud API"}</strong><p className="smallprint">{s.configured?"Encrypted credentials stored":"Not configured"}</p><p className="smallprint">Read-only test: {s.credentialsTested?"Passed":"Not verified"}</p><p className="smallprint">Operational messaging/shipping: Disabled</p>{s.configured&&<button type="button" className="button small light" disabled={busy} onClick={()=>void revoke(s.provider)}>Revoke credentials</button>}</article>)}</div>
 <form className="adminForm" onSubmit={e=>void connect(e)} autoComplete="off">
 <div className="field"><label htmlFor="provider-kind">Provider</label><select id="provider-kind" value={provider} onChange={e=>{setProvider(e.target.value as "steadfast"|"whatsapp");clearSecrets();}}><option value="steadfast">Steadfast Courier</option><option value="whatsapp">Meta WhatsApp Cloud API</option></select></div>
 {provider==="steadfast"?<>
 <div className="field"><label htmlFor="courier-api">Merchant API key</label><input id="courier-api" type="password" autoComplete="off" required minLength={10} value={apiKey} onChange={e=>setApiKey(e.target.value)}/></div>
 <div className="field"><label htmlFor="courier-secret">Merchant secret key</label><input id="courier-secret" type="password" autoComplete="off" required minLength={10} value={secretKey} onChange={e=>setSecretKey(e.target.value)}/></div>
 </>:<>
 <div className="field"><label htmlFor="wa-token">Meta system-user access token</label><input id="wa-token" type="password" autoComplete="off" required minLength={30} value={accessToken} onChange={e=>setAccessToken(e.target.value)}/></div>
 <div className="field"><label htmlFor="wa-phone-id">WhatsApp business phone-number ID</label><input id="wa-phone-id" required pattern="[0-9]{6,30}" value={phoneNumberId} onChange={e=>setPhoneNumberId(e.target.value)}/></div>
 </>}
 <button type="submit" className="button" disabled={busy||!vaultReady}>Test & Save Encrypted Credentials</button>
 </form>
 {notice&&<p role="status">{notice}</p>}
 <p className="smallprint">External API approval, subscribed signed webhooks, verified recipient opt-in and provider-specific messaging/courier adapters are required before any business operation can be enabled. Do not paste arbitrary webhook URLs here.</p>
 </section>;
}
