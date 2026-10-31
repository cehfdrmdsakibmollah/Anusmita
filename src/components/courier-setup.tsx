"use client";
import {useState} from "react";
const couriers=[{name:"Pathao Courier",code:"pathao"},{name:"Steadfast",code:"steadfast"},{name:"REDX",code:"redx"}] as const;
export default function CourierSetup({role}:{role:string}){
 const [selection,setSelection]=useState<string>("pathao");
 if(!["owner","admin","sales","support"].includes(role))return <p>Courier configuration requires authorized staff.</p>;
 return <section className="adminCard" aria-labelledby="courier-setup-heading">
  <h2 id="courier-setup-heading">Courier integration setup</h2>
  <p className="smallprint">Providers are prepared as future integration options. No merchant credentials have been entered, API connection verified, courier order submitted, or tracking reference generated.</p>
  <label htmlFor="courier-provider">Courier provider</label>
  <select id="courier-provider" value={selection} onChange={e=>setSelection(e.target.value)}>
   {couriers.map(x=><option key={x.code} value={x.code}>{x.name}</option>)}
  </select>
  <dl className="courierProviderStatus"><div><dt>Selected provider</dt><dd>{couriers.find(x=>x.code===selection)?.name}</dd></div><div><dt>API status</dt><dd>Not connected</dd></div><div><dt>Shipment creation</dt><dd>Disabled</dd></div><div><dt>Tracking updates</dt><dd>Awaiting verified provider credentials</dd></div></dl>
  <p>Next setup: verify the merchant account, official API terms, credentials, status mapping, webhook authentication, idempotency and a provider test shipment. Keep tokens server-side; do not paste them into this page.</p>
  <a href="/admin?tab=Orders">Manage orders manually until a courier is connected →</a>
 </section>;
}
