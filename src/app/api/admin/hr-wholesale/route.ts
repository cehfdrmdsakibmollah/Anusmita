
import {createHash} from "node:crypto";
import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Audit,HrSupplierCandidate} from "@/lib/models";
import {parseHrSupplierCsv,hrWholesaleSourceCsv,hrSupplierTemplate,hrWholesalePublic} from "@/lib/hr-supplier";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const SOURCE="hr-wholesale";
const noStore={"Cache-Control":"private, no-store"};
const csvHeaders=(name:string)=>({
 "Content-Type":"text/csv; charset=utf-8",
 "Content-Disposition":"attachment; filename=\""+name+"\"",
 "Cache-Control":"private, no-store",
 "X-Content-Type-Options":"nosniff"
});
export async function GET(req:Request){
 try{
  const actor=await authorize(["owner","admin","inventory","purchasing"]);
  const params=new URL(req.url).searchParams;
  const mode=params.get("mode")||"public";
  if(mode==="template")return new Response(hrSupplierTemplate(),{headers:csvHeaders("HR-Wholesale-Supplier-Quote-Template.csv")});
  if(mode==="source-csv")return new Response(hrWholesaleSourceCsv(),{headers:csvHeaders("HR-Wholesale-Public-Candidates.csv")});
  if(mode==="public")return Response.json({
   supplier:{name:hrWholesalePublic.sourceName,url:hrWholesalePublic.sourceUrl,advertisedTotal:hrWholesalePublic.siteAdvertisedProductCount},
   observed:hrWholesalePublic.candidateItems.length,
   products:hrWholesalePublic.candidateItems,
   warning:"Only publicly observable names; no supplier prices, stock, business SKUs, verified manufacturer origin, or licensed photo rights."
  },{headers:noStore});
  if(mode!=="staged")throw new HttpError(400,"Invalid view mode");
  if(!["owner","admin","purchasing"].includes(actor.role))throw new HttpError(403,"Purchasing access required for supplier quotes");
  await db();
  const page=Math.min(10000,Math.max(1,Number(params.get("page"))||1));
  const [records,total]=await Promise.all([
   HrSupplierCandidate.find({sourceId:SOURCE}).sort({updatedAt:-1}).skip((page-1)*50).limit(50)
    .select("sourceRef name brand size sourceUrl quotedCostPaisa quoteStatus reviewStatus updatedAt")
    .lean<any[]>(),
   HrSupplierCandidate.countDocuments({sourceId:SOURCE})
  ]);
  return Response.json({products:records.map(x=>({...x,_id:String(x._id)})),total,page,pages:Math.ceil(total/50)},
   {headers:noStore});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","purchasing"]);
  const raw=await req.text();
  if(raw.length>310_000)throw new HttpError(413,"Supplier CSV request is too large");
  const data=JSON.parse(raw) as {mode?:unknown;csv?:unknown;previewHash?:unknown};
  if(!data||!["preview","commit"].includes(String(data.mode)))throw new HttpError(400,"Preview or commit mode required");
  if(typeof data.csv!=="string")throw new HttpError(400,"CSV source is required");
  const rows=parseHrSupplierCsv(data.csv);
  const fileHash=createHash("sha256").update(SOURCE+"\n"+data.csv).digest("hex");
  if(data.mode==="preview"){
   return Response.json({
    previewHash:fileHash,total:rows.length,uniqueRefs:rows.length,
    quotedRows:rows.filter(x=>x.quotedCostPaisa!==null).length,
    unpricedRows:rows.filter(x=>x.quotedCostPaisa===null).length,
    samples:rows.slice(0,30),
    message:"Preview covers supplier staging ONLY. Does not create, publish or change ANUSMITA Product, stock or prices."
   },{headers:noStore});
  }
  if(typeof data.previewHash!=="string"||fileHash!==data.previewHash)
   throw new HttpError(409,"Supplier CSV changed after preview. Review it again.");
  await db();
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const ops=rows.map(row=>{
     const fields:any={
      name:row.name,brand:row.brand,size:row.size,sourceUrl:row.sourceUrl,
      reviewStatus:"needs_review",importedBy:actor.id
     };
     if(row.quotedCostPaisa!==null)fields.quotedCostPaisa=row.quotedCostPaisa;
     return {
      updateOne:{
       filter:{sourceId:SOURCE,sourceRef:row.sourceRef},
       update:{$set:fields,$setOnInsert:{
        sourceId:SOURCE,sourceRef:row.sourceRef,
        quoteStatus:"supplier_provided_unverified",
        ...(row.quotedCostPaisa===null?{quotedCostPaisa:null}:{})
       }},
       upsert:true
      }
     };
    });
    await HrSupplierCandidate.bulkWrite(ops,{session,ordered:true});
    await Audit.create([{
     actorId:actor.id,action:"supplier.source_quote_staged",entity:"SupplierCatalog",
     entityId:SOURCE,details:{
      fileHash,rows:rows.length,quotedRows:rows.filter(x=>x.quotedCostPaisa!==null).length,
      affectedProductInventory:false
     }
    }],{session});
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json({staged:rows.length,source:SOURCE,
   notice:"Private supplier review rows saved. No website products or stock created, changed, or published."},
   {headers:noStore});
 }catch(error){return apiError(error);}
}
