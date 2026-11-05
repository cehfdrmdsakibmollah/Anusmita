import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product} from "@/lib/models";
import {productIdentityQuery,nextProductIdentity} from "@/lib/product-identity";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 try{
  await authorize(["owner","admin","inventory"],"products.edit");
  const input=productIdentityQuery.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));
  await db();
  const [skuMatch,slugMatch]=await Promise.all([
   Product.exists({sku:input.sku}),
   Product.exists({slug:input.slug})
  ]);
  const conflictingSku=Boolean(skuMatch),conflictingSlug=Boolean(slugMatch);
  let suggestedSku:string|null=null,suggestedSlug:string|null=null;
  if(conflictingSku){
   const prefix=input.sku.slice(0,50);
   const candidates=Array.from({length:99},(_,i)=>prefix+"-"+(i+2));
   const existing=await Product.find({sku:{$in:candidates}}).select("sku -_id").lean<{sku:string}[]>();
   const taken=new Set(existing.map(p=>p.sku));
   suggestedSku=nextProductIdentity(input.sku,candidate=>taken.has(candidate),60);
  }
  if(conflictingSlug){
   const prefix=input.slug.slice(0,140);
   const candidates=Array.from({length:99},(_,i)=>prefix+"-"+(i+2));
   const existing=await Product.find({slug:{$in:candidates}}).select("slug -_id").lean<{slug:string}[]>();
   const taken=new Set(existing.map(p=>p.slug));
   suggestedSlug=nextProductIdentity(input.slug,candidate=>taken.has(candidate),200);
  }
  return Response.json({available:!conflictingSku&&!conflictingSlug,skuTaken:conflictingSku,slugTaken:conflictingSlug,suggestedSku,suggestedSlug},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiError(e);}
}
