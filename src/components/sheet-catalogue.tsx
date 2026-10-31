import {ShoppingActions} from './catalogue-shopping';
import ProductImageGallery from './product-image-gallery';
import ProductDetailsAccordion from './product-details-accordion';
import {ArrowRight,ShieldCheck,Package} from 'lucide-react';
import Link from 'next/link';
import {selectCatalogue,type CatalogueProduct} from '@/lib/sheet-catalogue';
const money=(n:number|null)=>n===null?'Confirm price':'৳'+(n/100).toLocaleString('en-BD');
export function CatalogueCard({p}:{p:CatalogueProduct}){return <article className="sheetCard"><Link href={'/products/'+p.slug}><div className="sheetPhoto"><img src={p.image} alt={p.name} loading="lazy"/></div><div className="sheetCardCopy"><small>{p.category.toUpperCase()} · {p.id}</small><h3>{p.name}</h3><strong>{money(p.pricePaisa)}</strong><p>{p.deliveryIncluded?"Delivery included":"Delivery charge confirmed separately"}</p><span>View details →</span></div></Link><ShoppingActions id={p.id}/></article>}
export default function SheetCatalogue({query}:{query:{category?:string;q?:string;page?:string;sort?:string}}){
 const category=(query.category||'All').slice(0,80),q=(query.q||'').slice(0,120),sort=query.sort||'latest';
 const rows=selectCatalogue(category,q,sort),pages=Math.max(1,Math.ceil(rows.length/12));
 const requested=/^[1-9]\d{0,4}$/.test(query.page||'')?Number(query.page):1;
 const page=Math.min(pages,requested);
 const href=(n:number)=>'/shop?'+new URLSearchParams({category,q,sort,page:String(n)});
 return <div className="anWide catalogPage" id="shop"><section className="catalogIntro"><p className="anOverline">THE ANUSMITA COLLECTION</p><h1>Beauty, comfort, and everyday favourites.</h1><p>Discover bedsheets, Korean skincare and beauty. Add your favourites to your bag or save them for later.</p></section>
 <nav className="sheetCategories" aria-label="Product categories">{['All','Bed Sheets','Skincare','Beauty','Fashion','Watches','Bags','Perfumes','Mobile Accessories'].map(c=><Link key={c} aria-current={c===category?'page':undefined} href={'/shop?category='+encodeURIComponent(c)}>{c}</Link>)}</nav>
 <form action="/shop" className="sheetFilters" id="store-search"><input type="hidden" name="category" value={category}/><label>Search products<input name="q" type="search" defaultValue={q} placeholder="Search design, colour or product ID"/></label><label>Sort by<select name="sort" defaultValue={sort}><option value="latest">Latest added</option><option value="name">Name: A–Z</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select></label><button type="submit">Apply</button></form>
 <p className="sheetCount">{rows.length} products · {category==='All'?'All collections':category}</p>
 {rows.length?<div className="sheetGrid">{rows.slice((page-1)*12,page*12).map(p=><CatalogueCard key={p.id} p={p}/>)}</div>:<section className="sheetEmpty"><h2>{q?'No matching products':'This collection is on its way.'}</h2><p>{q?'Try a different colour, design or product ID.':'Products have not been published in this category yet. Our bedsheet collection is available to explore.'}</p><Link href="/shop">Browse available products →</Link></section>}
 {pages>1&&<nav className="catalogPagination" aria-label="Catalogue pages">{page>1&&<Link href={href(page-1)}>← Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link href={href(page+1)}>Next →</Link>}</nav>}
 <p className="anLaunchNotice">Bedsheets: ready stock, with size and quantity confirmed before order. Skincare: availability and delivery charges confirmed separately.</p></div>
}
export function SheetProductDetails({p}:{p:CatalogueProduct}){
 return <main className="anPdp anLegacyPdp">
  <div className="anWide">
   <nav aria-label="Breadcrumb" className="anPdpBreadcrumb">
    <Link href="/">Home</Link><span>›</span><Link href="/shop">Shop</Link><span>›</span>
    <Link href={"/shop?category="+encodeURIComponent(p.category)}>{p.category}</Link><span>›</span><strong>{p.name}</strong>
   </nav>
   <div className="anPdpMain">
    <ProductImageGallery urls={p.image?[p.image]:[]} name={p.name}/>
    <div className="anPdpRight">
     <div className="anPdpBuy">
      <div className="anPdpOverline">ANUSMITA / {p.category}</div>
      <h1>{p.name}</h1>
      {p.pricePaisa!==null?<p className="anPdpPrice">{money(p.pricePaisa)}<span className="anPdpPriceCaption">BDT · listed catalogue price; confirm before ordering</span></p>:<p className="anPdpDemoPrice">Price to be confirmed</p>}
      <p className="anPdpDescription">{p.description}</p>
      <div className="anPdpPurchaseNotes"><p><Package size={17}/> {p.size||"Size details available on enquiry"}</p>
       <p><ShieldCheck size={17}/> Availability confirmed by ANUSMITA before an order</p></div>
      <ShoppingActions id={p.id} detail/>
      <a className="anPdpBrowse" href={"https://wa.me/8801310339192?text="+encodeURIComponent("Hello ANUSMITA, please confirm the size, available stock and final price for "+p.name+" ("+p.id+").")} target="_blank" rel="noopener noreferrer">Ask about this product <ArrowRight size={17}/></a>
      <p className="anPdpFeedback">Catalogue enquiry mode: no order or stock reservation occurs automatically.</p>
     </div>
    </div>
   </div>
   <ProductDetailsAccordion product={{category:p.category,description:p.description,material:p.material||"",size:p.size||"",sku:p.id}}/>
  </div>
 </main>;
}
