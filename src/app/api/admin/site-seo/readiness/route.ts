import {authorize,apiError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,ProductSeo} from "@/lib/models";
import {searchReadiness} from "@/lib/search-readiness";

export async function GET(){
 try{
  await authorize(["owner","admin"],"settings.view");await db();
  const rows=await Product.aggregate([
   {$match:{active:true,archived:{$ne:true}}},
   {$facet:{
    total:[{$count:"count"}],
    missingDescription:[{$match:{$or:[{description:{$exists:false}},{description:""}]}},{$count:"count"}],
    missingImages:[{$match:{"imageUrls.0":{$exists:false}}},{$count:"count"}],
    missingBrand:[{$match:{$or:[{brand:{$exists:false}},{brand:""}]}},{$count:"count"}]
   }}
  ]).option({maxTimeMS:5000});
  const summary=rows[0]??{};
  const optedOut=await ProductSeo.countDocuments({noIndex:true}).maxTimeMS(5000);
  return Response.json({...searchReadiness(process.env),catalogue:{
   published:summary.total?.[0]?.count??0,
   missingDescription:summary.missingDescription?.[0]?.count??0,
   missingImages:summary.missingImages?.[0]?.count??0,
   missingBrand:summary.missingBrand?.[0]?.count??0,
   seoRecordsNoIndex:optedOut
  }},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
