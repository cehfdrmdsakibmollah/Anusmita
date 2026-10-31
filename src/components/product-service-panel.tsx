"use client";
import {useState} from "react";
import Link from "next/link";
import {MessageCircle,MapPin,Bell,ShieldCheck} from "lucide-react";
import {assistantHref,productEnquiry} from "@/lib/product-experience";
type Props={name:string;slug:string;size:string;color:string;available:number;preview?:boolean};
const districts=["Dhaka","Chattogram","Khulna","Rajshahi","Barishal","Sylhet","Rangpur","Mymensingh","Other district"] as const;
/** No unverified shipping rate, shipment ETA, review, AI fit or pre-order promise is displayed. */
export default function ProductServicePanel({name,slug,size,color,available,preview=false}:Props){
 const [district,setDistrict]=useState<string>("");
 const [question,setQuestion]=useState("");
 const [notify,setNotify]=useState(false);
 const [submitted,setSubmitted]=useState(false);
 const details=[district?"Delivery area: "+district:"",question.trim()?"Question: "+question.trim():"",notify?"Please contact me if this SKU becomes available. No automatic restock alert has been registered.":""].filter(Boolean).join("; ");
 const enquiry=productEnquiry(name,slug,size,color,1,details);
 return <section className="anPdpServices" aria-label="Delivery, questions and availability">
  <div className="anPdpServicesHead"><span>PERSONAL ASSISTANCE</span><h2>We’re here to help you choose.</h2><p>All enquiries are reviewed by our team. Requests do not reserve products or place orders.</p></div>
  <div className="anPdpServiceCards">
   <div className="anPdpServiceCard">
    <h3><MapPin size={19}/> Delivery & availability</h3>
    <label htmlFor="pdp-delivery-district">Where would you like delivery?</label>
    <select id="pdp-delivery-district" value={district} onChange={e=>setDistrict(e.target.value)}>
     <option value="">Select a district to enquire</option>
     {districts.map(d=><option value={d} key={d}>{d}</option>)}
    </select>
    <p>Delivery fees, service coverage, COD eligibility and arrival dates are confirmed by ANUSMITA before any order. No rate or date is assumed.</p>
   </div>
   <div className="anPdpServiceCard">
    <h3><MessageCircle size={19}/> Ask a product question</h3>
    <label htmlFor="pdp-product-question">Size, ingredients, compatibility, care or anything else</label>
    <textarea id="pdp-product-question" maxLength={400} rows={3} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What would you like to know about this product?"/>
    <Link href={assistantHref(name,preview?undefined:slug)}>Open ANUSMITA product assistant →</Link>
   </div>
  </div>
  {!preview&&available===0&&<label className="anPdpRestockChoice"><input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)}/><span><Bell size={17}/> Ask the team to contact me about availability. This only adds a note to my enquiry; automatic alerts and pre-orders are not enabled.</span></label>}
  {!preview&&<a className="anPdpServiceSubmit" href={enquiry} target="_blank" rel="noopener noreferrer" onClick={()=>setSubmitted(true)}><MessageCircle size={18}/> Prepare WhatsApp enquiry</a>}
  {submitted&&<p role="status" className="anPdpServiceStatus">WhatsApp draft opened. Your enquiry is sent only if you choose to send it.</p>}
  <div className="anPdpReviewTruth"><ShieldCheck size={19}/><p><strong>Customer reviews & fit guidance</strong> — Verified purchase reviews, image testimonials and measured-fit recommendations are not published for this item yet. For specific guidance, ask our team.</p></div>
 </section>;
}
