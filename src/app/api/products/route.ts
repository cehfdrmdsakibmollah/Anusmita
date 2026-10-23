
import { db } from "@/lib/db";
import { Product } from "@/lib/models";
import { apiError } from "@/lib/auth";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 try {
  const url=new URL(request.url);
  const page=Math.min(10000,Math.max(1,Number(url.searchParams.get("page"))||1));
  const limit=Math.min(48,Math.max(1,Number(url.searchParams.get("limit"))||12));
  const idsRaw=url.searchParams.get("ids")||"";
  const ids=idsRaw?idsRaw.split(","):[];
  if(ids.length>30 || ids.some(id=>!/^[0-9a-f]{24}$/i.test(id)))return Response.json({error:"Invalid product IDs"},{status:400});
  const query=ids.length?"":url.searchParams.get("q")?.trim().slice(0,100)||"";
  const category=url.searchParams.get("category")?.trim().slice(0,60)||"";
  const filter:any={active:true};
  if(ids.length) filter._id={$in:ids};
  if(category) filter.category=category;
  if(query) filter.$text={$search:query};
  await db();
  const [products,count]=await Promise.all([
   Product.find(filter).select("name slug sku brand category origin description imageUrls variantLabel size pricePaisa onHand reserved").sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),
   Product.countDocuments(filter)]);
  return Response.json({products:products.map((p:any)=>({...p,_id:String(p._id),available:Math.max(0,p.onHand-p.reserved),onHand:undefined,reserved:undefined})),page,count,pages:Math.ceil(count/limit)},
   {headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
