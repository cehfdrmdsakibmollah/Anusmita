import mongoose from "mongoose";
import {authorize,assertOrigin,apiError,HttpError} from "@/lib/auth";
import {db} from "@/lib/db";
import {Product,WarehouseLocation,WarehouseBalance,StockMovement,OfflineSale,Audit} from "@/lib/models";
import {posSaleInput,bdBusinessDate,calculatePosCash,assertUniquePosLines} from "@/lib/offline-pos";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const roles=["owner","admin","sales"] as const;
export async function GET(request:Request){
 try{
  await authorize([...roles],"orders.view");await db();
  const u=new URL(request.url),branchId=u.searchParams.get("branchId")||"";
  const q=(u.searchParams.get("q")||"").trim().slice(0,80);
  const branches=await WarehouseLocation.find({active:true}).select("name code address active").sort({name:1}).limit(100).lean<any[]>();
  if(branchId&&!/^[a-f0-9]{24}$/i.test(branchId))throw new HttpError(400,"Invalid location ID");
  const validBranch=branches.find(b=>String(b._id)===branchId);
  if(branchId&&!validBranch)throw new HttpError(404,"Branch not active");
  const products:any[]=[];
  if(validBranch){
   const balances=await WarehouseBalance.find({locationId:branchId,quantity:{$gt:0}}).select("productId quantity").limit(500).lean<any[]>();
   const ids=balances.map(b=>b.productId);
   const search=q.replace(/[^a-zA-Z0-9 _-]/g,"");
   const filter:any={_id:{$in:ids},active:true,archived:{$ne:true}};
   if(search)filter.$or=[{name:{$regex:search,$options:"i"}},{sku:{$regex:search,$options:"i"}},{barcode:{$regex:search,$options:"i"}}];
   const rows=await Product.find(filter).select("name sku barcode category imageUrls pricePaisa onHand reserved reorderLevel").sort({name:1}).limit(120).lean<any[]>();
   const stock=new Map(balances.map(b=>[String(b.productId),Number(b.quantity)]));
   for(const row of rows)products.push({
    id:String(row._id),name:row.name,sku:row.sku,barcode:row.barcode||"",category:row.category||"",
    image:row.imageUrls?.[0]||"",pricePaisa:row.pricePaisa,
    branchStock:stock.get(String(row._id))||0,
    available:Math.min(stock.get(String(row._id))||0,Math.max(0,Number(row.onHand)-Number(row.reserved))),
    reorderLevel:Math.max(5,Number(row.reorderLevel||0))
   });
  }
  const sales=validBranch?await OfflineSale.find({branchId}).select("invoiceNumber totalPaisa createdAt cashierName branchName status lines customerName tenderedPaisa changePaisa subtotalPaisa discountPaisa").sort({createdAt:-1}).limit(25).lean<any[]>():[];
  const date=bdBusinessDate(new Date());
  const [summary,lowStock]=validBranch?await Promise.all([
   OfflineSale.aggregate([{$match:{branchId:new mongoose.Types.ObjectId(branchId),businessDate:date}},{$group:{_id:null,sales:{$sum:"$totalPaisa"},orders:{$sum:1},items:{$sum:{$sum:"$lines.quantity"}}}}]),
   WarehouseBalance.find({locationId:branchId,quantity:{$lte:5,$gt:0}}).populate("productId","sku name reorderLevel").limit(30).lean<any[]>()
  ]):[[],[]];
  const s=summary[0]||{sales:0,orders:0,items:0};
  return Response.json({branches:branches.map(b=>({id:String(b._id),name:b.name,code:b.code,address:b.address})),products,sales:sales.map(a=>({id:String(a._id),invoiceNumber:a.invoiceNumber,totalPaisa:a.totalPaisa,createdAt:a.createdAt,cashierName:a.cashierName,customerName:a.customerName})),today:{salesPaisa:s.sales||0,orders:s.orders||0,items:s.items||0},lowStock:lowStock.map(b=>({productId:String(b.productId?._id),name:b.productId?.name||"Product",sku:b.productId?.sku||"",quantity:b.quantity}))},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiError(error);}
}
export async function POST(request:Request){
 try{
  assertOrigin(request);
  const actor=await authorize([...roles],"orders.edit");
  const data=posSaleInput.parse(await request.json());
  try{assertUniquePosLines(data.lines);}catch(e){throw new HttpError(400,String(e));}
  await db();
  const session=await mongoose.startSession();
  let output:{id:string;invoiceNumber:string;alreadyApplied:boolean;totalPaisa:number;changePaisa:number}|null=null;
  try{
   await session.withTransaction(async()=>{
    const prior=await OfflineSale.findOne({operationKey:data.operationKey}).session(session).lean<any>();
    if(prior){
     const same=String(prior.branchId)===data.branchId&&prior.tenderedPaisa===data.tenderedPaisa&&prior.discountPaisa===data.discountPaisa&&
      prior.customerName===data.customerName&&prior.customerPhone===data.customerPhone&&prior.lines.length===data.lines.length&&
      data.lines.every(l=>prior.lines.some((saved:any)=>String(saved.productId)===l.productId&&saved.quantity===l.quantity));
     if(!same)throw new HttpError(409,"Idempotency key was already used for another checkout");
     output={id:String(prior._id),invoiceNumber:prior.invoiceNumber,alreadyApplied:true,totalPaisa:prior.totalPaisa,changePaisa:prior.changePaisa};return;
    }
    const branch=await WarehouseLocation.findOne({_id:data.branchId,active:true}).session(session).lean<any>();
    if(!branch)throw new HttpError(409,"Selected branch is inactive or missing");
    const sorted=[...data.lines].sort((a,b)=>a.productId.localeCompare(b.productId));
    const catalog=await Product.find({_id:{$in:sorted.map(l=>l.productId)},active:true,archived:{$ne:true}}).select("name sku pricePaisa onHand reserved").session(session).lean<any[]>();
    if(catalog.length!==sorted.length)throw new HttpError(409,"One or more products are not active");
    const lookup=new Map(catalog.map(p=>[String(p._id),p]));
    const lines=sorted.map(line=>{
     const product=lookup.get(line.productId);
     if(!product||!Number.isSafeInteger(product.pricePaisa)||product.pricePaisa<=0)throw new HttpError(409,"Invalid active product price");
     return {...line,name:product.name,sku:product.sku,unitPricePaisa:product.pricePaisa,lineTotalPaisa:product.pricePaisa*line.quantity};
    });
    let financials;
    try{financials=calculatePosCash(lines,data.discountPaisa,data.tenderedPaisa);}
    catch(e){throw new HttpError(400,e instanceof Error?e.message:"Invalid cash tender");}
    // Both the location quantity and global available stock must cover the sale.
    for(const line of lines){
     const location=await WarehouseBalance.findOneAndUpdate({locationId:data.branchId,productId:line.productId,quantity:{$gte:line.quantity}},{$inc:{quantity:-line.quantity}},{new:true,session});
     if(!location)throw new HttpError(409,"Not enough branch stock for "+line.sku+"; no sale recorded");
     const product=await Product.findOneAndUpdate({_id:line.productId,active:true,archived:{$ne:true},$expr:{$gte:[{$subtract:["$onHand","$reserved"]},line.quantity]}},{$inc:{onHand:-line.quantity}},{new:true,session});
     if(!product)throw new HttpError(409,"Global available stock changed for "+line.sku+"; no sale recorded");
     await StockMovement.create([{productId:line.productId,type:"fulfil",deltaOnHand:-line.quantity,actorId:actor.id,note:"In-store POS sale "+data.operationKey+" at "+branch.code}],{session});
    }
    const now=new Date(),date=bdBusinessDate(now);
    const invoiceNumber="POS-"+date.replace(/-/g,"")+"-"+data.operationKey.slice(0,8).toUpperCase();
    const [sale]=await OfflineSale.create([{operationKey:data.operationKey,invoiceNumber,branchId:data.branchId,branchName:branch.name,cashierId:actor.id,cashierName:actor.name,customerName:data.customerName,customerPhone:data.customerPhone,paymentMethod:"cash",lines,...financials,businessDate:date}],{session});
    await Audit.create([{actorId:actor.id,action:"pos.cash.sale.completed",entity:"OfflineSale",entityId:String(sale._id),details:{branchId:data.branchId,invoiceNumber,totalPaisa:financials.totalPaisa,items:lines.length}}],{session});
    output={id:String(sale._id),invoiceNumber,alreadyApplied:false,totalPaisa:financials.totalPaisa,changePaisa:financials.changePaisa};
   },{readConcern:{level:"snapshot"},writeConcern:{w:"majority"}});
  }finally{await session.endSession();}
  return Response.json(output,{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error:any){
  if(error?.code===11000)return Response.json({error:"Sale already recorded or concurrent sale conflict. Refresh the invoice list before retrying with the same operation key."},{status:409});
  return apiError(error);
 }
}
