'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {ArrowRight, Flower2, Headphones, Heart, Menu, Search, ShoppingBag, UserRound, X} from 'lucide-react';
import {dealCategories, discountPercent, previewDeadline, previewDuration, previewDeals, remainingSeconds, selectDeals, type DealCategory, type DealSort, type PreviewDeal} from '@/lib/deals-preview';

const artSource = '/brand/reference/deals-approved.png';
const support = '/contact/design-preview#assistant-title';
const money = (n:number) => '৳'+n.toLocaleString('en-BD');
function Art({region, className = '', label}: {region:readonly number[]; className?:string; label?:string}) {
  return <svg className={`dp-art ${className}`} viewBox={region.join(' ')} preserveAspectRatio="xMidYMid slice" role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}><image href={artSource} width="1225" height="1284"/></svg>;
}
function Brand({header=false}:{header?:boolean}) {
  return <Link className="dp-brand" href="/" aria-label="ANUSMITA homepage">{header&&<Art region={[94,58,39,40]}/>}<span>ANUSMITA<small>FASHION · JEWELLERY · BEAUTY</small></span></Link>;
}
export default function DealsPreview() {
  const [category,setCategory] = useState<DealCategory>('All Offers');
  const [sort,setSort] = useState<DealSort>('recommended');
  const [query,setQuery] = useState('');
  const [searchOpen,setSearchOpen] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const [saved,setSaved] = useState<string[]>([]);
  const [notice,setNotice] = useState('');
  const [seconds,setSeconds] = useState(previewDuration/1000);
  const [clockReady,setClockReady] = useState(false);
  const [selected,setSelected] = useState<PreviewDeal|null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const now = Date.now();
    let stored:string|null=null;
    try {stored=sessionStorage.getItem('anusmita-deals-preview-deadline-v1');} catch {}
    const deadline=previewDeadline(stored,now);
    try {sessionStorage.setItem('anusmita-deals-preview-deadline-v1',String(deadline));} catch {}
    const tick=()=>setSeconds(remainingSeconds(deadline,Date.now()));
    tick(); setClockReady(true);
    try {const ids:unknown=JSON.parse(localStorage.getItem('anusmita-deals-preview-saved-v1')||'[]');if(Array.isArray(ids))setSaved(ids.filter((id):id is string=>typeof id==='string'&&previewDeals.some(d=>d.id===id)));} catch {}
    const interval=window.setInterval(tick,1000);
    document.addEventListener('visibilitychange',tick);
    return ()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',tick);};
  },[]);
  useEffect(()=>{if(searchOpen)searchInput.current?.focus();},[searchOpen]);
  const expired=clockReady&&seconds===0;
  const rows=selectDeals(category,sort,query);
  const time=[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60];
  function toggleSaved(deal:PreviewDeal) {
    const next=saved.includes(deal.id)?saved.filter(id=>id!==deal.id):[...saved,deal.id];
    setSaved(next);
    try {localStorage.setItem('anusmita-deals-preview-saved-v1',JSON.stringify(next));setNotice(`${deal.name} ${next.includes(deal.id)?'saved on this device':'removed from saved previews'}.`);} catch {setNotice('Saved for this visit. Browser storage is unavailable.');}
  }
  function openDeal(deal:PreviewDeal) {setSelected(deal);dialog.current?.showModal();}
  return <div className="dealsPreview">
    <div className="dp-top"><span><Flower2/> Beauty · Fashion · Lifestyle</span><Link href={support}><Headphones/> Help & Support</Link></div>
    <header className="dp-header"><button className="dp-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="deals-navigation" onClick={()=>setMenuOpen(!menuOpen)}><Menu/></button><Brand header/>
      <nav id="deals-navigation" className={menuOpen?'open':''} aria-label="Main navigation">{[['Home','/'],['Shop','/shop'],['Deals','/deals'],['Bundles','/bundles'],['Journal','/journal/design-preview'],['Contact','/contact/design-preview']].map(([label,href])=><Link key={label} href={href} aria-current={label==='Deals'?'page':undefined}>{label}</Link>)}</nav>
      <div className="dp-tools"><button aria-label="Search deals" aria-expanded={searchOpen} aria-controls="deals-search" onClick={()=>setSearchOpen(!searchOpen)}><Search/></button><Link href="/account/design-preview" aria-label="My account"><UserRound/></Link><Link href="/cart/design-preview" aria-label="Shopping bag"><ShoppingBag/></Link></div>
    </header>
    <section className="dp-hero"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><span>Daily Offers</span></nav><div className="dp-hero-copy"><h1>Little luxuries.<br/><em>Lovely prices.</em></h1><p>Today’s beauty, fashion & lifestyle offers.</p></div><Art region={[480,113,382,215]} className="dp-hero-photo"/></section>
    <div className="dp-content"><section aria-labelledby="deals-title"><div className="dp-section-heading"><h2 id="deals-title">Today’s Flash Deals</h2><div className="dp-timer-group"><div className="dp-timer" aria-label={`Preview countdown: ${time[0]} hours, ${time[1]} minutes, ${time[2]} seconds`}><span>{expired?'Preview ended':'Offers end in'}</span>{time.map((part,i)=><div key={i}><b>{String(part).padStart(2,'0')}</b><small>{['HOURS','MIN','SEC'][i]}</small></div>)}</div><small className="dp-timer-note">Preview timer · Sample offers</small></div></div>
      <div className="dp-toolbar"><div className="dp-categories" aria-label="Deal categories">{dealCategories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="dp-sort"><span className="dp-sr-only">Sort offers</span><select value={sort} onChange={e=>setSort(e.target.value as DealSort)}><option value="recommended">Recommended</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="discount">Biggest Discount</option></select></label></div>
      <div id="deals-search" hidden={!searchOpen} className="dp-search"><Search/><input ref={searchInput} type="search" aria-label="Search offers" placeholder="Search your favourite offers…" value={query} onChange={e=>setQuery(e.target.value)} maxLength={100}/><button aria-label="Clear and close search" onClick={()=>{setQuery('');setSearchOpen(false);}}><X/></button></div>
      {expired&&<p className="dp-expired" role="status">This sample countdown has ended. Explore the collection or ask our team about current offers.</p>}
      <p className="dp-sr-only" role="status">{rows.length} sample offers shown. {notice}</p>
      <div className="dp-grid">{rows.map(deal=><article className="dp-card" key={deal.id}><div className="dp-product-photo"><Art region={deal.art} label={deal.name}/><span className="dp-discount">-{discountPercent(deal)}%</span><button className="dp-heart" aria-label={`${saved.includes(deal.id)?'Unsave':'Save'} ${deal.name}`} aria-pressed={saved.includes(deal.id)} onClick={()=>toggleSaved(deal)}><Heart fill={saved.includes(deal.id)?'currentColor':'none'}/></button></div><div className="dp-card-copy"><h3>{deal.name}</h3><p className="dp-price"><strong>{money(deal.price)}</strong><del>{money(deal.original)}</del></p><button className="dp-primary" onClick={()=>openDeal(deal)} disabled={expired}>{expired?'Offer ended':'View Deal'}</button></div></article>)}</div>
      {!rows.length&&<div className="dp-empty"><h3>No matching offers</h3><p>Try another category or search.</p><button className="dp-primary" onClick={()=>{setCategory('All Offers');setQuery('');}}>Clear filters</button></div>}
    </section>
    <section className="dp-editorial"><Art region={[579,972,249,88]}/><div><h2>A little more to love.</h2><p>Explore the full ANUSMITA collection.</p></div><Link href="/shop" className="dp-outline">Continue Shopping <ArrowRight/></Link></section>
    <aside className="dp-help"><Headphones/><div><h3>Need help choosing?</h3><p>Our team is here to help you find the perfect picks.</p></div><Link href={support} className="dp-primary">Ask ANUSMITA <ArrowRight/></Link></aside></div>
    <footer className="dp-footer"><div className="dp-footer-main"><Brand/><nav aria-label="Customer Care"><h3>Customer Care</h3>{[['Track Your Order','track-order'],['Shipping & Delivery','shipping'],['Returns & Refunds','returns'],['Contact Us','contact'],['FAQ','faq']].map(([label,path])=><Link key={label} href={path==='track-order'?'/track-order':`/${path}/design-preview`}>{label}</Link>)}</nav><nav aria-label="Shop links"><h3>Shop</h3><Link href="/shop">All Products</Link><Link href="/shop?category=Beauty#shop">Beauty</Link><Link href="/shop?category=Fashion#shop">Fashion</Link><Link href="/shop?category=Bed%20Sheets#shop">Home & Lifestyle</Link></nav></div><div className="dp-footer-bottom"><span>© {new Date().getFullYear()} ANUSMITA. All rights reserved.</span><span><Link href="/privacy/design-preview">Privacy Policy</Link><i/> <Link href="/terms/design-preview">Terms of Service</Link></span></div></footer>
    <p className="dp-preview-note">UI design preview · Sample offers, prices & countdown</p>
    <dialog ref={dialog} className="dp-dialog" aria-labelledby="deal-dialog-title" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button className="dp-close" aria-label="Close deal preview" onClick={()=>dialog.current?.close()}><X/></button>{selected&&<><Art region={selected.art}/><div><small>DESIGN PREVIEW · {selected.category}</small><h2 id="deal-dialog-title">{selected.name}</h2><p className="dp-price"><strong>{money(selected.price)}</strong><del>{money(selected.original)}</del></p><p>This is a sample offer for the page design. The price and discount are illustrative; this item cannot be purchased here.</p><Link className="dp-primary" href={`/contact/design-preview?product=${encodeURIComponent(selected.name)}#assistant-title`}>Ask about similar products <ArrowRight/></Link></div></>}</dialog>
  </div>;
}
