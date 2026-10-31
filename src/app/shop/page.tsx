import type {Metadata} from "next";
import Link from "next/link";
import ShopReference from "@/components/shop-reference";
import SheetCatalogue from "@/components/sheet-catalogue";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Shop All Products | ANUSMITA",description:"Browse ANUSMITA beauty, skincare, fashion and home collections.",alternates:{canonical:"/shop"}};
const options=["Japan","Korea","China"],concerns=["Acne","Brightening","Sensitive","Dry Skin","Oily Skin"];
const categoryOptions=["Skincare","Makeup","Perfume","Fashion","Bedsheets","Watches","Bags","Jewellery","Accessories"];
function selectedArray(v:string|string[]|undefined){return (Array.isArray(v)?v:v?[v]:[]).slice(0,10);}
type Query={page?:string;category?:string;q?:string;sort?:string;origin?:string|string[];concern?:string|string[];min?:string;max?:string};
export default async function Shop({searchParams}:{searchParams:Promise<Query>}){
 const query=await searchParams;
 if(!process.env.MONGODB_URI)return <SheetCatalogue query={query}/>;
 const origins=selectedArray(query.origin).filter(x=>options.includes(x));
 const selectedConcerns=selectedArray(query.concern).filter(x=>concerns.includes(x));
 const category=categoryOptions.includes(query.category||"")?query.category!:"All";
 const sort=["newest","price-low","price-high","name"].includes(query.sort||"")?query.sort!:"newest";
 const pageRequested=/^[1-9]\d{0,3}$/.test(query.page||"")?Number(query.page):1;
 const rawMin=Number(query.min),rawMax=Number(query.max);
 const minPrice=query.min!==undefined&&query.min!==""&&Number.isFinite(rawMin)&&rawMin>=0?Math.min(rawMin,10000000):null;
 const maxPrice=query.max!==undefined&&query.max!==""&&Number.isFinite(rawMax)&&rawMax>=0?Math.min(rawMax,10000000):null;
 const search=(query.q||"").trim().slice(0,80);
 const filter:Record<string,any>={active:true};
 if(category!=="All"){
  const regex:Record<string,string>={Skincare:"skin|serum|sunscreen|cleanser|toner",Makeup:"makeup|cosmetic",Perfume:"perfume|fragrance|attar|decant",Fashion:"fashion|cloth|dress|wear|apparel",Bedsheets:"bed|sheet|linen",Watches:"watch|timepiece",Bags:"bag|handbag|purse",Jewellery:"jewel|ring|necklace|earring",Accessories:"accessor"};
  filter.category={$regex:regex[category],$options:"i"};
 }
 if(origins.length)filter.origin={$in:origins};
 if(selectedConcerns.length)filter.skinType={$regex:selectedConcerns.join("|"),$options:"i"};
 if(minPrice!==null||maxPrice!==null)filter.pricePaisa={...(minPrice!==null?{$gte:Math.round(minPrice*100)}:{}),...(maxPrice!==null?{$lte:Math.round(maxPrice*100)}:{})};
 if(search){const escaped=search.split("").map(c=>"\\^$.*+?()[]{}|".includes(c)?"\\"+c:c).join("");filter.$or=[{name:{$regex:escaped,$options:"i"}},{brand:{$regex:escaped,$options:"i"}}];}
 const sortMap:Record<string,Record<string,1|-1>>={newest:{createdAt:-1,_id:-1},"price-low":{pricePaisa:1,_id:-1},"price-high":{pricePaisa:-1,_id:-1},name:{name:1,_id:1}};
 let products:any[]=[],count=0,page=pageRequested,pages=1,failed=false;
 try{await db();count=await Product.countDocuments(filter).maxTimeMS(10000);pages=Math.max(1,Math.ceil(count/9));page=Math.min(pageRequested,pages);
  const rows=await Product.find(filter).select("name slug brand category origin imageUrls size variantLabel pricePaisa onHand reserved").sort(sortMap[sort]).skip((page-1)*9).limit(9).maxTimeMS(10000).lean<any[]>();
  products=rows.map(p=>({id:String(p._id),name:p.name,slug:p.slug,brand:p.brand||"",category:p.category,origin:p.origin||"",image:p.imageUrls?.[0]||"",size:p.size||p.variantLabel||"",pricePaisa:p.pricePaisa,available:Math.max(0,(p.onHand||0)-(p.reserved||0))}));
 }catch{failed=true}
 return <div className="anWide catalogPage anShopPageScope">{failed?<p className="catalogState" role="status">The catalogue is temporarily unavailable. Please try again or <Link href="/contact/design-preview">contact ANUSMITA</Link>.</p>:<ShopReference products={products} page={page} pages={pages} count={count} filters={{category,origins,concerns:selectedConcerns,minPrice:minPrice===null?"":String(minPrice),maxPrice:maxPrice===null?"":String(maxPrice),sort,q:search}}/>}</div>;
}
