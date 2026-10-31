import Link from "next/link";
import type {Metadata} from "next";
import {ArrowRight,Search} from "lucide-react";
import "./not-found.css";

export const metadata:Metadata={title:"Page not found | ANUSMITA",robots:{index:false,follow:false}};

/** Next.js native not-found route keeps the correct HTTP 404 status. */
export default function NotFound(){
 return <section className="an404" aria-labelledby="an404-heading">
  <div className="an404-shell">
   <div className="an404-hero">
    <div className="an404-photo" role="img" aria-label="ANUSMITA perfume, skincare, handbag, florals and wristwatch"><div className="an404-photo-caption" aria-hidden="true"><span>ANUSMITA</span><small>BEAUTY · FASHION · LIFESTYLE</small></div></div>
    <div className="an404-photo-wash" aria-hidden="true"/>
    <div className="an404-copy">
     <p className="an404-eyebrow">PAGE NOT FOUND</p>
     <p className="an404-number" aria-hidden="true">404</p>
     <h1 id="an404-heading">A little lost?<span>Let’s find something lovely.</span></h1>
     <p className="an404-message">This page may have moved or is no longer available.</p>
     <div className="an404-actions">
      <Link className="an404-button an404-button-primary" href="/">Back to home <ArrowRight size={17} strokeWidth={1.6}/></Link>
      <Link className="an404-button an404-button-outline" href="/shop">Explore the shop</Link>
     </div>
     <form className="an404-search" action="/shop" method="get" role="search">
      <label htmlFor="an404-query">Search products</label>
      <div><input id="an404-query" name="q" type="search" placeholder="Search for skincare, jewellery, bed sheets..." maxLength={100} required/>
       <button type="submit" aria-label="Search products"><Search size={21} strokeWidth={1.7}/></button>
      </div>
     </form>
    </div>
   </div>
   <nav className="an404-quick" aria-label="Explore ANUSMITA">
    <Link href="/shop?category=Skincare">Shop skincare <ArrowRight size={17} strokeWidth={1.5}/></Link>
    <Link href="/shop?category=Bedsheets">Explore bed sheets <ArrowRight size={17} strokeWidth={1.5}/></Link>
    <Link href="/contact/design-preview">Contact ANUSMITA <ArrowRight size={17} strokeWidth={1.5}/></Link>
   </nav>
   <div className="an404-help"><span>Need a hand finding something?</span><Link href="/contact/design-preview">Contact us <ArrowRight size={17} strokeWidth={1.5}/></Link></div>
  </div>
 </section>;
}
