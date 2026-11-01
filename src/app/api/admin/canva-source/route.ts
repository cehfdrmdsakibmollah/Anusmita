
import {authorize,authorizePermission,apiError} from "@/lib/auth";
import {canvaSource,canvaReviewCsv} from "@/lib/canva-source";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 try{
  await authorize(["owner","admin","inventory","purchasing"],"products.view");
  const format=new URL(req.url).searchParams.get("format");
  if(format==="csv")return new Response(canvaReviewCsv(),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":"attachment; filename=\"ANUSMITA-Canva-30-review.csv\"",
   "Cache-Control":"private, no-store",
   "X-Content-Type-Options":"nosniff"
  }});
  return Response.json({
   source:{designId:canvaSource.designId,title:canvaSource.designTitle,
    pages:canvaSource.sourcePageCount,url:canvaSource.shortUrl},
   total:canvaSource.products.length,
   products:canvaSource.products,
   disclaimer:"This is a review-only Canva snapshot. Price, SKU, stock, expiry and product image links are not verified and nothing is imported."
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
