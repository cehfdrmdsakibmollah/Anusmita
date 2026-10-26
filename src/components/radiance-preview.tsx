"use client";

import StorefrontHelp from "./storefront-help";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Crown, Diamond, Expand, Gift, Heart, Headphones, Leaf, LockKeyhole, Menu, Minus, Package, Plus, Search, ShieldCheck, ShoppingBag, Truck, UserRound, X } from "lucide-react";

import CategoryProductPreview,{previewCategories} from "./category-product-preview";
import {assistantHref} from "@/lib/product-experience";

// The supplied artwork is framed with CSS. All text, navigation and controls are HTML.
// Coordinates use the reference's native 1122 × 1402 canvas; no UI is flattened into a screenshot.
type Region = readonly [number, number, number, number];
const photos: Region[] = [[184,170,374,360],[48,132,72,71],[48,294,72,72],[48,375,72,72],[48,456,72,72]];
function Art({ region, label, className = "" }: { region: Region; label: string; className?: string }) {
  const [x,y,w,h] = region;
  return <span className={`rp-art ${className}`} role="img" aria-label={label} style={{aspectRatio:`${w}/${h}`}}>
    <img src="/brand/reference/radiance.png" alt="" draggable={false} style={{width:`${1122/w*100}%`,height:`${1402/h*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}} />
  </span>;
}
const sizes = ["2ml Spray", "5ml", "10ml", "15ml", "50ml", "100ml"];
// Deliberately separate from catalogue prices and inventory.
const samplePrices = [4,8,12,17,38,68];
const collections = [
  {name:"Glow Moisture Cream",category:"Skincare",region:[47,875,159,114] as Region,price:36},
  {name:"Matte Velvet Lipstick",category:"Beauty",region:[225,875,157,114] as Region,price:22},
  {name:"Vitamin C Face Serum",category:"Skincare",region:[397,875,155,115] as Region,price:28},
  {name:"Premium Handbag",category:"Bags",region:[571,875,155,115] as Region,price:72},
  {name:"Elegant Women's Watch",category:"Watches",region:[747,875,153,115] as Region,price:54},
  {name:"Cotton Bed Sheet Set",category:"Bed Sheets",region:[920,875,156,115] as Region,price:68},
];
const description = "A timeless fragrance that celebrates your inner glow. ANUSMITA Radiance Eau De Parfum is a delicate blend of fresh florals and warm musks, crafted for the modern woman who radiates confidence, grace and beauty in every moment.";
const details = [
  ["Description", description],
  ["Ingredients", "Sample fragrance composition: rose, lychee, bergamot, jasmine, peony, orange blossom, vanilla, musk and sandalwood. Confirm ingredients on the actual product packaging."],
  ["How to Use", "Spray lightly onto pulse points. Avoid eyes and irritated skin. This is sample copy for the design preview."],
  ["Shipping & Delivery", "Delivery charges and timing will be confirmed for published products. The free-shipping label in this mockup is illustrative."],
  ["Returns & Refunds", "Contact ANUSMITA for the applicable policy before ordering. The preview does not establish a return policy."],
  ["Reviews (128)", "The rating and review count are sample design content. No customer reviews are collected or represented by this preview."],
];
export default function RadiancePreview() {
  const [category,setCategory]=useState("Perfumes");
  const [photo,setPhoto] = useState(0), [size,setSize] = useState(5), [qty,setQty] = useState(1);
  const [saved,setSaved] = useState<string[]>([]), [message,setMessage] = useState("");
  const zoom = useRef<HTMLDialogElement>(null), bag = useRef<HTMLDialogElement>(null);
  const [bagItem,setBagItem] = useState("Radiance Eau De Parfum");
  const favourite = saved.includes("Radiance");
  function toggle(name:string) { setSaved(old => old.includes(name) ? old.filter(x=>x!==name) : [...old,name]); setMessage(`${name}: wishlist updated for this preview.`); }
  function previewBag(name:string) { setBagItem(name); bag.current?.showModal(); }
  function advance(n:number) {setPhoto(old=>(old+n+photos.length)%photos.length);}
  return <div className="radiancePreview">
    <div className="rp-announcement"><div className="rp-container"><span><Gift/> Free Shipping on Orders over $50</span><span><Package/> Get 10% Off on Your First Order</span><span><ShieldCheck/> 100% Authentic Products</span><small>Illustrative design · not a live offer</small></div></div>
    <header className="rp-header"><div className="rp-container rp-header-inner">
      <Link href="/" className="rp-logo"><Art region={[44,35,55,50]} label="ANUSMITA emblem"/><span>ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></span></Link>
      <nav className="rp-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link className="active" href="/#shop">Shop <ChevronDown/></Link><Link href="/?category=Beauty#shop">Beauty <ChevronDown/></Link><Link href="/?category=Fashion#shop">Fashion <ChevronDown/></Link><Link href="/?category=Bed%20Sheets#shop">Home Decor <ChevronDown/></Link><Link href="/?category=Mobile%20Accessories#shop">Accessories <ChevronDown/></Link><Link href="/#offers">Offers</Link></nav>
      <form className="rp-search" action="/" role="search"><input name="q" placeholder="Search for products…" aria-label="Search products"/><button aria-label="Search"><Search/></button></form>
      <div className="rp-tools"><Link href="/admin/login"><UserRound/><small>Account</small></Link><button onClick={()=>{setBagItem(saved.length ? `Wishlist: ${saved.join(", ")}` : "Your preview wishlist is empty");bag.current?.showModal();}}><Heart/><small>Wishlist</small></button><button onClick={()=>previewBag("Your preview shopping bag")}><ShoppingBag/><small>Cart</small><b>0</b></button><details className="rp-mobile-menu"><summary aria-label="Open navigation"><Menu/></summary><nav>{["Skincare","Beauty","Fashion","Watches","Perfumes","Bags","Bed Sheets","Mobile Accessories"].map(c=><Link key={c} href={`/?category=${encodeURIComponent(c)}#shop`}>{c}</Link>)}</nav></details></div>
    </div></header>
    <div className="rp-container">
      <nav className="rp-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight/><Link href="/?category=Beauty#shop">Beauty</Link><ChevronRight/><Link href="/?category=Perfumes#shop">Perfumes</Link><ChevronRight/><span>ANUSMITA Radiance Eau De Parfum</span></nav>
      <section className="pd-category-picker" aria-label="Preview product categories"><span>EXPLORE THE PRODUCT EXPERIENCE</span><h2>Every category. The same ANUSMITA care.</h2><div>{previewCategories.map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div></section>
      {category==='Perfumes'?<><div className="rp-main">
        <section className="rp-gallery" aria-label="Product gallery">
          <div className="rp-thumbs">{photos.map((region,i)=><button key={i} className={photo===i?"selected":""} aria-label={`Show product photo ${i+1}`} aria-pressed={photo===i} onClick={()=>setPhoto(i)}><Art region={region} label={`Radiance perfume view ${i+1}`}/></button>)}<button className="rp-more-photos" aria-label="Next product photo" onClick={()=>advance(1)}><ChevronDown/></button></div>
          <div className="rp-hero"><Art region={photos[photo]} label={`ANUSMITA Radiance perfume — view ${photo+1}`}/><span className="rp-bestseller"><Crown/> Bestseller</span><button className="rp-heart" aria-label="Save Radiance to preview wishlist" aria-pressed={favourite} onClick={()=>toggle("Radiance")}><Heart fill={favourite?"currentColor":"none"}/></button><button className="rp-prev" aria-label="Previous product photo" onClick={()=>advance(-1)}><ChevronLeft/></button><button className="rp-next" aria-label="Next product photo" onClick={()=>advance(1)}><ChevronRight/></button><button className="rp-expand" aria-label="Expand product photo" onClick={()=>zoom.current?.showModal()}><Expand/></button></div>
        </section>
        <section className="rp-purchase" aria-label="Product options">
          <div className="rp-eyebrow">ANUSMITA &nbsp;|&nbsp; PERFUMES</div><h1>Radiance Eau De Parfum</h1>
          <div className="rp-rating"><span aria-label="Sample rating: 4.8 out of 5">★★★★★</span><small>4.8 (128 reviews) <i/> 1.2K+ bought this month</small></div>
          <div className="rp-price"><strong>${samplePrices[size].toFixed(2)}</strong><del>${(samplePrices[size]/.8).toFixed(2)}</del><span>20% Off</span><small>Sample price</small></div>
          <p className="rp-description">{description}</p>
          <fieldset className="rp-sizes"><legend>Size:</legend><div>{sizes.map((s,i)=><button key={s} type="button" className={size===i?"selected":""} aria-pressed={size===i} onClick={()=>setSize(i)}><strong>{s}</strong><span>${samplePrices[i].toFixed(2)}</span></button>)}</div></fieldset>
          <div className="rp-quantity"><div><strong>Quantity:</strong><div className="rp-counter"><button aria-label="Reduce quantity" disabled={qty===1} onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus/></button><output aria-label="Quantity" aria-live="polite">{qty}</output><button aria-label="Increase quantity" disabled={qty===20} onClick={()=>setQty(q=>Math.min(20,q+1))}><Plus/></button></div></div><span className="rp-stock">● &nbsp; In Stock <small>· sample</small></span></div>
          <div className="rp-actions"><button className="rp-primary" onClick={()=>previewBag(`Radiance Eau De Parfum · ${sizes[size]} · quantity ${qty}`)}><ShoppingBag/> Add to Cart</button><button className="rp-wish" onClick={()=>toggle("Radiance")} aria-pressed={favourite}><Heart fill={favourite?"currentColor":"none"}/>{favourite?"Added to Wishlist":"Add to Wishlist"}</button></div>
          <div className="pd-help"><Link href={assistantHref("Perfumes")}>Ask ANUSMITA about fragrance sizes →</Link></div>
          <div className="rp-trust">{[[Truck,"Free Shipping","on orders over $50"],[ShieldCheck,"100% Authentic","Original products"],[Package,"Easy Returns","30-day policy"],[Headphones,"24/7 Support","We're here to help"]].map(([Icon,title,copy])=>{const I=Icon as typeof Truck;return <div key={String(title)}><I/><span><strong>{String(title)}</strong><small>{String(copy)}</small></span></div>;})}</div>
        </section>
      </div>
      <section className="rp-info" aria-label="Product information">
        <article className="rp-story"><Art region={[47,571,181,257]} label="Beauty editorial portrait with pink flowers"/><div><h2>A Fragrance<br/>That Brings Out<br/>Your Inner <em>Glow</em></h2><p>Delicate florals, warm musks and a touch of elegance — crafted for your most beautiful moments.</p><span>More Beauty,<br/>More You ♡</span></div></article>
        <article className="rp-notes"><h2>Fragrance Notes</h2>{([[[429,611,62,62],"Top Notes","Rose, Lychee, Bergamot"],[[429,685,62,62],"Heart Notes","Jasmine, Peony, Orange Blossom"],[[429,757,62,61],"Base Notes","Vanilla, Musk, Sandalwood"]] as const).map(([region,label,text])=><div key={String(label)}><Art region={region as Region} label={String(label)}/><p><strong>{String(label)}</strong><span>{String(text)}</span></p></div>)}</article>
        <article className="rp-highlights"><h2>Key Highlights</h2>{[[Diamond,"Long Lasting","Fragrance","Up to 8 hours"],[Leaf,"Premium Ingredients","Crafted with fine French","essences"],[Heart,"Perfect for Everyday Wear","A signature scent for every you",""],[Gift,"Elegant Packaging","A beautiful choice for gifting",""]].map(([Icon,title,a,b])=>{const I=Icon as typeof Heart;return <div key={String(title)}><I/><p><strong>{String(title)}</strong><span>{String(a)}<br/>{String(b)}</span></p></div>;})}</article>
        <article className="rp-details"><h2>Product Details</h2>{details.map(([title,copy])=><details key={title}><summary>{title}<Plus/></summary><p>{copy}</p></details>)}</article>
      </section>
      </>:<CategoryProductPreview key={category} category={category}/> }
      <section className="rp-related"><div className="rp-section-heading"><h2>You May Also Like</h2><Link href="/#shop">View All <ArrowRight/></Link></div><div className="rp-product-grid">{collections.map(item=><article key={item.name}><div className="rp-card-art"><Link href={`/?category=${encodeURIComponent(item.category)}#shop`}><Art region={item.region} label={item.name}/></Link><button aria-label={`Save ${item.name}`} aria-pressed={saved.includes(item.name)} onClick={()=>toggle(item.name)}><Heart fill={saved.includes(item.name)?"currentColor":"none"}/></button></div><div className="rp-card-copy"><small>ANUSMITA</small><h3>{item.name}</h3><div className="rp-card-rating">★★★★★ <span>(96)</span></div><strong>${item.price.toFixed(2)}</strong><button className="rp-primary" onClick={()=>previewBag(item.name)}><ShoppingBag/> Add to Cart</button></div></article>)}</div></section>
    </div>
    <section className="rp-banner"><div className="rp-container"><Art region={[1,1096,170,98]} label="Pink blossom arrangement"/><div><h2>Turn Everyday Moments<br/>Into Beautiful <em>Memories</em></h2><p>DISCOVER THE ANUSMITA BEAUTY COLLECTION</p></div><Link className="rp-primary" href="/?category=Beauty#shop">Shop Beauty <ArrowRight/></Link><Art region={[575,1097,319,97]} label="ANUSMITA beauty and fragrance collection"/><span>Confidence<br/>Looks Beautiful<br/>On You ♡</span></div></section>
    <section className="rp-promise"><div className="rp-container"><div><Art region={[44,35,55,50]} label="ANUSMITA emblem"/><p><strong>The ANUSMITA Promise</strong><span>Quality, Beauty and Style for Every You.</span></p></div>{[[Leaf,"Curated with Care","Handpicked for you"],[ShieldCheck,"Premium Quality","Style you can trust"],[Crown,"A More Beautiful You","Fashion · Jewellery · Beauty · Lifestyle"]].map(([Icon,title,copy])=>{const I=Icon as typeof Leaf;return <div key={String(title)}><I/><p><b>{String(title)}</b><span>{String(copy)}</span></p></div>;})}</div></section>
    <StorefrontHelp embedded/><footer className="rp-footer"><div className="rp-container"><div className="rp-footer-grid"><div><Link className="rp-logo" href="/"><span>ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></span></Link><p>A complete lifestyle destination offering premium fashion, jewellery, beauty and home essentials for a more beautiful you.</p></div><div><h3>Shop</h3>{["All Products","Beauty","Fashion","Watches","Home Decor","Accessories","Offers"].map((c,i)=><Link key={c} href={i===0?"/#shop":i===6?"/#offers":`/?category=${encodeURIComponent(c==="Home Decor"?"Bed Sheets":c==="Accessories"?"Mobile Accessories":c)}#shop`}>{c}</Link>)}</div><div><h3>Customer Care</h3><Link href="/shop/design-preview">Browse Products</Link><Link href="/contact/design-preview">Contact & assistance</Link><Link href="/account/design-preview">My Account</Link><a href="#preview-information">Preview Information</a></div><div><h3>About ANUSMITA</h3><Link href="/#our-story">Our Story</Link><Link href="/#collections">Our Collections</Link><Link href="/#offers">Featured Offers</Link></div><div><h3>Discover Your Next Favourite</h3><p>Explore our beauty, fashion and lifestyle collections.</p><Link className="rp-primary" href="/#collections">Explore ANUSMITA <ArrowRight/></Link><p className="rp-footer-security"><LockKeyhole/> Designed with care for you.</p></div></div><div className="rp-footer-bottom"><span>© {new Date().getFullYear()} ANUSMITA. All rights reserved.</span><span id="preview-information">Design preview · Sample prices, ratings, claims and policies · No orders or payments</span></div></div></footer>
    <p className="rp-sr-only" role="status">{message}</p>
    <dialog className="rp-dialog rp-zoom" ref={zoom} onClick={e=>{if(e.target===e.currentTarget)zoom.current?.close();}}><button className="rp-dialog-close" aria-label="Close enlarged photo" onClick={()=>zoom.current?.close()}><X/></button><Art region={photos[photo]} label="Enlarged Radiance perfume"/><div className="rp-zoom-controls"><button aria-label="Previous enlarged photo" onClick={()=>advance(-1)}><ChevronLeft/></button><span>{photo+1} / {photos.length}</span><button aria-label="Next enlarged photo" onClick={()=>advance(1)}><ChevronRight/></button></div></dialog>
    <dialog className="rp-dialog" ref={bag}><button className="rp-dialog-close" aria-label="Close preview message" onClick={()=>bag.current?.close()}><X/></button><ShoppingBag/><h2>{bagItem}</h2><p>This is an interactive design preview. Sample prices, stock, ratings and promotional claims are illustrative. No item has been added to a real cart, and no payment will be taken.</p><Link className="rp-primary" href="/#shop">Browse the catalogue <ArrowRight/></Link></dialog>
  </div>;
}
