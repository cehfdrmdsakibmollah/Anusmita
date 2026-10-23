
import "server-only";
import {createHash} from "node:crypto";
import mongoose from "mongoose";
import {z} from "zod";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,StockMovement,Audit,CatalogImport} from "@/lib/models";
import {csvRows,csvSerialize,CSV_HEADERS,CSV_TEMPLATE,safeSlug,CsvError,type CatalogRow} from "@/lib/catalog-csv";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const requestSchema=z.object({
 csv:z.string().min(1).max(120_000),
 mode:z.enum(["preview","commit"]),
 previewHash:z.string().regex(/^[a-f0-9]{64}$/).optional()
}).strict();

function sha(s:string){return createHash("sha256").update(s).digest("hex");}
type Existing={_id:any;sku:string;updatedAt?:Date};
type PreviewItem={line:number;sku:string;action:"insert"|"update"|"skip"|"error";message:string};
function classify(rows:CatalogRow[],current:Map<string,Existing>):PreviewItem[]{
 return rows.map(row=>{
  const found=current.get(row.sku);
  if(found){
   if(Object.keys(row.changes).length===0)return {line:row.line,sku:row.sku,action:"skip",message:"No editable fields supplied; existing stock unchanged"};
   return {line:row.line,sku:row.sku,action:"update",message:"Update supplied fields only; stock never overwritten"};
  }
  for(const field of ["name","category","pricePaisa","costPaisa"]){
   if(row.changes[field]===undefined)return {line:row.line,sku:row.sku,action:"error",message:"New SKU requires "+field};
  }
  return {line:row.line,sku:row.sku,action:"insert",message:"New draft by default; opening stock recorded separately"};
 });
}
function revision(csv:string,rows:CatalogRow[],current:Map<string,Existing>){
 const snapshot=rows.map(r=>({sku:r.sku,updatedAt:current.get(r.sku)?.updatedAt?.toISOString()||null,exists:current.has(r.sku)}));
 return sha(JSON.stringify({csv,snapshot}));
}
export async function GET(req:Request){
 try{
  await authorize(["owner","admin","inventory","purchasing"]);
  const url=new URL(req.url);
  if(url.searchParams.get("mode")==="template"){
   return new Response("\uFEFF"+CSV_TEMPLATE,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="anusmita-product-import-template.csv"',"Cache-Control":"no-store"}});
  }
  if(url.searchParams.get("mode")!=="export")throw new HttpError(400,"Choose mode=template or mode=export");
  const page=Math.max(1,Math.min(10000,Number(url.searchParams.get("page"))||1));
  await db();
  const products=await Product.find().select("sku name slug brand category origin description size variantLabel pricePaisa costPaisa imageUrls active onHand reorderLevel").sort({sku:1}).skip((page-1)*500).limit(500).lean<any[]>();
  const values=products.map(p=>[p.sku,p.name,p.slug,p.brand,p.category,p.origin,p.description,p.size,p.variantLabel,(p.pricePaisa/100).toFixed(2),(p.costPaisa/100).toFixed(2),(p.imageUrls||[]).join("|"),String(p.active),String(p.onHand),String(p.reorderLevel)]);
  // Column 'opening_stock' is informational in an export: it is intentionally ignored for existing SKU imports.
  return new Response(csvSerialize([Array.from(CSV_HEADERS),...values]),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="anusmita-catalog-page-'+page+'.csv"',"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
export async function POST(req:Request){
 try{
  assertOrigin(req);
  const actor=await authorize(["owner","admin","inventory"]);
  if(Number(req.headers.get("content-length")||0)>145_000)throw new HttpError(413,"CSV payload too large");
  const body=requestSchema.parse(await req.json());
  let rows:CatalogRow[];
  try{rows=csvRows(body.csv);}catch(e){if(e instanceof CsvError)throw new HttpError(400,e.message);throw e;}
  const fileHash=sha(body.csv);
  const importKey=sha(actor.id+"|"+fileHash);
  await db();
  if(body.mode==="commit"){
   const previous=await CatalogImport.findOne({importKey}).lean<any>();
   if(previous)return Response.json({alreadyApplied:true,inserted:previous.inserted,updated:previous.updated,skipped:previous.skipped});
   if(!body.previewHash)throw new HttpError(400,"Review a preview before committing");
  }
  const load=async(session?:mongoose.ClientSession)=>{
   const query=Product.find({sku:{$in:rows.map(x=>x.sku)}}).select("sku updatedAt");
   if(session)query.session(session);
   const products=await query.lean<any[]>();
   return new Map<string,Existing>(products.map(p=>[p.sku,{_id:p._id,sku:p.sku,updatedAt:p.updatedAt}]));
  };
  if(body.mode==="preview"){
   const current=await load();
   const details=classify(rows,current);
   return Response.json({previewHash:revision(body.csv,rows,current),total:rows.length,inserted:details.filter(x=>x.action==="insert").length,updated:details.filter(x=>x.action==="update").length,skipped:details.filter(x=>x.action==="skip").length,errors:details.filter(x=>x.action==="error").length,details},{headers:{"Cache-Control":"no-store"}});
  }
  let result:{inserted:number;updated:number;skipped:number;alreadyApplied?:boolean}={inserted:0,updated:0,skipped:0};
  const session=await mongoose.startSession();
  try{
   await session.withTransaction(async()=>{
    const batch=await CatalogImport.findOne({importKey}).session(session);
    if(batch){result={inserted:batch.inserted,updated:batch.updated,skipped:batch.skipped,alreadyApplied:true};return;}
    const current=await load(session);
    if(revision(body.csv,rows,current)!==body.previewHash)throw new HttpError(409,"Catalogue changed since preview; preview again");
    const decisions=classify(rows,current);
    const problem=decisions.find(x=>x.action==="error");
    if(problem)throw new HttpError(400,"Row "+problem.line+": "+problem.message);
    for(let i=0;i<rows.length;i++){
     const row=rows[i],decision=decisions[i];
     if(decision.action==="skip"){result.skipped++;continue;}
     if(decision.action==="insert"){
      const changes={...row.changes};
      if(!changes.slug)changes.slug="sku-"+safeSlug(row.sku);
      const data={...changes,sku:row.sku,onHand:row.openingStock||0,active:changes.active??false};
      const [product]=await Product.create([data],{session});
      if(row.openingStock) await StockMovement.create([{productId:product._id,type:"receive",deltaOnHand:row.openingStock,actorId:actor.id,note:"Opening stock from reviewed CSV import"}],{session});
      result.inserted++;
     }else{
      const prev=current.get(row.sku)!;
      const saved=await Product.updateOne({_id:prev._id,updatedAt:prev.updatedAt},{$set:row.changes},{session,runValidators:true});
      if(saved.matchedCount!==1)throw new HttpError(409,"Concurrent edit detected: "+row.sku);
      result.updated++;
     }
    }
    await CatalogImport.create([{importKey,actorId:actor.id,fileHash,...result,affectedSkus:rows.map(x=>x.sku),completedAt:new Date()}],{session});
    await Audit.create([{actorId:actor.id,action:"catalog.csv_imported",entity:"CatalogImport",entityId:importKey,details:{...result,count:rows.length}}],{session});
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }catch(e:any){
   if(e?.code===11000)throw new HttpError(409,"Duplicate import or duplicate SKU/slug; verify catalogue and try preview again");
   throw e;
  }finally{await session.endSession();}
  return Response.json(result,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiError(e);}
}
