import type {Metadata} from 'next';
import Link from 'next/link';
import SheetCatalogue from '@/components/sheet-catalogue';
import Storefront from '@/components/storefront';
import {db} from '@/lib/db';
import {Product} from '@/lib/models';
import {checkoutEnabled} from '@/lib/launch-config';
import {categoryFilter} from '@/lib/catalog-category';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Shop all products',description:'Browse ANUSMITA beauty, fashion, fragrance and home collections.',alternates:{canonical:'/shop'}};
const pageSize=48;
export default async function Shop({searchParams}:{searchParams:Promise<{page?:string;category?:string;q?:string;sort?:string}>}){
 const query=await searchParams;
 if(!process.env.MONGODB_URI)return <SheetCatalogue query={query}/>;
 const requested=/^[1-9]\d{0,4}$/.test(query.page||'')?Number(query.page):1;
 const category=(query.category||'All').slice(0,80),filter:any={active:true};
 const selected=categoryFilter(category);if(selected)filter.category=selected;
 let products:any[]=[],page=requested,pages=1,connected=false,failed=false;
 if(process.env.MONGODB_URI)try{
  await db();
  const count=await Product.countDocuments(filter).maxTimeMS(10000);
  pages=Math.max(1,Math.ceil(count/pageSize));page=Math.min(requested,pages);
  const data=await Product.find(filter).select('name slug brand category origin imageUrls size variantLabel pricePaisa onHand reserved').sort({createdAt:-1,_id:-1}).skip((page-1)*pageSize).limit(pageSize).maxTimeMS(10000).lean<any[]>();
  products=data.map(p=>({id:String(p._id),name:p.name,slug:p.slug,brand:p.brand||'',category:p.category,origin:p.origin||'Other',image:p.imageUrls?.[0]||'',size:p.size||p.variantLabel||'',pricePaisa:p.pricePaisa,available:Math.max(0,(p.onHand||0)-(p.reserved||0))}));
  connected=true;
 }catch{failed=true;}
 const pageLink=(n:number)=>{const params=new URLSearchParams({page:String(n)});if(query.category)params.set('category',category);return '/shop?'+params.toString();};
 return <div className="anWide catalogPage"><section className="catalogIntro"><p className="anOverline">THE ANUSMITA COLLECTION</p><h1>Find your next favourite.</h1><p>Beauty, fashion, fragrance and home comforts. Explore our published collection, thoughtfully brought together for you.</p></section>
 {failed?<p className="catalogState" role="status">The catalogue is temporarily unavailable. Please try again shortly or <Link href="/contact/design-preview">contact ANUSMITA</Link>.</p>:<Storefront key={page+category+(query.q||'')} products={products} canOrder={connected&&checkoutEnabled(process.env)} catalogPage initialCategory={category}/>}
 {pages>1&&!query.q&&<nav className="catalogPagination" aria-label="Catalogue pages">{page>1&&<Link href={pageLink(page-1)}>Previous</Link>}<span>Page {page} of {pages}</span>{page<pages&&<Link href={pageLink(page+1)}>Next</Link>}</nav>}
 {!checkoutEnabled(process.env)&&<p className="anLaunchNotice">Online checkout is not accepting orders yet.</p>}
 </div>;
}
